using API.Data;
using API.Messaging;
using API.Messaging.Messages;
using API.Models.QueueModels;
using API.Models.Enums;
using API.Models.ResponseModels;
using Microsoft.EntityFrameworkCore;
using API.Services.Interfaces;

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
        int userId,
        string url,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(url))
            throw new ArgumentException(
                "URL is required.");

        // Resolve playlist/single video.
        var source = await _sourceResolver.ResolveAsync(
            url,
            cancellationToken);

        if (source.Urls.Count == 0)
            throw new InvalidOperationException(
                "No videos were found.");

        var job = new ImportJob
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            SourceUrl = url,
            Type = source.Type,
            Status = JobStatus.Pending,
            TotalItems = source.Urls.Count,
            CompletedItems = 0,
            FailedItems = 0,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var videoUrl in source.Urls)
        {
            job.WorkItems.Add(new ImportWorkItem
            {
                Id = Guid.NewGuid(),
                Url = videoUrl,
                Status = WorkStatus.Pending,
                AttemptCount = 0,
                CreatedAt = DateTime.UtcNow
            });
        }

        _dbContext.ImportJobs.Add(job);

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        // Mark job as processing.
        job.Status = JobStatus.Processing;

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        // Publish all work.
        foreach (var workItem in job.WorkItems)
        {
            var message = new MusicWorkMessage
            {
                JobId = job.Id,
                WorkItemId = workItem.Id,
                UserId = userId,
                Url = workItem.Url,
                Attempt = workItem.AttemptCount
            };

            await _rabbitMq.PublishWorkAsync(
                message,
                cancellationToken);
        }

        _logger.LogInformation(
            "Created import job {JobId} with {Count} items",
            job.Id,
            job.WorkItems.Count);

        return new CreateMusicImportResponse
        {
            JobId = job.Id,
            Type = job.Type,
            Status = job.Status,
            TotalItems = job.TotalItems
        };
    }

    public async Task<ImportJobProgress?> GetJobProgressAsync(
        int userId,
        Guid jobId,
        CancellationToken cancellationToken = default)
    {
        var job = await _dbContext.ImportJobs
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x =>
                    x.Id == jobId &&
                    x.UserId == userId,
                cancellationToken);

        if (job == null)
            return null;

        return new ImportJobProgress
        {
            JobId = job.Id,
            Status = job.Status,
            TotalItems = job.TotalItems,
            CompletedItems = job.CompletedItems,
            FailedItems = job.FailedItems
        };
    }
}