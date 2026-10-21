namespace API.Messaging.Messages;

public class MusicWorkCompletedMessage
{
    public Guid JobId { get; set; }
    public Guid WorkItemId { get; set; }
    public int UserId { get; set; }
    public bool Success { get; set; }
    // Relative to MusicStorage:TempPath, e.g. "<work-item-guid>/song.m4a".
    public string? FilePath { get; set; }
    public string? FileName { get; set; }
    public string? Title { get; set; }
    public string? Error { get; set; }
    public bool Forbidden { get; set; }
}
