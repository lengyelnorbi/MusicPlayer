using API.Models.Enums;

namespace API.Models.DTO;

public class ImportWorkItemDTO
{
    public Guid Id { get; set; }
    public Guid JobId { get; set; }
    public string Url { get; set; } = string.Empty;
    public string? Title { get; set; }
    public WorkStatus Status { get; set; }
    public int AttemptCount { get; set; }
    public string? Error { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool CanDownload { get; set; }
}
