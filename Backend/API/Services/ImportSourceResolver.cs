using API.Models;
using API.Models.Enums;
using API.Services.Interfaces;

namespace API.Services;

/// <summary>
/// Placeholder resolver. Replace with real video/playlist extraction logic.
/// </summary>
public class ImportSourceResolver : IImportSourceResolver
{
    private readonly ILogger<ImportSourceResolver> _logger;

    public ImportSourceResolver(ILogger<ImportSourceResolver> logger) => _logger = logger;

    public Task<ImportSource> ResolveAsync(string url, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(url))
            throw new ArgumentException("URL cannot be empty.", nameof(url));

        _logger.LogInformation("Resolving import source: {Url}", url);

        // TODO: Detect playlists and return each video URL.
        return Task.FromResult(new ImportSource
        {
            Type = JobType.SingleVideo,
            Urls = new List<string> { url }
        });
    }
}
