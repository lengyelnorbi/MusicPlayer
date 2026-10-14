using Microsoft.AspNetCore.Mvc;
using API.Models;
using API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FileUploadController : ControllerBase
{
    private readonly ILogger<FileUploadController> _logger;
    private readonly IAdvancedMsgQueueCommService _advancedMsgQueueCommService;

    public FileUploadController(ILogger<FileUploadController> logger, IAdvancedMsgQueueCommService advancedMsgQueueCommService)
    {
        _logger = logger;
        _advancedMsgQueueCommService = advancedMsgQueueCommService;
    }

    /// <summary>
    /// Uploads a music file to the system by sending a message to the advanced message queue.
    /// This endpoint is protected and requires the "AdminSource" policy for access.
    /// </summary>
    /// <param name="link"></param>
    /// <returns></returns>
    [HttpPost("", Name = "FileUpload")]
    [Authorize(Policy = "AdminSource")] // Require AdminSource policy for access
    public async Task<IActionResult> FileUpload([FromBody] string link)
    {
        _logger.LogInformation("Uploading file: {Link}", link);
        try
        {
            // Create a new music upload message and send it to the advanced message queue
            MusicUploadMessage message = _advancedMsgQueueCommService.CreateMusicUploadMessage(link);
            // Send the message to the advanced message queue for processing
            await _advancedMsgQueueCommService.SendMessageAsync(message);
            return Ok("Music added successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while publishing message to the queue.");
            return StatusCode(500, "An error occurred while processing your request.");
        }
    }
}