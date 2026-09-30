using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using API.Services.Interfaces;
using API.Models;

namespace API.Services;
public class AdvancedMsgQueueCommService : IAdvancedMsgQueueCommService
{
    private const string QueueName = "music-upload";

    private readonly ILogger<AdvancedMsgQueueCommService> _logger;
    private readonly IConfiguration _configuration;

    public AdvancedMsgQueueCommService(
        ILogger<AdvancedMsgQueueCommService> logger,
        IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    public MusicUploadMessage CreateMusicUploadMessage(string link)
    {
        
        var message = new MusicUploadMessage
        {
            JobId = Guid.NewGuid(),
            FileUrl = link
        };

        _logger.LogInformation(
            "Created music upload message {JobId}",
            message.JobId);

        return message;
    }

    public async Task SendMessageAsync(MusicUploadMessage message)
    {
        var host = _configuration["RabbitMQ:Host"] ?? "localhost";
        var port = _configuration.GetValue<int?>("RabbitMQ:Port") ?? 5672;
        var username = _configuration["RabbitMQ:Username"] ?? "guest";
        var password = _configuration["RabbitMQ:Password"] ?? "guest";

        var factory = new ConnectionFactory
        {
            HostName = host,
            Port = port,
            UserName = username,
            Password = password
        };

        await using var connection = await factory.CreateConnectionAsync();
        await using var channel = await connection.CreateChannelAsync();

        await channel.QueueDeclareAsync(
            queue: "music-upload",
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: null);

        var json = JsonSerializer.Serialize(
            message,
            new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

        _logger.LogInformation(
            "Publishing RabbitMQ message: {Message}",
            json);

        var body = Encoding.UTF8.GetBytes(json);

        var properties = new BasicProperties
        {
            Persistent = true,
            ContentType = "application/json"
        };

        await channel.BasicPublishAsync(
            exchange: string.Empty,
            routingKey: "music-upload",
            mandatory: false,
            basicProperties: properties,
            body: body);

        _logger.LogInformation(
            "Published music upload job {JobId} to RabbitMQ",
            message.JobId);
    }
}