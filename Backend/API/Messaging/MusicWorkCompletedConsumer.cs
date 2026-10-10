using System.Text;
using System.Text.Json;
using API.Data;
using API.Hubs;
using API.Messaging.Messages;
using API.Models.Enums;
using API.Models.ResponseModels;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace API.Messaging;

public class MusicWorkCompletedConsumer : BackgroundService
{
    private readonly RabbitMqSettings _settings;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHubContext<MusicImportHub> _hubContext;
    private readonly ILogger<MusicWorkCompletedConsumer> _logger;
    private IConnection? _connection;
    private IChannel? _channel;

    public MusicWorkCompletedConsumer(
        IOptions<RabbitMqSettings> settings,
        IServiceScopeFactory scopeFactory,
        IHubContext<MusicImportHub> hubContext,
        ILogger<MusicWorkCompletedConsumer> logger)
    {
        _settings = settings.Value;
        _scopeFactory = scopeFactory;
        _hubContext = hubContext;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var factory = new ConnectionFactory
        {
            HostName = _settings.Host,
            Port = _settings.Port,
            UserName = _settings.UserName,
            Password = _settings.Password,
            VirtualHost = _settings.VirtualHost
        };

        _connection = await factory.CreateConnectionAsync(stoppingToken);
        _channel = await _connection.CreateChannelAsync(cancellationToken: stoppingToken);
        await _channel.QueueDeclareAsync(_settings.CompletedQueue, durable: true, exclusive: false,
            autoDelete: false, arguments: null, cancellationToken: stoppingToken);
        await _channel.BasicQosAsync(0, 1, false, stoppingToken);

        var consumer = new AsyncEventingBasicConsumer(_channel);
        consumer.ReceivedAsync += (_, args) => ProcessMessageAsync(args, stoppingToken);
        await _channel.BasicConsumeAsync(_settings.CompletedQueue, autoAck: false, consumer, stoppingToken);
        _logger.LogInformation("Music completion consumer started.");

        try { await Task.Delay(Timeout.Infinite, stoppingToken); }
        catch (OperationCanceledException) { /* Normal shutdown. */ }
    }

    private async Task ProcessMessageAsync(BasicDeliverEventArgs args, CancellationToken cancellationToken)
    {
        try
        {
            var json = Encoding.UTF8.GetString(args.Body.ToArray());
            var message = JsonSerializer.Deserialize<MusicWorkCompletedMessage>(json);
            if (message is null)
            {
                _logger.LogError("Could not deserialize completion message.");
                await _channel!.BasicNackAsync(args.DeliveryTag, multiple: false, requeue: false);
                return;
            }

            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<MusicPlayerDbContext>();
            var workItem = await db.ImportWorkItems.FirstOrDefaultAsync(
                x => x.Id == message.WorkItemId && x.JobId == message.JobId, cancellationToken);

            if (workItem is null)
            {
                _logger.LogWarning("Work item {WorkItemId} not found.", message.WorkItemId);
                await _channel!.BasicAckAsync(args.DeliveryTag, multiple: false);
                return;
            }

            if (workItem.Status is WorkStatus.Completed or WorkStatus.Failed or WorkStatus.Downloaded)
            {
                await _channel!.BasicAckAsync(args.DeliveryTag, multiple: false);
                return;
            }

            var job = await db.ImportJobs.Include(x => x.WorkItems).FirstOrDefaultAsync(
                x => x.Id == message.JobId, cancellationToken);
            if (job is null)
            {
                _logger.LogWarning("Job {JobId} not found.", message.JobId);
                await _channel!.BasicAckAsync(args.DeliveryTag, multiple: false);
                return;
            }

            workItem.CompletedAt = DateTime.UtcNow;
            if (message.Forbidden)
            {
                foreach (var item in job.WorkItems)
                {
                    if (item.Status is WorkStatus.Completed or WorkStatus.Downloaded)
                        continue;
                    item.Status = WorkStatus.Pending;
                    item.StartedAt = null;
                    item.CompletedAt = null;
                    item.Error = message.Error ?? "The download proxy was forbidden by YouTube.";
                }

                RecalculateCounters(job);
                job.Status = JobStatus.Paused;
                job.CompletedAt = null;
                job.Error = message.Error ?? "The download was paused because the proxy returned HTTP 403 Forbidden.";
            }
            else if (message.Success && !string.IsNullOrWhiteSpace(message.FilePath) &&
                !string.IsNullOrWhiteSpace(message.FileName))
            {
                workItem.Status = WorkStatus.Completed;
                workItem.TemporaryFilePath = message.FilePath;
                workItem.TemporaryFileName = Path.GetFileName(message.FileName);
                workItem.Title = message.Title;
                workItem.Error = null;
                RecalculateCounters(job);
            }
            else
            {
                workItem.Status = WorkStatus.Failed;
                workItem.Error = message.Success
                    ? "Worker reported success without a file path or filename."
                    : message.Error ?? "Download failed.";
                RecalculateCounters(job);
            }

            var finished = job.Status != JobStatus.Paused &&
                job.CompletedItems + job.FailedItems >= job.TotalItems;
            if (finished)
            {
                job.Status = job.FailedItems > 0 ? JobStatus.CompletedWithErrors : JobStatus.Completed;
                job.CompletedAt = DateTime.UtcNow;
            }
            else if (job.Status != JobStatus.Paused)
            {
                job.Status = JobStatus.Processing;
            }

            await db.SaveChangesAsync(cancellationToken);
            var progress = new ImportJobProgress
            {
                JobId = job.Id,
                Status = job.Status,
                TotalItems = job.TotalItems,
                CompletedItems = job.CompletedItems,
                FailedItems = job.FailedItems
            };
            await _hubContext.Clients.Group($"job:{job.Id}")
                .SendAsync("JobProgress", progress, cancellationToken);
            await _channel!.BasicAckAsync(args.DeliveryTag, multiple: false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing music completion message.");
            if (_channel is not null)
                await _channel.BasicNackAsync(args.DeliveryTag, multiple: false, requeue: true);
        }
    }

    private static void RecalculateCounters(API.Models.QueueModels.ImportJob job)
    {
        job.CompletedItems = job.WorkItems.Count(item =>
            item.Status is WorkStatus.Completed or WorkStatus.Downloaded);
        job.FailedItems = job.WorkItems.Count(item => item.Status == WorkStatus.Failed);
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        if (_channel is not null) await _channel.DisposeAsync();
        if (_connection is not null) await _connection.DisposeAsync();
        await base.StopAsync(cancellationToken);
    }
}
