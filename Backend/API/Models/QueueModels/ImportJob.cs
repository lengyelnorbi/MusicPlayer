using API.Models.Enums;

namespace API.Models.QueueModels;

public class ImportJob
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int UserId { get; set; }
    public string SourceUrl { get; set; } = string.Empty;
    public JobType Type { get; set; } = JobType.SingleVideo;
    public JobStatus Status { get; set; } = JobStatus.Pending;
    public int TotalItems { get; set; }
    public int CompletedItems { get; set; }
    public int FailedItems { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Error { get; set; }

    public ICollection<ImportWorkItem> WorkItems { get; set; } = new List<ImportWorkItem>();
}
