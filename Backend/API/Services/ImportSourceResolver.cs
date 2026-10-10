
using System.Diagnostics;
using System.Text.Json;
using API.Models;
using API.Models.Enums;
using API.Services.Interfaces;

namespace API.Services;

public class ImportSourceResolver : IImportSourceResolver
{
    private readonly ILogger<ImportSourceResolver> _logger;
    private readonly string _ytDlpExecutable;

    public ImportSourceResolver(
        ILogger<ImportSourceResolver> logger,
        IConfiguration configuration)
    {
        _logger = logger;
        _ytDlpExecutable =
            configuration["YtDlp:Executable"] ??
            (OperatingSystem.IsWindows() ? "yt-dlp.exe" : "yt-dlp");
    }

    public async Task<ImportSource> ResolveAsync(
        string url,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(url))
            throw new ArgumentException(
                "URL cannot be empty.", nameof(url));

        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp &&
             uri.Scheme != Uri.UriSchemeHttps) ||
            !IsYouTubeHost(uri.Host))
        {
            throw new ArgumentException(
                "A valid YouTube URL is required.", nameof(url));
        }

        _logger.LogInformation(
            "Resolving import source: {Url}", url);

        var startInfo = new ProcessStartInfo
        {
            FileName = _ytDlpExecutable,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true
        };

        startInfo.ArgumentList.Add("--ignore-config");
        startInfo.ArgumentList.Add("--no-warnings");
        startInfo.ArgumentList.Add("--no-progress");
        startInfo.ArgumentList.Add("--flat-playlist");
        startInfo.ArgumentList.Add("--dump-single-json");
        startInfo.ArgumentList.Add("--skip-download");
        startInfo.ArgumentList.Add("--yes-playlist");
        startInfo.ArgumentList.Add(url);

        using var process = new Process
        {
            StartInfo = startInfo
        };

        process.Start();

        var outputTask = process.StandardOutput.ReadToEndAsync();
        var errorTask = process.StandardError.ReadToEndAsync();

        using var timeoutCts =
            CancellationTokenSource.CreateLinkedTokenSource(
                cancellationToken);

        timeoutCts.CancelAfter(TimeSpan.FromMinutes(2));

        try
        {
            await process.WaitForExitAsync(timeoutCts.Token);
        }
        catch (OperationCanceledException)
        {
            try
            {
                if (!process.HasExited)
                    process.Kill(entireProcessTree: true);
            }
            catch (InvalidOperationException)
            {
                // The process may have exited already.
            }

            await process.WaitForExitAsync(CancellationToken.None);
            throw;
        }

        var output = await outputTask;
        var error = await errorTask;

        if (process.ExitCode != 0)
        {
            _logger.LogWarning(
                "yt-dlp resolution failed. ExitCode={ExitCode}, Error={Error}",
                process.ExitCode,
                error);

            throw new InvalidOperationException(
                "Could not resolve the YouTube URL.");
        }

        using var document = JsonDocument.Parse(output);
        var root = document.RootElement;

        const int maxUniqueVideos = 50;


        var urls = new List<string>(maxUniqueVideos);
        var seenVideoIds = new HashSet<string>(
            StringComparer.OrdinalIgnoreCase);

        var isPlaylist =
            root.TryGetProperty("entries", out var entries) &&
            entries.ValueKind == JsonValueKind.Array;

        if (isPlaylist)
        {
           foreach (var entry in entries.EnumerateArray())
           {
            if (entry.ValueKind != JsonValueKind.Object)
                continue;

            // Use the video ID, not the full URL, as the deduplication key.
            var videoId = GetString(entry, "id");

            if (string.IsNullOrWhiteSpace(videoId))
                continue;

            if (!seenVideoIds.Add(videoId))
                continue;

            urls.Add(
                $"https://www.youtube.com/watch?v=" +
                Uri.EscapeDataString(videoId));

            if (urls.Count >= maxUniqueVideos)
                break;
            }
        }
        else
        {
            var videoId = GetString(root, "id");

            if (!string.IsNullOrWhiteSpace(videoId))
            {
                urls.Add(
                    $"https://www.youtube.com/watch?v=" +
                    Uri.EscapeDataString(videoId));
            }
        }

        if (urls.Count == 0)
        {
            throw new InvalidOperationException(
                "No video URLs could be extracted.");
        }

        _logger.LogInformation(
            "Resolved {Count} unique video URLs; IsPlaylist={IsPlaylist}",
            urls.Count,
            isPlaylist);

        return new ImportSource
        {
            Type = isPlaylist
                ? JobType.Playlist
                : JobType.SingleVideo,
            Urls = urls
        };
    }

    private static string? GetString(
    JsonElement element,
    string propertyName)
    {
        if (element.TryGetProperty(propertyName, out var value) &&
            value.ValueKind == JsonValueKind.String)
        {
            return value.GetString();
        }

        return null;
    }

    private static bool IsYouTubeHost(string host)
    {
        return host.Equals(
                   "youtube.com",
                   StringComparison.OrdinalIgnoreCase) ||
               host.EndsWith(
                   ".youtube.com",
                   StringComparison.OrdinalIgnoreCase) ||
               host.Equals(
                   "youtu.be",
                   StringComparison.OrdinalIgnoreCase);
    }
}