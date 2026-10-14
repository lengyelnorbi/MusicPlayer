using API.Models.Enums;

namespace API.DTO;

public class MusicUploadRequestDTO
{
    public Guid Id { get; set; }
    public int UserId { get; set; }
    public string? Username { get; set; }
    public string Url { get; set; } = string.Empty;
    public MusicRequestStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public Guid? ImportJobId { get; set; }
    public string? AdminNote { get; set; }
}
