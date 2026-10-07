using System.Security.Claims;
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

    public MusicImportController(
        IMusicImportService importService,
        ILogger<MusicImportController> logger)
    {
        _importService = importService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> CreateImport(
        [FromBody] CreateMusicImportRequest request,
        CancellationToken cancellationToken)
    {
        if (request == null ||
            string.IsNullOrWhiteSpace(request.Url))
        {
            return BadRequest(
                new
                {
                    message = "URL is required."
                });
        }

        var userId = GetUserId();

        if (userId == null)
        {
            return Unauthorized();
        }

        try
        {
            var result =
                await _importService.CreateImportAsync(
                    userId.Value,
                    request.Url,
                    cancellationToken);

            return Accepted(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(
                new
                {
                    message = ex.Message
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to create music import.");

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    message =
                        "Failed to create music import."
                });
        }
    }

    [HttpGet("{jobId:guid}")]
    public async Task<IActionResult> GetJob(
        Guid jobId,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        if (userId == null)
            return Unauthorized();

        var result =
            await _importService.GetJobProgressAsync(
                userId.Value,
                jobId,
                cancellationToken);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    private int? GetUserId()
    {
        var claim =
            User.FindFirst(
                ClaimTypes.NameIdentifier);

        if (claim == null)
            return null;

        return int.TryParse(
            claim.Value,
            out var userId)
            ? userId
            : null;
    }
}