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

public class MusicWorkCompletedConsumer
    : BackgroundService
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

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        var factory = new ConnectionFactory
        {
            HostName = _settings.Host,
            Port = _settings.Port,
            UserName = _settings.UserName,
            Password = _settings.Password,
            VirtualHost = _settings.VirtualHost
        };

        _connection =
            await factory.CreateConnectionAsync(
                cancellationToken: stoppingToken);

        _channel =
            await _connection.CreateChannelAsync(
                cancellationToken: stoppingToken);

        await _channel.QueueDeclareAsync(
            queue: _settings.CompletedQueue,
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: null,
            cancellationToken: stoppingToken);

        // Only process one completion message at a time.
        await _channel.BasicQosAsync(
            prefetchSize: 0,
            prefetchCount: 1,
            global: false,
            cancellationToken: stoppingToken);

        var consumer =
            new AsyncEventingBasicConsumer(_channel);

        consumer.ReceivedAsync += async (_, args) =>
        {
            await ProcessMessageAsync(
                args,
                stoppingToken);
        };

        await _channel.BasicConsumeAsync(
            queue: _settings.CompletedQueue,
            autoAck: false,
            consumer: consumer,
            cancellationToken: stoppingToken);

        _logger.LogInformation(
            "Music completion consumer started.");

        try
        {
            await Task.Delay(
                Timeout.Infinite,
                stoppingToken);
        }
        catch (OperationCanceledException)
        {
        }
    }

    private async Task ProcessMessageAsync(
        BasicDeliverEventArgs args,
        CancellationToken cancellationToken)
    {
        try
        {
            var json = Encoding.UTF8.GetString(
                args.Body.ToArray());

            var message =
                JsonSerializer.Deserialize<MusicWorkCompletedMessage>(
                    json);

            if (message == null)
            {
                _logger.LogError(
                    "Could not deserialize completion message.");

                await _channel!.BasicNackAsync(
                    args.DeliveryTag,
                    multiple: false,
                    requeue: false);

                return;
            }

            using var scope =
                _scopeFactory.CreateScope();

            var db =
                scope.ServiceProvider
                    .GetRequiredService<MusicPlayerDbContext>();

            var workItem =
                await db.ImportWorkItems
                    .FirstOrDefaultAsync(
                        x => x.Id == message.WorkItemId,
                        cancellationToken);

            if (workItem == null)
            {
                _logger.LogWarning(
                    "Work item {WorkItemId} not found.",
                    message.WorkItemId);

                await _channel!.BasicAckAsync(
                    args.DeliveryTag,
                    multiple: false);

                return;
            }

            // Prevent duplicate completion messages
            // from incrementing counters twice.
            if (workItem.Status == WorkStatus.Completed ||
                workItem.Status == WorkStatus.Failed)
            {
                await _channel!.BasicAckAsync(
                    args.DeliveryTag,
                    multiple: false);

                return;
            }

            var job =
                await db.ImportJobs
                    .FirstOrDefaultAsync(
                        x => x.Id == message.JobId,
                        cancellationToken);

            if (job == null)
            {
                _logger.LogWarning(
                    "Job {JobId} not found.",
                    message.JobId);

                await _channel!.BasicAckAsync(
                    args.DeliveryTag,
                    multiple: false);

                return;
            }

            if (message.Success)
            {
                workItem.Status =
                    WorkStatus.Completed;

                workItem.CompletedAt =
                    DateTime.UtcNow;

                job.CompletedItems++;
            }
            else
            {
                workItem.Status =
                    WorkStatus.Failed;

                workItem.Error =
                    message.Error;

                workItem.CompletedAt =
                    DateTime.UtcNow;

                job.FailedItems++;
            }

            var finished =
                job.CompletedItems +
                job.FailedItems >=
                job.TotalItems;

            if (finished)
            {
                if (job.FailedItems > 0)
                {
                    job.Status =
                        JobStatus.CompletedWithErrors;
                }
                else
                {
                    job.Status =
                        JobStatus.Completed;
                }

                job.CompletedAt =
                    DateTime.UtcNow;
            }
            else
            {
                job.Status =
                    JobStatus.Processing;
            }

            await db.SaveChangesAsync(
                cancellationToken);

            var progress =
                new ImportJobProgress
                {
                    JobId = job.Id,
                    Status = job.Status,
                    TotalItems = job.TotalItems,
                    CompletedItems =
                        job.CompletedItems,
                    FailedItems =
                        job.FailedItems
                };

            await _hubContext.Clients
                .Group($"job:{job.Id}")
                .SendAsync(
                    "JobProgress",
                    progress,
                    cancellationToken);

            await _channel!.BasicAckAsync(
                args.DeliveryTag,
                multiple: false);

            _logger.LogInformation(
                "Processed work item {WorkItemId}. Job {JobId}: {Completed}/{Total}",
                workItem.Id,
                job.Id,
                job.CompletedItems,
                job.TotalItems);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Error processing music completion message.");

            // Requeue so the message isn't lost.
            await _channel!.BasicNackAsync(
                args.DeliveryTag,
                multiple: false,
                requeue: true);
        }
    }

    public override async Task StopAsync(
        CancellationToken cancellationToken)
    {
        if (_channel != null)
            await _channel.DisposeAsync();

        if (_connection != null)
            await _connection.DisposeAsync();

        await base.StopAsync(
            cancellationToken);
    }
}