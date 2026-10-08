using API.Models.Enums;

namespace API.Models.ResponseModels;

public class ImportJobProgressDTO
{
    public Guid JobId { get; set; }
    public JobStatus Status { get; set; }
    public int TotalItems { get; set; }
    public int CompletedItems { get; set; }
    public int FailedItems { get; set; }

    public int RemainingItems => Math.Max(0, TotalItems - CompletedItems - FailedItems);
    public int ProgressPercentage => TotalItems == 0
        ? 0
        : (int)Math.Round((double)(CompletedItems + FailedItems) / TotalItems * 100);
}
