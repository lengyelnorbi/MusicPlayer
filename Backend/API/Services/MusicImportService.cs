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

        foreach (var videoUrl in source.Urls)
        {
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

        try
        {
            job.Status = JobStatus.Processing;
            job.StartedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);

            foreach (var item in job.WorkItems)
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
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to enqueue import job {JobId}", job.Id);
            // Keep the persisted job visible; a production system should use an Outbox
            // to avoid partial publishing if RabbitMQ fails partway through a playlist.
            throw;
        }

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

    public async Task<ImportJobProgressDTO?> GetJobProgressAsync(
        int userId, Guid jobId, CancellationToken cancellationToken = default)
    {
        var job = await _dbContext.ImportJobs.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == jobId && x.UserId == userId, cancellationToken);
        if (job is null) return null;

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
}
