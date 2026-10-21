namespace API.Messaging;

public class RabbitMqSettings
{
    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 5672;
    public string UserName { get; set; } = "guest";
    public string Password { get; set; } = "guest";
    public string VirtualHost { get; set; } = "/";
    public string WorkQueue { get; set; } = "music.work";
    public string SingleWorkQueue { get; set; } = "music.work.single";
    public string CompletedQueue { get; set; } = "music.work.completed";
    public string ControlQueue { get; set; } = "music.work.control";
}
