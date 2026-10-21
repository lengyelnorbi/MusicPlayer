using API.Data;
using API.Messaging;
using API.Messaging.Messages;
using API.Models;
using API.Models.DTO;
using API.Models.Enums;
using API.Models.QueueModels;
using API.Models.ResponseModels;
using API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public class MusicImportService : IMusicImportService
{
    private readonly MusicPlayerDbContext _dbContext;
    private readonly IImportSourceResolver _sourceResolver;
    private readonly RabbitMqPublisher _rabbitMq;
    private readonly ILogger<MusicImportService> _logger;
    private readonly string _temporaryMusicPath;

    public MusicImportService(MusicPlayerDbContext dbContext, IImportSourceResolver sourceResolver, RabbitMqPublisher rabbitMq, ILogger<MusicImportService> logger, IConfiguration configuration)
    {
        _dbContext = dbContext;
        _sourceResolver = sourceResolver;
        _rabbitMq = rabbitMq;
        _logger = logger;
        _temporaryMusicPath = configuration["MusicStorage:TempPath"] ?? throw new InvalidOperationException("MusicStorage:TempPath is not configured.");
    }

    /// <summary>
    /// Creates a new music import job for the specified user and source URL. 
    /// The method resolves the source URL to determine the type of import (e.g., YouTube, playlist) and creates an import job with associated work items for each video or track found. 
    /// The job is saved to the database and returned as a response.
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="url"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    /// <exception cref="ArgumentException"></exception>
    /// <exception cref="InvalidOperationException"></exception>
    public async Task<CreateMusicImportResponse> CreateImportAsync(int userId, string url, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            throw new ArgumentException("URL is required.", nameof(url));
        }

        // Resolve the source URL to determine the type of import and retrieve the list of video URLs or items
        var source = await _sourceResolver.ResolveAsync(url, cancellationToken);
        if (source.Urls.Count == 0)
        {
            throw new InvalidOperationException("No videos were found.");
        }

        var job = new ImportJob
        {
            UserId = userId,
            SourceUrl = url,
            Type = source.Type,
            Status = JobStatus.Pending,
            TotalItems = source.Urls.Count,
            CreatedAt = DateTime.UtcNow
        };

        _logger.LogInformation("Creating import job for user {UserId} with {TotalItems} items.", userId, source.Urls.Count);

        // Determine the list of source items to create work items for. If the source has specific items, use them; otherwise, create ImportSourceItem instances from the URLs.
        var sourceItems = source.Items.Count > 0 ? source.Items : source.Urls.Select(videoUrl => new ImportSourceItem { Url = videoUrl });

        foreach (var sourceItem in sourceItems)
        {
            _logger.LogInformation("Adding work item for video URL: {VideoUrl}", sourceItem.Url);
            job.WorkItems.Add(new ImportWorkItem
            {
                JobId = job.Id,
                Url = sourceItem.Url,
                Title = string.IsNullOrWhiteSpace(sourceItem.Title) ? null : sourceItem.Title.Trim(),
                Status = WorkStatus.Pending,
                CreatedAt = DateTime.UtcNow
            });
        }

        _dbContext.ImportJobs.Add(job);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new CreateMusicImportResponse
        {
            JobId = job.Id,
            Type = job.Type,
            Status = job.Status,
            TotalItems = job.TotalItems
        };
    }

    /// <summary>
    /// Retrieves a specific work item by its ID for the specified user. 
    /// The method checks if the work item exists and belongs to the user's import job, returning the work item if found or null if not found.
    /// </summary>
    /// <param name="workItemId"></param>
    /// <param name="userId"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task<ImportWorkItem?> GetWorkItemByIdAsync(Guid workItemId, int userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ImportWorkItems
            .Include(x => x.Job)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == workItemId && x.Job.UserId == userId, cancellationToken);
    }

    /// <summary>
    /// Marks a work item as downloaded for the specified user.
    /// The method checks if the work item exists and belongs to the user's import job, and if so, updates its status to Downloaded.
    /// </summary>
    /// <param name="workItemId"></param>
    /// <param name="userId"></param>
    /// <param name="fullPath"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task MarkWorkItemDownloadedAsync(Guid workItemId, int userId, string fullPath, CancellationToken cancellationToken = default)
    {
        var item = await _dbContext.ImportWorkItems
            .Include(x => x.Job)
            .FirstOrDefaultAsync(x => x.Id == workItemId && x.Job.UserId == userId, cancellationToken);

        if (item is null || item.Status != WorkStatus.Completed)
        {
            return;
        }
        try
        {
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }

            item.Status = WorkStatus.Downloaded;
            item.TemporaryFilePath = null;
            item.TemporaryFileName = null;
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Could not finalize downloaded work item {WorkItemId}.", workItemId);
        }
    }

    /// <summary>
    /// Deletes a specific import job for the specified user.
    /// The method checks if the job exists and belongs to the user, and if so, removes it from the database.
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="jobId"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task<bool> DeleteJobAsync(int userId, Guid jobId, CancellationToken cancellationToken = default)
    {
        var job = await _dbContext.ImportJobs
            .Include(x => x.WorkItems)
            .FirstOrDefaultAsync(x => x.Id == jobId && x.UserId == userId, cancellationToken);

        if (job is null)
        { 
            return false;
        }

        foreach (var item in job.WorkItems)
        {
            DeleteTemporaryFiles(item);
        }

        _dbContext.ImportJobs.Remove(job);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    /// <summary>
    /// Deletes a specific work item for the specified user.
    /// The method checks if the work item exists and belongs to the user's import job, and if so, removes it from the database.
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="jobId"></param>
    /// <param name="workItemId"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task<bool> DeleteWorkItemAsync(int userId, Guid jobId, Guid workItemId, CancellationToken cancellationToken = default)
    {
        var item = await _dbContext.ImportWorkItems
            .Include(x => x.Job)
            .FirstOrDefaultAsync(x => x.Id == workItemId && x.JobId == jobId && x.Job.UserId == userId, cancellationToken);

        if (item is null) 
        {
            return false;
        }

        DeleteTemporaryFiles(item);
        var job = item.Job;
        _dbContext.ImportWorkItems.Remove(item);
        job.TotalItems = Math.Max(0, job.TotalItems - 1);
        job.WorkItems.Remove(item);
        RecalculateCounters(job);

        if (job.TotalItems == 0)
        {
            job.Status = JobStatus.Completed;
            job.CompletedAt = DateTime.UtcNow;
            job.Error = null;
        }
        else if (job.CompletedItems + job.FailedItems >= job.TotalItems && job.Status != JobStatus.Paused)
        {
            job.Status = job.FailedItems > 0 ? JobStatus.CompletedWithErrors : JobStatus.Completed;
            job.CompletedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    /// <summary>
    /// Retrieves the progress of a specific import job for the specified user.
    /// The method checks if the job exists and belongs to the user, and if so, returns an ImportJobProgressDTO containing the job's status and counts of total, completed, and failed items.
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="jobId"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task<ImportJobProgressDTO?> GetJobProgressAsync(int userId, Guid jobId, CancellationToken cancellationToken = default)
    {
        var job = await _dbContext.ImportJobs.AsNoTracking()
            .Include(x => x.WorkItems)
            .FirstOrDefaultAsync(x => x.Id == jobId && x.UserId == userId, cancellationToken);
        if (job is null)
        { 
            return null;
        }
        // Backfill missing titles for work items that don't have a title yet. This is useful for cases where the source resolution didn't provide titles initially.
        await BackfillMissingTitlesAsync(job, cancellationToken);
        RecalculateCounters(job);

        return new ImportJobProgressDTO
        {
            JobId = job.Id,
            Status = job.Status,
            TotalItems = job.TotalItems,
            CompletedItems = job.CompletedItems,
            FailedItems = job.FailedItems
        };
    }

    /// <summary>
    /// Retrieves a specific import job for the specified user.
    /// The method checks if the job exists and belongs to the user, and if so, returns an ImportJobDTO containing the job's details.
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="jobId"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task<ImportJobDTO?> GetJobAsync(int userId, Guid jobId, CancellationToken cancellationToken = default)
    {
        var job = await _dbContext.ImportJobs.AsNoTracking()
            .Include(x => x.WorkItems)
            .FirstOrDefaultAsync(x => x.Id == jobId && x.UserId == userId, cancellationToken);

        if (job is null) 
        { 
            return null;
        }

        RecalculateCounters(job);

        return new ImportJobDTO
        {
            Id = job.Id,
            SourceUrl = job.SourceUrl,
            Type = job.Type,
            Status = job.Status,
            TotalItems = job.TotalItems,
            CompletedItems = job.CompletedItems,
            FailedItems = job.FailedItems,
            CreatedAt = job.CreatedAt,
            StartedAt = job.StartedAt,
            CompletedAt = job.CompletedAt,
            Error = job.Error,
            WorkItems = job.WorkItems.Select(item => new ImportWorkItemDTO
            {
                Id = item.Id,
                JobId = item.JobId,
                Url = item.Url,
                Title = item.Title,
                Status = item.Status,
                AttemptCount = item.AttemptCount,
                Error = item.Error,
                CreatedAt = item.CreatedAt,
                StartedAt = item.StartedAt,
                CompletedAt = item.CompletedAt,
                CanDownload = item.Status == WorkStatus.Completed &&
                              !string.IsNullOrWhiteSpace(item.TemporaryFilePath)
            }).ToList()
        };
    }

    /// <summary>
    /// Starts the import job for the specified user.
    /// The method checks if the job exists and belongs to the user, and if so, starts the job.
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="jobId"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public Task<ImportJobDTO?> StartJobAsync(int userId, Guid jobId, CancellationToken cancellationToken = default)
    {
        return StartItemsAsync(userId, jobId, null, cancellationToken);
    }

    /// <summary>
    /// Starts a specific work item for the specified user.
    /// The method checks if the job and work item exist and belong to the user, and if so, starts the work item.
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="jobId"></param>
    /// <param name="workItemId"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public Task<ImportJobDTO?> StartWorkItemAsync(int userId, Guid jobId, Guid workItemId, CancellationToken cancellationToken = default)
    {
        return StartItemsAsync(userId, jobId, workItemId, cancellationToken);
    }

    /// <summary>
    /// Starts the specified import job or work item for the specified user.
    /// The method checks if the job and work item exist and belong to the user, and if so, starts the job or work item.
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="jobId"></param>
    /// <param name="workItemId"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private async Task<ImportJobDTO?> StartItemsAsync(int userId, Guid jobId, Guid? workItemId, CancellationToken cancellationToken)
    {
        var job = await _dbContext.ImportJobs
            .Include(x => x.WorkItems)
            .FirstOrDefaultAsync(x => x.Id == jobId && x.UserId == userId, cancellationToken);
            
        if (job is null)
        { 
            return null;
        }

        var items = job.WorkItems
            .Where(x => x.Status == WorkStatus.Pending && (!workItemId.HasValue || x.Id == workItemId.Value))
            .ToList();

        if (items.Count == 0)
        { 
            return ToDto(job);
        }

        var now = DateTime.UtcNow;
        foreach (var item in items)
        {
            // Keep queued items Pending until the worker completes them. The
            // worker may be paused by a source/IP 403 while messages wait in
            // RabbitMQ; marking the whole queue Processing makes that state
            // look frozen and prevents a safe retry from the UI.
            item.Status = WorkStatus.Pending;
            item.StartedAt = null;
            item.Error = null;
        }

        job.Status = JobStatus.Processing;
        job.StartedAt ??= now;
        job.CompletedAt = null;
        job.Error = null;
        await _dbContext.SaveChangesAsync(cancellationToken);

        foreach (var item in items)
        {
            var message = new MusicWorkMessage
            {
                JobId = job.Id,
                WorkItemId = item.Id,
                UserId = userId,
                Url = item.Url,
                Attempt = item.AttemptCount
            };

            // Use the same serial queue for individual and bulk starts. The
            // old bulk queue can contain stale messages after a worker pause;
            // sending new work there makes a fresh Start all appear frozen
            // behind already completed items.
            await _rabbitMq.PublishSingleWorkAsync(message, cancellationToken);
        }

        // The worker starts paused and is resumed only by an explicit user action.
        await _rabbitMq.PublishControlAsync(new { Action = "ResumeSingle", JobId = job.Id }, cancellationToken);

        return ToDto(job);
    }

    /// <summary>
    /// Deletes temporary files associated with a work item. 
    /// This method is called when a work item is deleted or marked as downloaded to clean up any temporary files that were created during the import process.
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task<IReadOnlyList<ImportJobDTO>> GetJobsAsync(int userId, CancellationToken cancellationToken = default)
    {
        var jobs = await _dbContext.ImportJobs.AsNoTracking()
            .Include(x => x.WorkItems)
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .Take(50)
            .ToListAsync(cancellationToken);

        return jobs.Select(ToDto).ToList();
    }

    /// <summary>
    /// Retries a specific import job for the specified user.
    /// The method checks if the job exists and belongs to the user, and if so, resets the status of any failed or pending work items to Pending and republishes them to the RabbitMQ queue for processing. 
    /// The job's status is updated to Processing, and the method returns the updated Import
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="jobId"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task<ImportJobDTO?> RetryJobAsync(int userId, Guid jobId, CancellationToken cancellationToken = default)
    {
        var job = await _dbContext.ImportJobs
            .Include(x => x.WorkItems)
            .FirstOrDefaultAsync(x => x.Id == jobId && x.UserId == userId, cancellationToken);

        if (job is null)
        { 
            return null;
        }

        var retryableItems = job.WorkItems
            .Where(x => x.Status != WorkStatus.Completed && x.Status != WorkStatus.Downloaded)
            .ToList();

        if (retryableItems.Count == 0)
        {
            return ToDto(job);
        }

        foreach (var item in retryableItems)
        {
            item.Status = WorkStatus.Pending;
            item.AttemptCount++;
            item.Error = null;
            item.StartedAt = null;
            item.CompletedAt = null;
        }

        job.Status = JobStatus.Processing;
        job.FailedItems = 0;
        job.CompletedAt = null;
        job.Error = null;
        job.StartedAt ??= DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        foreach (var item in retryableItems)
        {
            await _rabbitMq.PublishSingleWorkAsync(new MusicWorkMessage
            {
                JobId = job.Id,
                WorkItemId = item.Id,
                UserId = userId,
                Url = item.Url,
                Attempt = item.AttemptCount
            }, cancellationToken);
        }

        // The worker starts paused and is resumed only by an explicit user action.
        await _rabbitMq.PublishControlAsync(new { Action = "ResumeSingle", JobId = job.Id }, cancellationToken);

        return ToDto(job);
    }

    /// <summary>
    /// Converts an ImportJob entity to an ImportJobDTO.
    /// </summary>
    /// <param name="job"></param>
    /// <returns></returns>
    private static ImportJobDTO ToDto(ImportJob job)
    {
        RecalculateCounters(job);

        return new ImportJobDTO
        {
            Id = job.Id,
            SourceUrl = job.SourceUrl,
            Type = job.Type,
            Status = job.Status,
            TotalItems = job.TotalItems,
            CompletedItems = job.CompletedItems,
            FailedItems = job.FailedItems,
            Error = job.Error,
            CreatedAt = job.CreatedAt,
            StartedAt = job.StartedAt,
            CompletedAt = job.CompletedAt,
            WorkItems = job.WorkItems.Select(item => new ImportWorkItemDTO
            {
                Id = item.Id,
                JobId = item.JobId,
                Url = item.Url,
                Title = item.Title,
                Status = item.Status,
                AttemptCount = item.AttemptCount,
                Error = item.Error,
                CreatedAt = item.CreatedAt,
                StartedAt = item.StartedAt,
                CompletedAt = item.CompletedAt,
                CanDownload = item.Status == WorkStatus.Completed && !string.IsNullOrWhiteSpace(item.TemporaryFilePath)
            }).ToList()
        };
    }

    /// <summary>
    /// Backfills missing titles for the work items in the specified import job.
    /// </summary>
    /// <param name="job"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    private async Task BackfillMissingTitlesAsync(ImportJob job, CancellationToken cancellationToken)
    {
        var missingItems = job.WorkItems
            .Where(item => string.IsNullOrWhiteSpace(item.Title))
            .ToList();

        if (missingItems.Count == 0)
        {
            return;
        }

        try
        {
            // Resolve the original source once so a large playlist does not
            // start one yt-dlp process per track.
            var source = await _sourceResolver.ResolveAsync(job.SourceUrl, cancellationToken);

            var titlesByUrl = source.Items
                .Where(item => !string.IsNullOrWhiteSpace(item.Title))
                .ToDictionary(item => item.Url, item => item.Title!, StringComparer.OrdinalIgnoreCase);

            var changedItems = missingItems
                .Where(item => titlesByUrl.TryGetValue(item.Url, out var title))
                .ToList();

            if (changedItems.Count == 0)
            {
                return;
            }

            foreach (var item in changedItems)
            {
                item.Title = titlesByUrl[item.Url].Trim();

                var storedItem = new ImportWorkItem { Id = item.Id };
                // Attach the entity to the context and mark the Title property as modified to update it in the database
                _dbContext.ImportWorkItems.Attach(storedItem);
                storedItem.Title = item.Title;
                _dbContext.Entry(storedItem).Property(x => x.Title).IsModified = true;
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            // Metadata is helpful but must not make an otherwise valid job
            // impossible to open when YouTube is temporarily unavailable.
            _logger.LogWarning(ex, "Could not backfill titles for import job {JobId}.", job.Id);
        }
    }

    /// <summary>
    /// Recalculates the counters for the specified import job.
    /// </summary>
    /// <param name="job"></param>
    private static void RecalculateCounters(ImportJob job)
    {
        job.CompletedItems = job.WorkItems.Count(item => item.Status is WorkStatus.Completed or WorkStatus.Downloaded);
        job.FailedItems = job.WorkItems.Count(item => item.Status == WorkStatus.Failed);
    }

    /// <summary>
    /// Deletes temporary files associated with a work item.
    /// </summary>
    /// <param name="item"></param>
    private void DeleteTemporaryFiles(ImportWorkItem item)
    {
        // Ensure the temporary file path is within the configured temporary music path to prevent accidental deletion of important files
        var root = Path.GetFullPath(_temporaryMusicPath);
        // Construct the full path to the work item's temporary directory based on its ID
        var itemDirectory = Path.GetFullPath(Path.Combine(root, item.Id.ToString()));
        // Check if the item directory is a subdirectory of the root temporary music path to prevent accidental deletion of important files
        var relativePath = Path.GetRelativePath(root, itemDirectory);

        // Prevent deletion of files outside the temporary music path or if the relative path is unsafe (e.g., ".." or absolute paths)
        if (Path.IsPathRooted(relativePath) || relativePath == ".." ||
            relativePath.StartsWith(".." + Path.DirectorySeparatorChar, StringComparison.Ordinal) ||
            relativePath.StartsWith(".." + Path.AltDirectorySeparatorChar, StringComparison.Ordinal))
        {
            _logger.LogWarning("Skipping unsafe temporary path for work item {WorkItemId}.", item.Id);
            return;
        }

        try
        {
            if (Directory.Exists(itemDirectory))
            {
                Directory.Delete(itemDirectory, recursive: true);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not remove temporary files for work item {WorkItemId}.", item.Id);
        }
    }
}
