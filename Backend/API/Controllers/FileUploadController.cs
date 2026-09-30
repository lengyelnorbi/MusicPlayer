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

    [HttpPost("", Name = "FileUpload")]
    public async Task<IActionResult> FileUpload([FromBody] string link)
    {
        _logger.LogInformation("Uploading file: {Link}", link);
        try
        {
            MusicUploadMessage message = _advancedMsgQueueCommService.CreateMusicUploadMessage(link);
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