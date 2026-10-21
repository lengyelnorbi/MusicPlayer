using Microsoft.AspNetCore.Mvc;
using API.Models;
using API.Services.Interfaces;
using API.Utils;
using API.DTO;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

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

    /// <summary>
    /// Retrieves a paginated list of musics, optionally filtered by search term and genres.
    /// If the user is authenticated, their user ID is used to fetch their playlists for each music.
    /// </summary>
    /// <param name="page"></param>
    /// <param name="limit"></param>
    /// <param name="search"></param>
    /// <param name="genres"></param>
    /// <returns></returns>
    [HttpGet("", Name = "GetMusics")]
    public async Task<MusicListResponseDTO> Get([FromQuery] int page, [FromQuery] int limit, [FromQuery] string? search, [FromQuery] string[]? genres)
    {
        /* get the userID from the JWT token if the user is logged in, otherwise set it to null */
        int? userID = null;
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

        if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var parsedUserID))
        {
            userID = parsedUserID;
        }
        /* userID extraction ends here */

        _logger.LogDebug("Fetching music catalogue. Authenticated: {Authenticated}, UserID: {UserID}, Page: {Page}, Limit: {Limit}",
            User.Identity?.IsAuthenticated,
            userID,
            page,
            limit);
        
        //If user is logged in then add the userID to the method for getting the user's playlists for each music
        if(userID != null)
        {
            if (!validateGetMusicsParameters(page, limit))
            {
                return await _musicService.GetMusicsAsync(userID : userID, search: search, genres: genres);
            }
            return await _musicService.GetMusicsAsync(page, limit, userID, search, genres);
            }
        //If user is not logged in then the user don't get the feature to add musics to their playlists, so the userID is not needed in the method for getting the user's playlists for each music
        else
        {
            if (!validateGetMusicsParameters(page, limit))
            {
                return await _musicService.GetMusicsAsync(search: search, genres: genres);
            }
            return await _musicService.GetMusicsAsync(page, limit, null, search, genres);
        }
       
    }


    /// <summary>
    /// Streams a music file from Google Drive by its ID.
    /// </summary>
    /// <param name="fileID">The ID of the music file to stream.</param>
    /// <returns>The streamed music file.</returns>
    [HttpGet("{fileID}/stream")]
    public async Task<IActionResult> Stream(string fileID)
    {
        if(string.IsNullOrEmpty(fileID))
        {
            return BadRequest("File ID is required.");
        }

        if (!int.TryParse(fileID, out var parsedMusicID) || parsedMusicID <= 0)
        {
            return BadRequest("A positive numeric music ID is required.");
        }

        // Get the Google Drive file ID associated with the music ID
        var googleDriveFileID = await _musicService.GetGoogleDriveFileIdByMusicIdAsync(parsedMusicID);

        if(string.IsNullOrEmpty(googleDriveFileID))
        {
            return NotFound("Google Drive File ID not found for the given music ID.");
        }

        // Stream the music file from Google Drive
        var stream = await _googleDriveService.GetFileStreamAsync(googleDriveFileID);

        return File(stream, "audio/mp4", enableRangeProcessing: true);
    }

    /// <summary>
    /// Downloads a music file by its ID.
    /// This endpoint is protected and requires the "AdminSource" policy for access.
    /// </summary>
    /// <param name="musicID">The ID of the music file to download.</param>
    /// <returns>The downloaded music file.</returns>
    [HttpGet("{musicID}/download")]
    [Authorize]
    public async Task<IActionResult> Download(string musicID)
    {
        if(string.IsNullOrEmpty(musicID))
        {
            _logger.LogWarning("Music ID is required.");
            return BadRequest("File ID is required.");
        }

        if(Int32.TryParse(musicID, out int parsedMusicID) && parsedMusicID <= 0)
        {
            return BadRequest("Invalid File ID.");
        }

        // Get the Google Drive file ID associated with the music ID
        var googleDriveFileID = await _musicService.GetGoogleDriveFileIdByMusicIdAsync(parsedMusicID);

        if(string.IsNullOrEmpty(googleDriveFileID))
        {
            return NotFound("Google Drive File ID not found for the given music ID.");
        }

        // Download the music file from Google Drive
        var result = await _googleDriveService.DownloadMusicFileAsync(googleDriveFileID);

        _logger.LogInformation("Downloading music with ID: {MusicID}, FileName: {FileName} and MimeType: {MimeType}", musicID, result.FileName, result.MimeType);

        return File(result.Content, result.MimeType, result.FileName);
    }

    /// <summary>
    /// Downloads all music files from Google Drive.
    /// This endpoint is protected and requires the "AdminSource" policy for access.
    /// </summary>
    /// <returns></returns>
    [HttpGet("download-all")]
    [Authorize]
    public async Task<IEnumerable<int>> DownloadAllMusic()
    {
        var result = await _musicService.GetMusicsIDFromDBAsync();
        return result;
    }

    /// <summary>
    /// Synchronizes music files from Google Drive to the local database.
    /// This endpoint is protected and requires the "AdminSource" policy for access.
    /// </summary>
    /// <returns></returns>
    [HttpPost("sync-from-drive")]
    [Authorize(Policy = "AdminSource")]
    public async Task<IActionResult> SyncFromGoogleDrive()
    {
        try
        {
            // Fetch music files from Google Drive
            var driveMusics = await _googleDriveService.ListMusicFilesInFolder();

            // Synchronize the fetched music files with the local database then return the status of the synchronization process's result
            var result = await _musicService.AddMissingDriveMusicAsync(driveMusics);

            _logger.LogInformation("Google Drive music sync completed. Drive files: {DriveFileCount}, added: {AddedCount}", result.DriveFileCount, result.AddedCount);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Google Drive music sync failed.");
            return StatusCode(500, "Google Drive music sync failed.");
        }
    }


    /// <summary>
    /// Validates the pagination parameters for fetching musics.
    /// </summary>
    /// <param name="page">The page number.</param>
    /// <param name="limit">The number of items per page.</param>
    /// <returns>True if the parameters are valid; otherwise, false.</returns>
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

    /// <summary>
    /// Adds a new music entry to the database.
    /// This endpoint is protected and requires the user to be authenticated.
    /// </summary>
    /// <param name="music"></param>
    /// <returns></returns>
    [HttpPost("", Name = "AddMusic")]
    [Authorize(Policy = "AdminSource")]
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

    /// <summary>
    /// Deletes a music entry from the database.
    /// This endpoint is protected and requires the user to be authenticated.
    /// </summary>
    /// <param name="id">The ID of the music to delete.</param>
    /// <returns></returns>
    [HttpDelete("musics/{id}", Name = "DeleteMusic")]
    [Authorize(Policy = "AdminSource")]
    public async Task<IActionResult> Delete(int id)
    {
        if (id <= 0) return BadRequest("A valid music ID is required.");
        try
        {
            var deleted = await _musicService.DeleteMusicAsync(id);
            return deleted ? NoContent() : NotFound("Music was not found.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Could not delete music with ID {MusicID}.", id);
            return Problem("Could not delete music entry.");
        }
    }
}
