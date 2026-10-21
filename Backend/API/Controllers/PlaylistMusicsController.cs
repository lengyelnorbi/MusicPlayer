using Microsoft.AspNetCore.Mvc;
using API.Models.RequestModels;
using API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using API.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlaylistMusicsController : ControllerBase
{
    private readonly ILogger<PlaylistMusicsController> _logger;
    private readonly IPlaylistService _playlistService;
    private readonly MusicPlayerDbContext _dbContext;

    public PlaylistMusicsController(ILogger<PlaylistMusicsController> logger, IPlaylistService playlistService, MusicPlayerDbContext dbContext)
    {
        _logger = logger;
        _playlistService = playlistService;
        _dbContext = dbContext;
    }

    /// <summary>
    /// Adds a music item to a specified playlist.
    /// This endpoint requires the user to be authenticated.
    /// </summary>
    /// <param name="playlistMusic"></param>
    /// <returns></returns>
    [HttpPost("", Name = "AddMusicToPlaylist")]
    [Authorize]
    public async Task<IActionResult> AddMusicToPlaylist([FromBody] PlaylistMusic playlistMusic)
    {
        if (playlistMusic == null || playlistMusic.PlaylistID <= 0 || playlistMusic.MusicID <= 0)
            return BadRequest("A valid playlist ID and music ID are required.");

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized("The access token does not contain a valid user ID.");

        var ownsPlaylist = await _dbContext.UserPlaylists.AsNoTracking()
            .AnyAsync(up => up.PlaylistID == playlistMusic.PlaylistID && up.UserID == userId);
        if (!ownsPlaylist && !User.IsInRole("Admin"))
            return Forbid();

        try
        {
            await _playlistService.AddMusicToPlaylistAsync(playlistMusic.PlaylistID, playlistMusic.MusicID);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Could not add music {MusicID} to playlist {PlaylistID}.", playlistMusic.MusicID, playlistMusic.PlaylistID);
            return Problem("Could not add music to the playlist.");
        }
    }

    /// <summary>
    /// Removes a music item from a specified playlist.
    /// This endpoint requires the user to be authenticated.
    /// </summary>
    /// <param name="playlistMusic"></param>
    /// <returns></returns>
    [HttpDelete("", Name = "RemoveMusicFromPlaylist")]
    [Authorize]
    public async Task<IActionResult> RemoveMusicFromPlaylist([FromBody] PlaylistMusic playlistMusic)
    {
        if (playlistMusic == null || playlistMusic.PlaylistID <= 0 || playlistMusic.MusicID <= 0)
            return BadRequest("A valid playlist ID and music ID are required.");

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized("The access token does not contain a valid user ID.");

        var ownsPlaylist = await _dbContext.UserPlaylists.AsNoTracking()
            .AnyAsync(up => up.PlaylistID == playlistMusic.PlaylistID && up.UserID == userId);
        if (!ownsPlaylist && !User.IsInRole("Admin"))
            return Forbid();

        try
        {
            await _playlistService.RemoveMusicFromPlaylistAsync(playlistMusic.PlaylistID, playlistMusic.MusicID);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Could not remove music {MusicID} from playlist {PlaylistID}.", playlistMusic.MusicID, playlistMusic.PlaylistID);
            return Problem("Could not remove music from the playlist.");
        }
    }
}