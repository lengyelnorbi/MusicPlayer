namespace API.Models;

public record MusicUploadMessage
{
    public Guid JobId { get; init; }
    public string FileUrl { get; init; } = string.Empty;
}