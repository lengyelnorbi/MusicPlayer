using API.Models.Enums;

namespace API.Models.QueueModels;

public class ImportWorkItem
{
    public Guid Id { get; set; }

    public Guid JobId { get; set; }

    public string Url { get; set; } = string.Empty;

    public WorkStatus Status { get; set; }

    public int AttemptCount { get; set; }

    public string? Error { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? StartedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public ImportJob Job { get; set; } = null!;
}