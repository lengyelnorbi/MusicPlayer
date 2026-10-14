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

    public MusicWorkCompletedConsumer(IOptions<RabbitMqSettings> settings, IServiceScopeFactory scopeFactory, IHubContext<MusicImportHub> hubContext, ILogger<MusicWorkCompletedConsumer> logger)
    {
        _settings = settings.Value;
        _scopeFactory = scopeFactory;
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <summary>
    /// Executes the background service, establishing a connection to RabbitMQ and consuming messages from the specified
    /// queue. It processes each message asynchronously and handles any exceptions that may occur during processing.
    /// </summary>
    /// <param name="stoppingToken"></param>
    /// <returns></returns>
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Create a connection factory for RabbitMQ using the provided settings
        var factory = new ConnectionFactory
        {
            HostName = _settings.Host,
            Port = _settings.Port,
            UserName = _settings.UserName,
            Password = _settings.Password,
            VirtualHost = _settings.VirtualHost
        };

        // Establish a connection and channel to RabbitMQ, and declare the queue for completed music work items
        _connection = await factory.CreateConnectionAsync(stoppingToken);
        // Create a channel for communication with RabbitMQ
        _channel = await _connection.CreateChannelAsync(cancellationToken: stoppingToken);
        // Declare the queue for completed music work items, ensuring it is durable and not exclusive or auto-deleted
        await _channel.QueueDeclareAsync(_settings.CompletedQueue, durable: true, exclusive: false,
            autoDelete: false, arguments: null, cancellationToken: stoppingToken);
        // Set the Quality of Service (QoS) for the channel to process one message at a time
        await _channel.BasicQosAsync(0, 1, false, stoppingToken);

        // Create an asynchronous eventing consumer to handle incoming messages from the queue
        var consumer = new AsyncEventingBasicConsumer(_channel);
        // Subscribe to the Received event of the consumer, which will be triggered when a message is received
        consumer.ReceivedAsync += (_, args) => ProcessMessageAsync(args, stoppingToken);
        // Start consuming messages from the completed queue, with manual acknowledgment of messages
        await _channel.BasicConsumeAsync(_settings.CompletedQueue, autoAck: false, consumer, stoppingToken);
        _logger.LogInformation("Music completion consumer started.");

        try { await Task.Delay(Timeout.Infinite, stoppingToken); }
        catch (OperationCanceledException) { /* Normal shutdown. */ }
    }

    /// <summary>
    /// Processes a received message from the RabbitMQ queue, deserializing it into a MusicWorkCompletedMessage object,
    /// updating the corresponding work item and job in the database, and sending progress updates to connected clients via SignalR. 
    /// It handles various scenarios, including forbidden downloads, successful completions, and failures, and acknowledges or negatively acknowledges the message based on the processing outcome.
    /// </summary>
    /// <param name="args"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private async Task ProcessMessageAsync(BasicDeliverEventArgs args, CancellationToken cancellationToken)
    {
        try
        {
            // Deserialize the message body into a MusicWorkCompletedMessage object
            var json = Encoding.UTF8.GetString(args.Body.ToArray());
            // Log the received message for debugging purposes
            var message = JsonSerializer.Deserialize<MusicWorkCompletedMessage>(json);
            if (message is null)
            {
                _logger.LogError("Could not deserialize completion message.");
                // Negatively acknowledge the message without requeueing it, as it cannot be processed
                await _channel!.BasicNackAsync(args.DeliveryTag, multiple: false, requeue: false);
                return;
            }

            // Create a new scope for accessing the database context
            using var scope = _scopeFactory.CreateScope();
            // Retrieve the database context from the service provider
            var db = scope.ServiceProvider.GetRequiredService<MusicPlayerDbContext>();
            // Find the work item in the database that matches the message's WorkItemId and JobId
            var workItem = await db.ImportWorkItems.FirstOrDefaultAsync(x => x.Id == message.WorkItemId && x.JobId == message.JobId, cancellationToken);

            if (workItem is null)
            {
                _logger.LogWarning("Work item {WorkItemId} not found.", message.WorkItemId);
                // Acknowledge the message to remove it from the queue, as the work item cannot be found
                await _channel!.BasicAckAsync(args.DeliveryTag, multiple: false);
                return;
            }

            if (workItem.Status is WorkStatus.Completed or WorkStatus.Failed or WorkStatus.Downloaded)
            {
                // Log a warning if the work item has already been processed and acknowledge the message to remove it from the queue
                await _channel!.BasicAckAsync(args.DeliveryTag, multiple: false);
                return;
            }

            // Retrieve the import job associated with the work item, including its related work items, from the database
            var job = await db.ImportJobs.Include(x => x.WorkItems).FirstOrDefaultAsync(x => x.Id == message.JobId, cancellationToken);
            if (job is null)
            {
                _logger.LogWarning("Job {JobId} not found.", message.JobId);
                // Acknowledge the message to remove it from the queue, as the job cannot be found
                await _channel!.BasicAckAsync(args.DeliveryTag, multiple: false);
                return;
            }

            workItem.CompletedAt = DateTime.UtcNow;
            if (message.Forbidden)
            {
                foreach (var item in job.WorkItems)
                {
                    if (item.Status is WorkStatus.Completed or WorkStatus.Downloaded)
                    {
                        continue;
                    }
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
            else if (message.Success && !string.IsNullOrWhiteSpace(message.FilePath) && !string.IsNullOrWhiteSpace(message.FileName))
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
                workItem.Error = message.Success ? "Worker reported success without a file path or filename." : message.Error ?? "Download failed.";
                RecalculateCounters(job);
            }

            // Determine if the job is finished based on the completed and failed items, and update its status accordingly
            var finished = job.Status != JobStatus.Paused && job.CompletedItems + job.FailedItems >= job.TotalItems;
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
            // Send the progress update to all clients connected to the SignalR group associated with the job
            await _hubContext.Clients.Group($"job:{job.Id}")
                .SendAsync("JobProgress", progress, cancellationToken);
            // Acknowledge the message to remove it from the queue, indicating successful processing
            await _channel!.BasicAckAsync(args.DeliveryTag, multiple: false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing music completion message.");
            if (_channel is not null)
            {
                // Negatively acknowledge the message and requeue it for later processing, as an error occurred during processing
                await _channel.BasicNackAsync(args.DeliveryTag, multiple: false, requeue: true);
            }
        }
    }

    /// <summary>
    /// Recalculates the completed and failed item counters for the specified import job based on the statuses of its work items. 
    /// This method updates the CompletedItems and FailedItems properties of the job to reflect the current state of its work items.
    /// </summary>
    /// <param name="job"></param>
    /// <returns></returns>
    private static void RecalculateCounters(API.Models.QueueModels.ImportJob job)
    {
        job.CompletedItems = job.WorkItems.Count(item => item.Status is WorkStatus.Completed or WorkStatus.Downloaded);
        job.FailedItems = job.WorkItems.Count(item => item.Status == WorkStatus.Failed);
    }

    /// <summary>
    /// Stops the background service, disposing of the RabbitMQ channel and connection if they exist, and then calls the base StopAsync method to complete the shutdown process. 
    /// This ensures that resources are properly released when the service is stopped.
    /// </summary>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        if (_channel is not null)
        {
            // Dispose of the RabbitMQ channel to release resources and close the channel
            await _channel.DisposeAsync();
        }
        if (_connection is not null)
        {
            // Dispose of the RabbitMQ connection to release resources and close the connection
            await _connection.DisposeAsync();
        }
        // Call the base StopAsync method to complete the shutdown process of the background service
        await base.StopAsync(cancellationToken);
    }
}
