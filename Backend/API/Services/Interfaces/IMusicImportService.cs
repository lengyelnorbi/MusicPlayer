using API.Models.ResponseModels;

namespace API.Services.Interfaces;

public interface IMusicImportService
{
    Task<CreateMusicImportResponse> CreateImportAsync(
        int userId,
        string url,
        CancellationToken cancellationToken = default);

    Task<ImportJobProgress?> GetJobProgressAsync(
        int userId,
        Guid jobId,
        CancellationToken cancellationToken = default);
}