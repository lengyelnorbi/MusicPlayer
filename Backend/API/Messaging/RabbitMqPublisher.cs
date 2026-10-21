using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;

namespace API.Messaging;

public sealed class RabbitMqPublisher : IAsyncDisposable
{
    private readonly RabbitMqSettings _settings;
    private readonly ILogger<RabbitMqPublisher> _logger;
    private readonly SemaphoreSlim _lock = new(1, 1);
    private IConnection? _connection;
    private IChannel? _channel;

    public RabbitMqPublisher(IOptions<RabbitMqSettings> settings, ILogger<RabbitMqPublisher> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    /// <summary>
    /// Gets or creates a RabbitMQ channel for publishing messages. If the channel and connection are already open, it returns the existing channel.
    /// </summary>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private async Task<IChannel> GetChannelAsync(CancellationToken cancellationToken)
    {
        // Ensure that only one thread can create or access the channel at a time
        await _lock.WaitAsync(cancellationToken);
        try
        {
            if (_connection?.IsOpen == true && _channel?.IsOpen == true)
            {
                return _channel;
            }
            if (_channel is not null)
            {
                await _channel.DisposeAsync();
            }
            if (_connection is not null)
            {
                await _connection.DisposeAsync();
            }

            var factory = new ConnectionFactory
            {
                HostName = _settings.Host,
                Port = _settings.Port,
                UserName = _settings.UserName,
                Password = _settings.Password,
                VirtualHost = _settings.VirtualHost
            };

            // Create a new connection and channel to RabbitMQ, and declare the necessary queues for work and control messages
            _connection = await factory.CreateConnectionAsync(cancellationToken);
            // Create a new channel for publishing messages
            _channel = await _connection.CreateChannelAsync(cancellationToken: cancellationToken);
            // Declare the work queue and single work queue with durable, non-exclusive, and non-auto-delete settings
            await _channel.QueueDeclareAsync(
                queue: _settings.WorkQueue,
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: null,
                cancellationToken: cancellationToken);
            // Declare the single work queue with durable, non-exclusive, and non-auto-delete settings
            await _channel.QueueDeclareAsync(
                queue: _settings.SingleWorkQueue,
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: null,
                cancellationToken: cancellationToken);

            _logger.LogInformation("RabbitMQ publisher connected.");
            return _channel;
        }
        finally
        {
            _lock.Release();
        }
    }

    /// <summary>
    /// Publishes a work message to the specified RabbitMQ queue. The message is serialized to JSON and sent to the queue for processing by consumers.
    /// </summary>
    /// <typeparam name="T"></typeparam>
    /// <param name="message"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task PublishWorkAsync<T>(T message, CancellationToken cancellationToken = default)
    {
        // Publish the work message to the work queue for processing by consumers
        await PublishWorkAsync(message, _settings.WorkQueue, cancellationToken);
    }

    /// <summary>
    /// Publishes a single work message to the specified RabbitMQ queue. The message is serialized
    /// to JSON and sent to the queue for processing by consumers. This is used for messages that should be processed individually.
    /// </summary>
    /// <typeparam name="T"></typeparam>
    /// <param name="message"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task PublishSingleWorkAsync<T>(T message, CancellationToken cancellationToken = default)
    {
        // Publish the single work message to the single work queue for processing by consumers
        await PublishWorkAsync(message, _settings.SingleWorkQueue, cancellationToken);
    }

    /// <summary>
    /// Publishes a work message to the specified RabbitMQ queue. The message is serialized to JSON and sent to the queue for processing by consumers. 
    /// This method is used internally by the PublishWorkAsync and PublishSingleWorkAsync methods.
    /// </summary>
    /// <typeparam name="T"></typeparam>
    /// <param name="message"></param>
    /// <param name="queue"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private async Task PublishWorkAsync<T>(T message, string queue, CancellationToken cancellationToken)
    {
        // Get or create a RabbitMQ channel for publishing messages
        var channel = await GetChannelAsync(cancellationToken);
        // Declare the specified queue with durable, non-exclusive, and non-auto-delete settings
        var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(message));
        // Publish the message to the specified queue with the serialized JSON body
        await channel.BasicPublishAsync(
            exchange: string.Empty,
            routingKey: queue,
            body: body,
            cancellationToken: cancellationToken);
        _logger.LogInformation("Published work message to {Queue}", queue);
    }

    /// <summary>
    /// Publishes a control message to the RabbitMQ control queue. The message is serialized to
    /// JSON and sent to the queue for processing by consumers. This is used for messages that control the behavior of the system.
    /// </summary>
    /// <typeparam name="T"></typeparam>
    /// <param name="message"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task PublishControlAsync<T>(T message, CancellationToken cancellationToken = default)
    {
        // Get or create a RabbitMQ channel for publishing messages
        var channel = await GetChannelAsync(cancellationToken);
        // Declare the control queue with durable, non-exclusive, and non-auto-delete settings
        await channel.QueueDeclareAsync(_settings.ControlQueue, durable: true, exclusive: false,
            autoDelete: false, arguments: null, cancellationToken: cancellationToken);
        // Serialize the control message to JSON and publish it to the control queue
        var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(message));
        // Publish the control message to the control queue with the serialized JSON body
        await channel.BasicPublishAsync(
            exchange: string.Empty,
            routingKey: _settings.ControlQueue,
            body: body,
            cancellationToken: cancellationToken);
    }

    /// <summary>
    /// Disposes of the RabbitMQ channel and connection if they exist, and releases the semaphore lock. This method is called when the publisher is no longer needed to clean up resources.
    /// </summary>
    /// <returns></returns>
    public async ValueTask DisposeAsync()
    {
        if (_channel is not null)
        {
            // Dispose of the RabbitMQ channel if it exists, releasing any resources associated with it
            await _channel.DisposeAsync();
        }
        if (_connection is not null)
        {
            // Dispose of the RabbitMQ connection if it exists, releasing any resources associated with it
            await _connection.DisposeAsync();
        }
        // Dispose of the semaphore lock to release any resources associated with it
        _lock.Dispose();
    }
}
