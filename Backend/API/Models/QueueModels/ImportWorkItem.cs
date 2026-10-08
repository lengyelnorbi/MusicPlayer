using API.Models.Enums;

namespace API.Models.QueueModels;

public class ImportWorkItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid JobId { get; set; }
    public string Url { get; set; } = string.Empty;
    public WorkStatus Status { get; set; } = WorkStatus.Pending;
    public int AttemptCount { get; set; }
    public string? Error { get; set; }
    public string? Title { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Relative to the shared MusicStorage:TempPath root, never an absolute path.
    public string? TemporaryFilePath { get; set; }
    public string? TemporaryFileName { get; set; }

    public ImportJob Job { get; set; } = null!;
}
