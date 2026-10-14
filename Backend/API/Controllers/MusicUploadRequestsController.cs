using System.Security.Claims;
using API.Models.RequestModels;
using API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/music-upload-requests")]
[Authorize]
public class MusicUploadRequestsController : ControllerBase
{
    private readonly IMusicUploadRequestService _service;

    /// Response code documentation for the MusicUploadRequestsController endpoints:
    /// <response code="200">Returns the list of pending music upload requests for admin users.</response>
    /// <response code="202">The request was accepted and is being processed.</response>
    /// <response code="400">The request was invalid.</response>
    /// <response code="401">The user is not authenticated.</response>
    /// <response code="403">The user does not have the required permissions to access this endpoint.</response>
    /// <response code="404">The requested resource was not found.</response>
    /// <response code="409">A conflict occurred while processing the request.</response>
    /// <response code="422">The request was well-formed but was unable to be followed due to semantic errors.</response>
    /// <response code="500">An error occurred while processing the request.</response>
    /// <response code="501">The requested functionality is not implemented.</response>
    /// <response code="502">A bad gateway error occurred while processing the request.</response>
    /// <response code="503">The service is currently unavailable. Please try again later.</response>
    /// <response code="504">The request timed out. Please try again later.</response>
    public MusicUploadRequestsController(IMusicUploadRequestService service) => _service = service;

    /// <summary>
    /// Creates a new music upload request for the authenticated user.
    /// This endpoint is protected and requires the user to be authenticated.
    /// </summary>
    /// <param name="request">The request containing the URL of the music to be uploaded.</param>
    /// <param name="cancellationToken">A cancellation token to cancel the operation.</param>
    /// <returns>An IActionResult indicating the result of the operation.</returns>
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create(CreateMusicUploadRequest request, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null)
        { 
            return Unauthorized();
        }
        try 
        { 
            // Create a new music upload request for the authenticated user
            return Accepted(await _service.CreateAsync(userId.Value, request.Url, cancellationToken)); 
        }
        catch (ArgumentException ex) 
        { 
            return BadRequest(new { message = ex.Message }); 
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Retrieves the music upload requests for the authenticated user.
    /// This endpoint is protected and requires the user to be authenticated.
    /// </summary>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    [HttpGet("mine")]
    [Authorize]
    public async Task<IActionResult> Mine(CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        return userId is null ? Unauthorized() : Ok(await _service.GetMineAsync(userId.Value, cancellationToken));
    }

    /// <summary>
    /// Retrieves the pending music upload requests for admin users.
    /// This endpoint is protected and requires the "AdminSource" policy for access.
    /// </summary>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    [HttpGet("pending")]
    [Authorize(Policy = "AdminSource")]
    public async Task<IActionResult> Pending(CancellationToken cancellationToken) => Ok(await _service.GetPendingAsync(cancellationToken));

    /// <summary>
    /// Imports a music upload request by its ID for admin users.
    /// This endpoint is protected and requires the "AdminSource" policy for access.
    /// </summary>
    /// <param name="requestId"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    [HttpPost("{requestId:guid}/import")]
    [Authorize(Policy = "AdminSource")]
    public async Task<IActionResult> Import(Guid requestId, CancellationToken cancellationToken)
    {
        var adminId = GetUserId();
        if (adminId is null) 
        {
            return Unauthorized();
        }
        try
        {
            var result = await _service.ImportAsync(adminId.Value, requestId, cancellationToken);
            return result is null ? NotFound() : Accepted(result);
        }
        catch (ArgumentException ex) 
        { 
            return BadRequest(new { message = ex.Message }); 
        }
        catch (InvalidOperationException ex) 
        { 
            return BadRequest(new { message = ex.Message }); 
        }
    }

    /// <summary>
    /// Retrieves the authenticated user's ID from the claims.
    /// If the user is not authenticated or the claim is missing, returns null.
    /// </summary>
    /// <returns></returns>
    private int? GetUserId() => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
}
