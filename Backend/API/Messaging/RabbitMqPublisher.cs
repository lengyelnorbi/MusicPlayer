using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;

namespace API.Messaging;

public class RabbitMqPublisher : IAsyncDisposable
{
    private readonly RabbitMqSettings _settings;
    private readonly ILogger<RabbitMqPublisher> _logger;

    private IConnection? _connection;
    private IChannel? _channel;

    public RabbitMqPublisher(
        IOptions<RabbitMqSettings> settings,
        ILogger<RabbitMqPublisher> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    private async Task<IChannel> GetChannelAsync()
    {
        if (_connection != null &&
            _connection.IsOpen &&
            _channel != null &&
            _channel.IsOpen)
        {
            return _channel;
        }

        var factory = new ConnectionFactory
        {
            HostName = _settings.Host,
            Port = _settings.Port,
            UserName = _settings.UserName,
            Password = _settings.Password,
            VirtualHost = _settings.VirtualHost
        };

        _connection = await factory.CreateConnectionAsync();

        _channel = await _connection.CreateChannelAsync();

        await _channel.QueueDeclareAsync(
            queue: _settings.WorkQueue,
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: null);

        _logger.LogInformation(
            "RabbitMQ publisher connected.");

        return _channel;
    }

    public async Task PublishWorkAsync(
        object message,
        CancellationToken cancellationToken = default)
    {
        var channel = await GetChannelAsync();

        var json = JsonSerializer.Serialize(message);

        var body = Encoding.UTF8.GetBytes(json);

        await channel.BasicPublishAsync(
            exchange: string.Empty,
            routingKey: _settings.WorkQueue,
            body: body,
            cancellationToken: cancellationToken);

        _logger.LogInformation(
            "Published work message to {Queue}",
            _settings.WorkQueue);
    }

    public async ValueTask DisposeAsync()
    {
        if (_channel != null)
            await _channel.DisposeAsync();

        if (_connection != null)
            await _connection.DisposeAsync();
    }
}