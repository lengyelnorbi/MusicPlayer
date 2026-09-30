using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("internal/upload-jobs")]
[AllowAnonymous]
public class InternalUploadJobsController : ControllerBase
{
    private readonly ILogger<InternalUploadJobsController> _logger;

    public InternalUploadJobsController(
        ILogger<InternalUploadJobsController> logger)
    {
        _logger = logger;
    }

    [HttpPatch("{jobId:guid}")]
    public IActionResult UpdateJob(
        Guid jobId,
        [FromBody] UpdateUploadJobRequest request)
    {
        _logger.LogInformation(
            "Worker updated job {JobId}: {Status}",
            jobId,
            request.Status);

        // TODO: Update your database here.

        return Ok();
    }
}

public class UpdateUploadJobRequest
{
    public string Status { get; set; } = string.Empty;
    public string? Error { get; set; }
    public string? ThirdPartyId { get; set; }
}