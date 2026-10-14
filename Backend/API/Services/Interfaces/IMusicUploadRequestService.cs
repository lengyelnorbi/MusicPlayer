using API.DTO;

namespace API.Services.Interfaces;

public interface IMusicUploadRequestService
{
    Task<MusicUploadRequestDTO> CreateAsync(int userId, string url, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MusicUploadRequestDTO>> GetMineAsync(int userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MusicUploadRequestDTO>> GetPendingAsync(CancellationToken cancellationToken = default);
    Task<MusicUploadRequestDTO?> ImportAsync(int adminUserId, Guid requestId, CancellationToken cancellationToken = default);
}
