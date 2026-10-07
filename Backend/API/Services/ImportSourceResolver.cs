using API.Models.Enums;
using API.Models;
using API.Services.Interfaces;

namespace API.Services;

public class ImportSourceResolver : IImportSourceResolver
{
    private readonly ILogger<ImportSourceResolver> _logger;

    public ImportSourceResolver(
        ILogger<ImportSourceResolver> logger)
    {
        _logger = logger;
    }

    public async Task<ImportSource> ResolveAsync(
        string url,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(url))
            throw new ArgumentException(
                "URL cannot be empty.",
                nameof(url));

        /*
         * TODO:
         *
         * Replace this section with your actual
         * video/playlist extraction logic.
         *
         * The important contract is:
         *
         * Single video:
         *
         * return new ImportSource
         * {
         *     Type = JobType.SingleVideo,
         *     Urls = new List<string> { url }
         * };
         *
         *
         * Playlist:
         *
         * return new ImportSource
         * {
         *     Type = JobType.Playlist,
         *     Urls = playlistVideos
         * };
         */

        _logger.LogInformation(
            "Resolving import source: {Url}",
            url);

        // TEMPORARY implementation.
        // Replace this with your actual resolver.

        await Task.CompletedTask;

        return new ImportSource
        {
            Type = JobType.SingleVideo,
            Urls = new List<string>
            {
                url
            }
        };
    }
}