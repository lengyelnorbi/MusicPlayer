using Microsoft.AspNetCore.Mvc;
using API.Models;
using API.Services.Interfaces;
using API.Utils;
using Microsoft.AspNetCore.Authorization;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MusicController : ControllerBase
{
    private readonly ILogger<MusicController> _logger;
    private readonly IMusicService _musicService;
    private readonly IGoogleDriveService _googleDriveService;

    public MusicController(ILogger<MusicController> logger, IMusicService musicService, IGoogleDriveService googleDriveService)
    {
        _logger = logger;
        _musicService = musicService;
        _googleDriveService = googleDriveService;
    }


    [HttpGet("", Name = "GetMusics")]
    public async Task<PagedResult<Music>> Get([FromQuery] int page, [FromQuery] int limit)
    {
        if (!validateGetMusicsParameters(page, limit))
        {
            return await _musicService.GetMusicsAsync();
        }
        return await _musicService.GetMusicsAsync(page, limit);
    }

    [HttpGet("{fileID}/stream")]
    public async Task<IActionResult> Stream(string fileID)
    {
        if(string.IsNullOrEmpty(fileID))
        {
            return BadRequest("File ID is required.");
        }

        if(Int32.TryParse(fileID, out int parsedMusicID) && parsedMusicID <= 0)
        {
            return BadRequest("Invalid File ID.");
        }

        var googleDriveFileID = await _musicService.GetGoogleDriveFileIdByMusicIdAsync(parsedMusicID);
        var stream = await _googleDriveService.GetFileStreamAsync(googleDriveFileID);

        return File(
            stream,
            "audio/mp4",
            enableRangeProcessing: false);
    }

    [HttpGet("{musicID}/download")]
    [Authorize(Policy = "AdminSource")]
    public async Task<IActionResult> Download(string musicID)
    {
        if(string.IsNullOrEmpty(musicID))
        {
            return BadRequest("File ID is required.");
        }

        if(Int32.TryParse(musicID, out int parsedMusicID) && parsedMusicID <= 0)
        {
            return BadRequest("Invalid File ID.");
        }

        var googleDriveFileID = await _musicService.GetGoogleDriveFileIdByMusicIdAsync(parsedMusicID);
        var result = await _googleDriveService
        .DownloadMusicFileAsync(googleDriveFileID);

        _logger.LogInformation("Downloading music with ID: {MusicID}, FileName: {FileName} and MimeType: {MimeType}", musicID, result.FileName, result.MimeType);

        return File(
            result.Content,
            result.MimeType,
            result.FileName
        );
    }

    [HttpGet("download-all")]
    [Authorize(Policy = "AdminSource")]
    public async Task<IEnumerable<int>> DownloadAllMusic()
    {
        var result = await _musicService.GetMusicsIDFromDBAsync();
        return result;
    }

    private bool validateGetMusicsParameters(int page, int limit)
    {
        if(int.TryParse(page.ToString(), out int parsedPage) && int.TryParse(limit.ToString(), out int parsedLimit))
        {
            if (parsedPage <= 0 || parsedLimit <= 0)
            {
                _logger.LogWarning("Invalid pagination parameters: page={Page}, limit={Limit}", page, limit);
                return false;
            }
            return true;
        }

        if (page <= 0 || limit <= 0)
        {
            _logger.LogWarning("Invalid pagination parameters: page={Page}, limit={Limit}", page, limit);
            return false;
        }
        return true;
    }

    [HttpPost("", Name = "AddMusic")]
    [Authorize]
    public async Task<IActionResult> Post([FromBody] Music music)
    {
        if (music == null)
        {
            return BadRequest("Music data is null.");
        }
        try
        {
            return Ok("Music added successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error publishing message to the message queue.");
            return StatusCode(500, "An error occurred while processing your request.");
        }
    }

    [HttpDelete("musics/{id}", Name = "DeleteMusic")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        _logger.LogInformation("Deleting music with ID: {Id}", id);
        var result = await _musicService.DeleteMusicAsync(id);

        if (result)
        {
            return Ok("Music deleted successfully.");
        }
        else
        {
            return StatusCode(500, "An error occurred while deleting the music.");
        }
    }

    [HttpPut("musics/{id}", Name = "UpdateMusic")]
    [Authorize]
    public async Task<IActionResult> Put(int id, [FromBody] Music music)
    {
        if (music == null || music.ID != id)
        {
            return BadRequest("Invalid music data.");
        }

        _logger.LogInformation("Updating music with ID: {Id}", id);
        var result = await _musicService.UpdateMusicAsync(music);

        if (result != null)
        {
            return Ok("Music updated successfully.");
        }
        else
        {
            return StatusCode(500, "An error occurred while updating the music.");
        }
    }
}