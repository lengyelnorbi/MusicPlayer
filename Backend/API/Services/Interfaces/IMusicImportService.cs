using API.Models.QueueModels;
using API.Models.DTO;
using API.Models.ResponseModels;

namespace API.Services.Interfaces;

public interface IMusicImportService
{
    Task<CreateMusicImportResponse> CreateImportAsync(int userId, string url, CancellationToken cancellationToken = default);
    Task<ImportJobProgressDTO?> GetJobProgressAsync(int userId, Guid jobId, CancellationToken cancellationToken = default);
    Task<ImportJobDTO?> GetJobAsync(int userId, Guid jobId, CancellationToken cancellationToken = default);
    Task<ImportWorkItem?> GetWorkItemByIdAsync(Guid workItemId, int userId, CancellationToken cancellationToken = default);
}
