namespace API.Models.Enums;

public enum JobStatus
{
    Pending = 0,
    Processing = 1,
    Completed = 2,
    CompletedWithErrors = 3,
    Failed = 4,
    Paused = 5
}
