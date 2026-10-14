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

    public AdvancedMsgQueueCommService(ILogger<AdvancedMsgQueueCommService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    /// <summary>
    /// Creates a new music upload message with a unique job ID and the provided file URL. This message is intended to be sent to the advanced message queue for processing. 
    /// The method logs the creation of the message for tracking purposes.
    /// </summary>
    /// <param name="link"></param>
    /// <returns></returns>
    public MusicUploadMessage CreateMusicUploadMessage(string link)
    {
        var message = new MusicUploadMessage
        {
            JobId = Guid.NewGuid(),
            FileUrl = link
        };

        _logger.LogInformation("Created music upload message {JobId}", message.JobId);

        return message;
    }

    /// <summary>
    /// Sends the provided music upload message to the RabbitMQ queue for processing. 
    /// The method establishes a connection to the RabbitMQ server, declares the queue, serializes the message to JSON, and publishes it to the queue. 
    /// It also logs the publishing of the message for tracking purposes.
    /// </summary>
    /// <param name="message"></param>
    /// <returns></returns>
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

        // Establish a connection to RabbitMQ and create a channel for publishing messages
        await using var connection = await factory.CreateConnectionAsync();
        // Create a channel for publishing messages to the RabbitMQ queue
        await using var channel = await connection.CreateChannelAsync();

        // Declare the music upload queue with durable, non-exclusive, and non-auto-delete settings
        await channel.QueueDeclareAsync(
            queue: "music-upload",
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: null);

        // Serialize the music upload message to JSON and publish it to the queue
        var json = JsonSerializer.Serialize(message, new JsonSerializerOptions{ PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        _logger.LogInformation("Publishing RabbitMQ message: {Message}", json);

        // Convert the serialized JSON message to a byte array for publishing
        var body = Encoding.UTF8.GetBytes(json);

        // Set the message properties to make it persistent and specify the content type as JSON
        var properties = new BasicProperties
        {
            Persistent = true,
            ContentType = "application/json"
        };

        // Publish the music upload message to the RabbitMQ queue with the specified properties and serialized JSON body
        await channel.BasicPublishAsync(
            exchange: string.Empty,
            routingKey: "music-upload",
            mandatory: false,
            basicProperties: properties,
            body: body);

        _logger.LogInformation("Published music upload job {JobId} to RabbitMQ", message.JobId);
    }
}