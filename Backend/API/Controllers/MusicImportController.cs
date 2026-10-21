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

    public MusicImportController(IMusicImportService importService, ILogger<MusicImportController> logger, IConfiguration configuration)
    {
        _importService = importService;
        _logger = logger;
        _temporaryMusicPath = configuration["MusicStorage:TempPath"] ?? throw new InvalidOperationException("MusicStorage:TempPath is not configured.");
    }

    /// <summary>
    /// Creates a new music import job for the authenticated user.
    /// This endpoint is protected and requires the "AdminSource" policy for access.
    /// </summary>
    /// <param name="request"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    [HttpPost("", Name = "CreateImportJob")]
    [Authorize(Policy = "AdminSource")]
    public async Task<IActionResult> CreateImport([FromBody] CreateImportJobRequest request, CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Url))
        { 
            return BadRequest(new { message = "URL is required." });
        }

        var userId = GetUserId();
        if (userId is null)
        { 
            return Unauthorized();
        }

        try
        {
            // Create a new music import job for the authenticated user
            var result = await _importService.CreateImportAsync(userId.Value, request.Url, cancellationToken);
            return Accepted(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create music import.");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Failed to create music import." });
        }
    }

    /// <summary>
    /// Retrieves the details of a specific music import job for the authenticated user.
    /// This endpoint is protected and requires the "AdminSource" policy for access.
    /// </summary>
    /// <param name="jobId"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    [HttpGet("{jobId:guid}")]
    [Authorize(Policy = "AdminSource")]
    public async Task<IActionResult> GetJob(Guid jobId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null)
        { 
            return Unauthorized();
        }
        // Retrieve the details of a specific music import job for the authenticated user
        var result = await _importService.GetJobAsync(userId.Value, jobId, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }


    /// <summary>
    /// Retrieves the list of music import jobs for the authenticated user.
    /// This endpoint is protected and requires the "AdminSource" policy for access.
    /// </summary>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    [HttpGet]
    [Authorize(Policy = "AdminSource")]
    public async Task<IActionResult> GetJobs(CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) 
        { 
            return Unauthorized();
        }
        // Retrieve the list of music import jobs for the authenticated user
        return Ok(await _importService.GetJobsAsync(userId.Value, cancellationToken));
    }


    /// <summary>
    /// Deletes a specific music import job for the authenticated user.
    /// This endpoint is protected and requires the "AdminSource" policy for access.
    /// </summary>
    /// <param name="jobId"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    [HttpDelete("{jobId:guid}")]
    [Authorize(Policy = "AdminSource")]
    public async Task<IActionResult> DeleteJob(Guid jobId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) 
        {
            return Unauthorized();
        }
        // Delete a specific music import job for the authenticated user
        var deleted = await _importService.DeleteJobAsync(userId.Value, jobId, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    /// <summary>
    /// Deletes a specific work item from a music import job for the authenticated user.
    /// This endpoint is protected and requires the "AdminSource" policy for access.
    /// </summary>
    /// <param name="jobId"></param>
    /// <param name="workItemId"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    [HttpDelete("{jobId:guid}/work/{workItemId:guid}")]
    [Authorize(Policy = "AdminSource")]
    public async Task<IActionResult> DeleteWorkItem(Guid jobId, Guid workItemId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) 
        {
            return Unauthorized();
        }
        // Delete a specific work item from a music import job for the authenticated user
        var deleted = await _importService.DeleteWorkItemAsync(userId.Value, jobId, workItemId, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    /// <summary>
    /// Retries a specific music import job for the authenticated user.
    /// This endpoint is protected and requires the "AdminSource" policy for access.
    /// </summary>
    /// <param name="jobId"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    [HttpPost("{jobId:guid}/retry")]
    [Authorize(Policy = "AdminSource")]
    public async Task<IActionResult> RetryJob(Guid jobId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }
        // Retry a specific music import job for the authenticated user
        var result = await _importService.RetryJobAsync(userId.Value, jobId, cancellationToken);
        return result is null ? NotFound() : Accepted(result);
    }

    /// <summary>
    /// Starts a specific music import job for the authenticated user.
    /// This endpoint is protected and requires the "AdminSource" policy for access.
    /// </summary>
    /// <param name="jobId"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    [HttpPost("{jobId:guid}/start")]
    [Authorize(Policy = "AdminSource")]
    public async Task<IActionResult> StartJob(Guid jobId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) 
        {
            return Unauthorized();
        }
        // Start a specific music import job for the authenticated user
        var result = await _importService.StartJobAsync(userId.Value, jobId, cancellationToken);
        return result is null ? NotFound() : Accepted(result);
    }

    /// <summary>
    /// Starts a specific work item from a music import job for the authenticated user.
    /// This endpoint is protected and requires the "AdminSource" policy for access.
    /// </summary>
    /// <param name="jobId"></param>
    /// <param name="workItemId"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    [HttpPost("{jobId:guid}/work/{workItemId:guid}/start")]
    [Authorize(Policy = "AdminSource")]
    public async Task<IActionResult> StartWorkItem(Guid jobId, Guid workItemId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }
        // Start a specific work item from a music import job for the authenticated user
        var result = await _importService.StartWorkItemAsync(userId.Value, jobId, workItemId, cancellationToken);
        return result is null ? NotFound() : Accepted(result);
    }

    /// <summary>
    /// Gets the progress of a specific music import job for the authenticated user.
    /// This endpoint is protected and requires the "AdminSource" policy for access.
    /// </summary>
    /// <param name="jobId"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    [HttpGet("{jobId:guid}/progress")]
    [Authorize(Policy = "AdminSource")]
    public async Task<IActionResult> GetJobProgress(Guid jobId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }
        // Get the progress of a specific music import job for the authenticated user
        var result = await _importService.GetJobProgressAsync(userId.Value, jobId, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>
    /// Downloads a specific work item from a music import job for the authenticated user.
    /// This endpoint is protected and requires the "AdminSource" policy for access.
    /// </summary>
    /// <param name="workItemId"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    [HttpGet("work/{workItemId:guid}/download")]
    [Authorize(Policy = "AdminSource")]
    public async Task<IActionResult> DownloadWorkItem(Guid workItemId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        // Retrieve the work item details for the authenticated user
        var workItem = await _importService.GetWorkItemByIdAsync(workItemId, userId.Value, cancellationToken);
        if (workItem is null)
        {
            return NotFound();
        }
        if (workItem.Status != WorkStatus.Completed)
        {
            return BadRequest("The file is not ready.");
        }
        if (string.IsNullOrWhiteSpace(workItem.TemporaryFilePath))
        {
            return NotFound("No temporary file is registered.");
        }

        // Get the root path for temporary music files and log it
        var root = Path.GetFullPath(_temporaryMusicPath);
        _logger.LogInformation("Temporary music root path: {Root}", root);

        // Get the full path of the temporary file and validate it
        var fullPath = Path.GetFullPath(Path.Combine(root, workItem.TemporaryFilePath));
        _logger.LogInformation("Attempting to download file from path: {FullPath}", fullPath);

        // Validate that the full path is within the temporary music root directory to prevent directory traversal attacks
        var relativeToRoot = Path.GetRelativePath(root, fullPath);
        _logger.LogInformation("Relative path to root: {RelativePath}", relativeToRoot);

        if (Path.IsPathRooted(relativeToRoot) || relativeToRoot == ".." ||
            relativeToRoot.StartsWith(".." + Path.DirectorySeparatorChar, StringComparison.Ordinal) ||
            relativeToRoot.StartsWith(".." + Path.AltDirectorySeparatorChar, StringComparison.Ordinal))
        {
            return BadRequest("Invalid file path.");
        }

        if (!System.IO.File.Exists(fullPath))
        {
            return NotFound("The temporary file no longer exists.");
        }

        // Mark the work item as downloaded after the response is completed
        var fileName = Path.GetFileName(workItem.TemporaryFileName ?? fullPath);
        HttpContext.Response.OnCompleted(() =>
            _importService.MarkWorkItemDownloadedAsync(workItemId, userId.Value, fullPath));

        // Open the file stream for the temporary file and return it as a file result with range processing enabled
        var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete, bufferSize: 81920, useAsync: true);
        return File(stream, "application/octet-stream", fileName, enableRangeProcessing: true);
    }

    /// <summary>
    /// Retrieves the authenticated user's ID from the claims in the JWT token.
    /// This method checks for the NameIdentifier claim and attempts to parse it as an integer.
    /// </summary>
    /// <returns></returns>
    private int? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim is not null && int.TryParse(claim.Value, out var userId) ? userId : null;
    }
}
