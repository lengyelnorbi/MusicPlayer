namespace API.Models;

public record Message
{
    public Guid GuidID { get; init; }
    public string Type { get; init; } = "MusicUpload";
    public string MessageContent { get; init; } = "Default message";
    public string? Error { get; init; }
}