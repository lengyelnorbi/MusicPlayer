namespace API.Messaging.Messages;

public class MusicWorkMessage
{
    public Guid JobId { get; set; }
    public Guid WorkItemId { get; set; }
    public int UserId { get; set; }
    public string Url { get; set; } = string.Empty;
    public int Attempt { get; set; }
}
