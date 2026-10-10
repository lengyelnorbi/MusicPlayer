using API.Data;
using API.Messaging;
using API.Messaging.Messages;
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

    public MusicImportService(
        MusicPlayerDbContext dbContext,
        IImportSourceResolver sourceResolver,
        RabbitMqPublisher rabbitMq,
        ILogger<MusicImportService> logger)
    {
        _dbContext = dbContext;
        _sourceResolver = sourceResolver;
        _rabbitMq = rabbitMq;
        _logger = logger;
    }

    public async Task<CreateMusicImportResponse> CreateImportAsync(
        int userId, string url, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(url))
            throw new ArgumentException("URL is required.", nameof(url));

        var source = await _sourceResolver.ResolveAsync(url, cancellationToken);
        if (source.Urls.Count == 0)
            throw new InvalidOperationException("No videos were found.");

        var job = new ImportJob
        {
            UserId = userId,
            SourceUrl = url,
            Type = source.Type,
            Status = JobStatus.Pending,
            TotalItems = source.Urls.Count,
            CreatedAt = DateTime.UtcNow
        };

        _logger.LogInformation(
            "Creating import job for user {UserId} with {TotalItems} items.",
            userId, source.Urls.Count);

        foreach (var videoUrl in source.Urls)
        {
            _logger.LogInformation(
                "Adding work item for video URL: {VideoUrl}", videoUrl);
            job.WorkItems.Add(new ImportWorkItem
            {
                JobId = job.Id,
                Url = videoUrl,
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

    public async Task<ImportWorkItem?> GetWorkItemByIdAsync(
        Guid workItemId, int userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ImportWorkItems
            .Include(x => x.Job)
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.Id == workItemId && x.Job.UserId == userId,
                cancellationToken);
    }

    public async Task MarkWorkItemDownloadedAsync(
        Guid workItemId,
        int userId,
        string fullPath,
        CancellationToken cancellationToken = default)
    {
        var item = await _dbContext.ImportWorkItems
            .Include(x => x.Job)
            .FirstOrDefaultAsync(
                x => x.Id == workItemId && x.Job.UserId == userId,
                cancellationToken);

        if (item is null || item.Status != WorkStatus.Completed)
            return;

        try
        {
            if (File.Exists(fullPath))
                File.Delete(fullPath);

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

    public async Task<ImportJobProgressDTO?> GetJobProgressAsync(
        int userId, Guid jobId, CancellationToken cancellationToken = default)
    {
        var job = await _dbContext.ImportJobs.AsNoTracking()
            .Include(x => x.WorkItems)
            .FirstOrDefaultAsync(x => x.Id == jobId && x.UserId == userId, cancellationToken);
        if (job is null) return null;

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

    public async Task<ImportJobDTO?> GetJobAsync(
        int userId, Guid jobId, CancellationToken cancellationToken = default)
    {
        var job = await _dbContext.ImportJobs.AsNoTracking()
            .Include(x => x.WorkItems)
            .FirstOrDefaultAsync(x => x.Id == jobId && x.UserId == userId, cancellationToken);
        if (job is null) return null;

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

    public Task<ImportJobDTO?> StartJobAsync(
        int userId, Guid jobId, CancellationToken cancellationToken = default)
    {
        return StartItemsAsync(userId, jobId, null, cancellationToken);
    }

    public Task<ImportJobDTO?> StartWorkItemAsync(
        int userId, Guid jobId, Guid workItemId, CancellationToken cancellationToken = default)
    {
        return StartItemsAsync(userId, jobId, workItemId, cancellationToken);
    }

    private async Task<ImportJobDTO?> StartItemsAsync(
        int userId,
        Guid jobId,
        Guid? workItemId,
        CancellationToken cancellationToken)
    {
        var job = await _dbContext.ImportJobs
            .Include(x => x.WorkItems)
            .FirstOrDefaultAsync(x => x.Id == jobId && x.UserId == userId, cancellationToken);
        if (job is null) return null;

        var items = job.WorkItems
            .Where(x => x.Status == WorkStatus.Pending &&
                (!workItemId.HasValue || x.Id == workItemId.Value))
            .ToList();

        if (items.Count == 0) return ToDto(job);

        var now = DateTime.UtcNow;
        foreach (var item in items)
        {
            item.Status = WorkStatus.Processing;
            item.StartedAt = now;
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

            if (workItemId.HasValue)
                await _rabbitMq.PublishSingleWorkAsync(message, cancellationToken);
            else
                await _rabbitMq.PublishWorkAsync(message, cancellationToken);
        }

        // The worker starts paused and is resumed only by an explicit user action.
        await _rabbitMq.PublishControlAsync(
            new { Action = workItemId.HasValue ? "ResumeSingle" : "Resume", JobId = job.Id },
            cancellationToken);

        return ToDto(job);
    }

    public async Task<IReadOnlyList<ImportJobDTO>> GetJobsAsync(
        int userId, CancellationToken cancellationToken = default)
    {
        var jobs = await _dbContext.ImportJobs.AsNoTracking()
            .Include(x => x.WorkItems)
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .Take(50)
            .ToListAsync(cancellationToken);

        return jobs.Select(ToDto).ToList();
    }

    public async Task<ImportJobDTO?> RetryJobAsync(
        int userId, Guid jobId, CancellationToken cancellationToken = default)
    {
        var job = await _dbContext.ImportJobs
            .Include(x => x.WorkItems)
            .FirstOrDefaultAsync(x => x.Id == jobId && x.UserId == userId, cancellationToken);
        if (job is null) return null;

        var retryableItems = job.WorkItems
            .Where(x => x.Status != WorkStatus.Completed && x.Status != WorkStatus.Downloaded)
            .ToList();
        if (retryableItems.Count == 0) return ToDto(job);

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
            await _rabbitMq.PublishWorkAsync(new MusicWorkMessage
            {
                JobId = job.Id,
                WorkItemId = item.Id,
                UserId = userId,
                Url = item.Url,
                Attempt = item.AttemptCount
            }, cancellationToken);
        }

        await _rabbitMq.PublishControlAsync(new { Action = "Resume", JobId = job.Id }, cancellationToken);

        return ToDto(job);
    }

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
                CanDownload = item.Status == WorkStatus.Completed &&
                              !string.IsNullOrWhiteSpace(item.TemporaryFilePath)
            }).ToList()
        };
    }

    private static void RecalculateCounters(ImportJob job)
    {
        job.CompletedItems = job.WorkItems.Count(item =>
            item.Status is WorkStatus.Completed or WorkStatus.Downloaded);
        job.FailedItems = job.WorkItems.Count(item => item.Status == WorkStatus.Failed);
    }
}
