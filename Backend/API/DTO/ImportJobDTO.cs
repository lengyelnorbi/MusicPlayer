using API.Models.Enums;

namespace API.Models.DTO;

public class ImportJobDTO
{
    public Guid Id { get; set; }
    public string SourceUrl { get; set; } = string.Empty;
    public JobType Type { get; set; }
    public JobStatus Status { get; set; }
    public int TotalItems { get; set; }
    public int CompletedItems { get; set; }
    public int FailedItems { get; set; }
    public int RemainingItems => Math.Max(0, TotalItems - CompletedItems - FailedItems);
    public int ProgressPercentage => TotalItems == 0
        ? 0
        : (int)Math.Round((double)(CompletedItems + FailedItems) / TotalItems * 100);
    public DateTime CreatedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public List<ImportWorkItemDTO> WorkItems { get; set; } = new();
}
