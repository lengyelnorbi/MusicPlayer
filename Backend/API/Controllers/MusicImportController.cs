using System.Security.Claims;
using API.Models.Enums;
using API.Models.RequestModels;
using API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize]
[Route("api/music-import")]
public class MusicImportController : ControllerBase
{
    private readonly IMusicImportService _importService;
    private readonly ILogger<MusicImportController> _logger;
    private readonly string _temporaryMusicPath;

    public MusicImportController(
        IMusicImportService importService,
        ILogger<MusicImportController> logger,
        IConfiguration configuration)
    {
        _importService = importService;
        _logger = logger;
        _temporaryMusicPath = configuration["MusicStorage:TempPath"]
            ?? throw new InvalidOperationException("MusicStorage:TempPath is not configured.");
    }

    [HttpPost("", Name = "CreateImportJob")]
    public async Task<IActionResult> CreateImport(
        [FromBody] CreateImportJobRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Url))
            return BadRequest(new { message = "URL is required." });

        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        try
        {
            var result = await _importService.CreateImportAsync(userId.Value, request.Url, cancellationToken);
            return Accepted(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create music import.");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "Failed to create music import." });
        }
    }

    [HttpGet("{jobId:guid}")]
    public async Task<IActionResult> GetJob(Guid jobId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var result = await _importService.GetJobAsync(userId.Value, jobId, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetJobs(CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        return Ok(await _importService.GetJobsAsync(userId.Value, cancellationToken));
    }

    [HttpPost("{jobId:guid}/retry")]
    public async Task<IActionResult> RetryJob(Guid jobId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var result = await _importService.RetryJobAsync(userId.Value, jobId, cancellationToken);
        return result is null ? NotFound() : Accepted(result);
    }

    [HttpPost("{jobId:guid}/start")]
    public async Task<IActionResult> StartJob(Guid jobId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var result = await _importService.StartJobAsync(userId.Value, jobId, cancellationToken);
        return result is null ? NotFound() : Accepted(result);
    }

    [HttpPost("{jobId:guid}/work/{workItemId:guid}/start")]
    public async Task<IActionResult> StartWorkItem(
        Guid jobId, Guid workItemId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var result = await _importService.StartWorkItemAsync(
            userId.Value, jobId, workItemId, cancellationToken);
        return result is null ? NotFound() : Accepted(result);
    }

    [HttpGet("{jobId:guid}/progress")]
    public async Task<IActionResult> GetJobProgress(Guid jobId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var result = await _importService.GetJobProgressAsync(userId.Value, jobId, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("work/{workItemId:guid}/download")]
    public async Task<IActionResult> DownloadWorkItem(Guid workItemId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var workItem = await _importService.GetWorkItemByIdAsync(workItemId, userId.Value, cancellationToken);
        if (workItem is null) return NotFound();
        if (workItem.Status != WorkStatus.Completed) return BadRequest("The file is not ready.");
        if (string.IsNullOrWhiteSpace(workItem.TemporaryFilePath))
            return NotFound("No temporary file is registered.");

        var root = Path.GetFullPath(_temporaryMusicPath);
        _logger.LogInformation("Temporary music root path: {Root}", root);
        var fullPath = Path.GetFullPath(Path.Combine(root, workItem.TemporaryFilePath));
        _logger.LogInformation("Attempting to download file from path: {FullPath}", fullPath);
        var relativeToRoot = Path.GetRelativePath(root, fullPath);
        _logger.LogInformation("Relative path to root: {RelativePath}", relativeToRoot);
        if (Path.IsPathRooted(relativeToRoot) || relativeToRoot == ".." ||
            relativeToRoot.StartsWith(".." + Path.DirectorySeparatorChar, StringComparison.Ordinal) ||
            relativeToRoot.StartsWith(".." + Path.AltDirectorySeparatorChar, StringComparison.Ordinal))
            return BadRequest("Invalid file path.");

        if (!System.IO.File.Exists(fullPath)) return NotFound("The temporary file no longer exists.");

        var fileName = Path.GetFileName(workItem.TemporaryFileName ?? fullPath);
        HttpContext.Response.OnCompleted(() =>
            _importService.MarkWorkItemDownloadedAsync(
                workItemId, userId.Value, fullPath));

        var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read,
            FileShare.ReadWrite | FileShare.Delete,
            bufferSize: 81920, useAsync: true);
        return File(stream, "application/octet-stream", fileName, enableRangeProcessing: true);
    }

    private int? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim is not null && int.TryParse(claim.Value, out var userId) ? userId : null;
    }
}
