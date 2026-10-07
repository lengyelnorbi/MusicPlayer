using API.Models.Enums;

namespace API.Models.QueueModels;

public class ImportJob
{
    public Guid Id { get; set; }

    public int UserId { get; set; }

    public string SourceUrl { get; set; } = string.Empty;

    public JobType Type { get; set; }

    public JobStatus Status { get; set; }

    public int TotalItems { get; set; }

    public int CompletedItems { get; set; }

    public int FailedItems { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    // Add this
    public ICollection<ImportWorkItem> WorkItems { get; set; }
        = new List<ImportWorkItem>();
}