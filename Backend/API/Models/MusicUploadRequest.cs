using API.Models.Enums;

namespace API.Models;

public class MusicUploadRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int UserId { get; set; }
    public string Url { get; set; } = string.Empty;
    public MusicRequestStatus Status { get; set; } = MusicRequestStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }
    public Guid? ImportJobId { get; set; }
    public string? AdminNote { get; set; }
}
