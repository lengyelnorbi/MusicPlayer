using API.Data;
using API.DTO;
using API.Models;
using API.Models.Enums;
using API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public class MusicUploadRequestService : IMusicUploadRequestService
{
    private readonly MusicPlayerDbContext _dbContext;
    private readonly IMusicImportService _musicImportService;

    public MusicUploadRequestService(MusicPlayerDbContext dbContext, IMusicImportService musicImportService)
    {
        _dbContext = dbContext;
        _musicImportService = musicImportService;
    }

    /// <summary>
    /// Creates a new music upload request for a specific user with the provided YouTube URL.
    /// Validates the URL to ensure it is a valid YouTube link before creating the request. The request is saved to the database and returned as a DTO.
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="url"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    /// <exception cref="ArgumentException"></exception>
    public async Task<MusicUploadRequestDTO> CreateAsync(int userId, string url, CancellationToken cancellationToken = default)
    {
        // Validate the provided URL to ensure it is a valid YouTube link
        if (!Uri.TryCreate(url?.Trim(), UriKind.Absolute, out var uri) || !IsYouTubeHost(uri.Host))
        {
            throw new ArgumentException("A valid YouTube URL is required.", nameof(url));
        }

        var request = new MusicUploadRequest { UserId = userId, Url = uri.ToString() };
        _dbContext.MusicUploadRequests.Add(request);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return ToDto(request);
    }

    /// <summary>
    /// Retrieves all music upload requests for the specified user.
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task<IReadOnlyList<MusicUploadRequestDTO>> GetMineAsync(int userId, CancellationToken cancellationToken = default)
    {
        var requests = await _dbContext.MusicUploadRequests.AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
        return requests.Select(x => ToDtoExpression(x, null)).ToList();
    }

    /// <summary>
    /// Retrieves all pending music upload requests.
    /// </summary>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task<IReadOnlyList<MusicUploadRequestDTO>> GetPendingAsync(CancellationToken cancellationToken = default)
    {
        var requests = await (from request in _dbContext.MusicUploadRequests.AsNoTracking()
                      join user in _dbContext.Users.AsNoTracking() on request.UserId equals user.ID
                      where request.Status == MusicRequestStatus.Pending
                      orderby request.CreatedAt descending
                      select new { request, user.Username })
            .ToListAsync(cancellationToken);
        return requests.Select(x => ToDtoExpression(x.request, x.Username)).ToList();
    }

    /// <summary>
    /// Imports a pending music upload request.
    /// </summary>
    /// <param name="adminUserId"></param>
    /// <param name="requestId"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task<MusicUploadRequestDTO?> ImportAsync(int adminUserId, Guid requestId, CancellationToken cancellationToken = default)
    {
        var request = await _dbContext.MusicUploadRequests
            .FirstOrDefaultAsync(x => x.Id == requestId && x.Status == MusicRequestStatus.Pending, cancellationToken);
        if (request is null)
        {
            return null;
        }

        // Create a new import job for the music upload request using the MusicImportService
        var job = await _musicImportService.CreateImportAsync(adminUserId, request.Url, cancellationToken);
        request.Status = MusicRequestStatus.Imported;
        request.ImportJobId = job.JobId;
        request.ProcessedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return ToDto(request);
    }

    /// <summary>
    /// Determines if the given host is a YouTube host.
    /// </summary>
    /// <param name="host"></param>
    /// <returns></returns>
    private static bool IsYouTubeHost(string host) =>
        host.Equals("youtube.com", StringComparison.OrdinalIgnoreCase) ||
        host.EndsWith(".youtube.com", StringComparison.OrdinalIgnoreCase) ||
        host.Equals("youtu.be", StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Converts a MusicUploadRequest to a MusicUploadRequestDTO.
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    private static MusicUploadRequestDTO ToDto(MusicUploadRequest request) => new()
    {
        Id = request.Id, UserId = request.UserId, Url = request.Url, Status = request.Status,
        CreatedAt = request.CreatedAt, ProcessedAt = request.ProcessedAt,
        ImportJobId = request.ImportJobId, AdminNote = request.AdminNote
    };

    /// <summary>
    /// Converts a MusicUploadRequest to a MusicUploadRequestDTO with an optional username.
    /// </summary>
    /// <param name="request"></param>
    /// <param name="username"></param>
    /// <returns></returns>
    /// <exception cref="ArgumentNullException"></exception>
    private static MusicUploadRequestDTO ToDtoExpression(MusicUploadRequest request, string? username) => new()
    {
        Id = request.Id, UserId = request.UserId, Username = username, Url = request.Url,
        Status = request.Status, CreatedAt = request.CreatedAt, ProcessedAt = request.ProcessedAt,
        ImportJobId = request.ImportJobId, AdminNote = request.AdminNote
    };
}
