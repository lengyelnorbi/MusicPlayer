using API.Models.Enums;

namespace API.Models.ResponseModels;

public class CreateMusicImportResponse
{
    public Guid JobId { get; set; }

    public JobType Type { get; set; }

    public JobStatus Status { get; set; }

    public int TotalItems { get; set; }
}