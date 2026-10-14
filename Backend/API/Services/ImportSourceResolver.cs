
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
    private readonly string _ytDlpCookiesFile;

    public ImportSourceResolver(ILogger<ImportSourceResolver> logger, IConfiguration configuration)
    {
        _logger = logger;
        _ytDlpExecutable = configuration["YtDlp:Executable"] ?? (OperatingSystem.IsWindows() ? "yt-dlp.exe" : "yt-dlp");
        _ytDlpCookiesFile = configuration["YtDlp:CookiesFile"] ?? string.Empty;
    }

    /// <summary>
    /// Resolves the provided YouTube URL to an ImportSource object, which contains the type of import (single video or playlist) and a list of unique video URLs.
    /// The method uses the yt-dlp executable to extract metadata from the YouTube URL, including handling playlists and age-restricted content. 
    /// It throws exceptions for invalid URLs, age-restricted videos without cookies, and other resolution errors.
    /// </summary>
    /// <param name="url"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    /// <exception cref="ArgumentException"></exception>
    /// <exception cref="InvalidOperationException"></exception>
    public async Task<ImportSource> ResolveAsync(string url, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            throw new ArgumentException("URL cannot be empty.", nameof(url));
        }

        // Validate that the URL is a valid YouTube URL
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) || 
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps) || 
            !IsYouTubeHost(uri.Host))
        {
            throw new ArgumentException("A valid YouTube URL is required.", nameof(url));
        }

        _logger.LogInformation("Resolving import source: {Url}", url);

        // Prepare the yt-dlp process start info
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
        startInfo.ArgumentList.Add("--dump-single-json");
        startInfo.ArgumentList.Add("--skip-download");
        startInfo.ArgumentList.Add("--yes-playlist");

        if (!string.IsNullOrWhiteSpace(_ytDlpCookiesFile))
        {
            if (!File.Exists(_ytDlpCookiesFile))
            {
                throw new InvalidOperationException("YtDlp:CookiesFile is configured, but the cookie file does not exist.");
            }

            startInfo.ArgumentList.Add("--cookies");
            startInfo.ArgumentList.Add(_ytDlpCookiesFile);
        }

        startInfo.ArgumentList.Add(url);

        using var process = new Process
        {
            StartInfo = startInfo
        };

        process.Start();

        // Read the standard output and error streams asynchronously
        var outputTask = process.StandardOutput.ReadToEndAsync();
        var errorTask = process.StandardError.ReadToEndAsync();

        // Use a linked cancellation token source to enforce a timeout for the process
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);

        // Resolving full playlist metadata can take longer than extracting
        // only flat URLs, especially for large playlists.
        // Set a timeout of 10 minutes for the yt-dlp process to complete
        timeoutCts.CancelAfter(TimeSpan.FromMinutes(10));

        try
        {
            // Wait for the yt-dlp process to exit, respecting the cancellation token for timeout
            await process.WaitForExitAsync(timeoutCts.Token);
        }
        catch (OperationCanceledException)
        {
            try
            {
                if (!process.HasExited)
                {
                    // Kill the yt-dlp process and its entire process tree if it is still running after the timeout
                    process.Kill(entireProcessTree: true);
                }
            }
            catch (InvalidOperationException)
            {
                // The process may have exited already.
            }

            // Wait for the process to exit after killing it
            await process.WaitForExitAsync(CancellationToken.None);
            throw;
        }

        var output = await outputTask;
        var error = await errorTask;

        if (process.ExitCode != 0)
        {
            _logger.LogWarning("yt-dlp resolution failed. ExitCode={ExitCode}, Error={Error}", process.ExitCode, error);

            if (IsAgeRestrictedError(error))
            {
                throw new InvalidOperationException("This YouTube video is age-restricted. Configure " + "YtDlp:CookiesFile with a valid Netscape cookie file.");
            }

            throw new InvalidOperationException("Could not resolve the YouTube URL.");
        }

        // Parse the JSON output from yt-dlp to extract video URLs and metadata
        using var document = JsonDocument.Parse(output);
        var root = document.RootElement;

        // Radio/mix feeds are effectively unbounded and continuously change,
        // so keep a safety cap for them. A normal playlist should be imported
        // in full instead of silently truncating it at 50 tracks.
        const int maxRadioVideos = 50;

        // Use a HashSet to track seen video IDs for deduplication
        var rootId = GetString(root, "id");
        // Determine if the URL is a radio/mix feed based on the root ID or URL parameters
        var isRadio = (rootId?.StartsWith("RD", StringComparison.OrdinalIgnoreCase) ?? false) ||
            url.Contains("list=RD", StringComparison.OrdinalIgnoreCase);
        // Initialize lists to hold the unique video URLs and corresponding ImportSourceItems
        var urls = new List<string>(isRadio ? maxRadioVideos : 128);
        // Initialize a HashSet to track seen video IDs for deduplication
        var items = new List<ImportSourceItem>(isRadio ? maxRadioVideos : 128);
        // Use a HashSet to track seen video IDs for deduplication
        var seenVideoIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        // Check if the root JSON element contains an "entries" array, indicating a playlist
        var isPlaylist = root.TryGetProperty("entries", out var entries) &&
            entries.ValueKind == JsonValueKind.Array;

        if (isPlaylist)
        {
           foreach (var entry in entries.EnumerateArray())
           {
                if (entry.ValueKind != JsonValueKind.Object)
                {
                    continue;
                }

                // Use the video ID, not the full URL, as the deduplication key.
                var videoId = GetString(entry, "id");

                if (string.IsNullOrWhiteSpace(videoId))
                {
                    continue;
                }

                if (!seenVideoIds.Add(videoId))
                {
                    continue;
                }

                // Construct the full YouTube video URL using the video ID and add it to the list of URLs
                urls.Add($"https://www.youtube.com/watch?v=" + Uri.EscapeDataString(videoId));
                items.Add(new ImportSourceItem
                {
                    Url = urls[^1],
                    Title = GetEntryTitle(entry)
                });

                if (isRadio && urls.Count >= maxRadioVideos)
                {
                    break;
                }
            }
        }
        else
        {
            var videoId = GetString(root, "id");

            if (!string.IsNullOrWhiteSpace(videoId))
            {
                urls.Add($"https://www.youtube.com/watch?v=" + Uri.EscapeDataString(videoId));
                items.Add(new ImportSourceItem
                {
                    Url = urls[^1],
                    Title = GetEntryTitle(root)
                });
            }
        }

        if (urls.Count == 0)
        {
            throw new InvalidOperationException("No video URLs could be extracted.");
        }

        _logger.LogInformation("Resolved {Count} unique video URLs; IsPlaylist={IsPlaylist}; IsRadio={IsRadio}",
            urls.Count,
            isPlaylist,
            isRadio);

        return new ImportSource
        {
            Type = isPlaylist ? JobType.Playlist : JobType.SingleVideo,
            Urls = urls,
            Items = items
        };
    }

    /// <summary>
    /// Helper method to safely extract a string property from a JsonElement. Returns null if the property does not exist or is not a string.
    /// </summary>
    /// <param name="element"></param>
    /// <param name="propertyName"></param>
    /// <returns></returns>
    private static string? GetString( JsonElement element, string propertyName)
    {
        if (element.TryGetProperty(propertyName, out var value) &&
            value.ValueKind == JsonValueKind.String)
        {
            return value.GetString();
        }

        return null;
    }

    /// <summary>
    /// Determines the title of a YouTube video entry based on the JSON metadata. 
    /// If the "title" property is missing, it checks the "availability" property to provide a fallback title for age-restricted or unavailable videos.
    /// </summary>
    /// <param name="element"></param>
    /// <returns></returns>
    private static string? GetEntryTitle(JsonElement element)
    {
        var title = GetString(element, "title");
        if (!string.IsNullOrWhiteSpace(title))
        {
            return title;
        }

        var availability = GetString(element, "availability");
        // Return a fallback title based on the availability status, or null if no title can be determined
        return availability?.ToLowerInvariant() switch
        {
            "private" => "Private video",
            "needs_auth" => "Age-restricted video",
            "subscriber_only" => "Subscriber-only video",
            "premium_only" => "Premium-only video",
            "needs_subscription" => "Subscription-restricted video",
            "unavailable" => "Unavailable video",
            _ => null
        };
    }

    /// <summary>
    /// Checks if the given host is a YouTube domain.
    /// </summary>
    /// <param name="host"></param>
    /// <returns></returns>
    private static bool IsYouTubeHost(string host)
    {
        return host.Equals("youtube.com", StringComparison.OrdinalIgnoreCase) ||
               host.EndsWith(".youtube.com", StringComparison.OrdinalIgnoreCase) ||
               host.Equals("youtu.be", StringComparison.OrdinalIgnoreCase);
    }


    /// <summary>
    /// Checks if the given error message indicates an age-restricted video.
    /// </summary>
    /// <param name="message"></param>
    /// <returns></returns>
    private static bool IsAgeRestrictedError(string message)
    {
        return message.Contains("sign in to confirm your age", StringComparison.OrdinalIgnoreCase) ||
               message.Contains("confirm your age", StringComparison.OrdinalIgnoreCase) ||
               message.Contains("age-restricted", StringComparison.OrdinalIgnoreCase) ||
               message.Contains("age restricted", StringComparison.OrdinalIgnoreCase);
    }
}
