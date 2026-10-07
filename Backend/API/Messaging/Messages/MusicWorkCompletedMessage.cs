namespace API.Messaging.Messages;

public class MusicWorkCompletedMessage
{
    public Guid JobId { get; set; }

    public Guid WorkItemId { get; set; }

    public int UserId { get; set; }

    public bool Success { get; set; }

    public int? MusicId { get; set; }

    public string? FilePath { get; set; }

    public string? FileName { get; set; }

    public string? Error { get; set; }
}