using API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using API.Models;
using API.Services;
using API.Utils;
using API.Models.RequestModels;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using API.Data;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlaylistController : ControllerBase
{
    private readonly ILogger<PlaylistController> _logger;
    private readonly IPlaylistService _playlistService;
    private readonly MusicPlayerDbContext _dbContext;

    public PlaylistController(ILogger<PlaylistController> logger, IPlaylistService playlistService, MusicPlayerDbContext dbContext)
    {
        _logger = logger;
        _playlistService = playlistService;
        _dbContext = dbContext;
    }

    /// <summary>
    /// Retrieves a paginated list of playlists.
    /// This endpoint requires the user to be authenticated.
    /// </summary>
    /// <param name="page"></param>
    /// <param name="limit"></param>
    /// <returns></returns>
    [Authorize]
    [HttpGet("", Name = "GetPlaylists")]
    public async Task<IActionResult> GetPlaylists([FromQuery] int page, [FromQuery] int limit)
    {
        if (page < 1 || limit < 1)
            return BadRequest("Page and limit must be positive values.");

        try
        {
            var playlists = await _playlistService.GetPlaylistsAsync(page, limit);
            return Ok(playlists);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Could not load playlists for page {Page}, limit {Limit}.", page, limit);
            return Problem("Could not load playlists.");
        }
    }

    /// <summary>
    /// Retrieves a paginated list of playlists for a specific user.
    /// This endpoint requires the user to be authenticated.
    /// </summary>
    /// <param name="userID"></param>
    /// <param name="page"></param>
    /// <param name="limit"></param>
    /// <returns></returns>
    [Authorize]
    [HttpGet("user/{userID}", Name = "GetUserPlaylists")]
    public async Task<IActionResult> GetUserPlaylists(int userID, [FromQuery] int page, [FromQuery] int limit)
    {
        if (userID <= 0 || page <= 0 || limit <= 0)
            return BadRequest("User ID, page, and limit must be positive values.");

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var authenticatedUserId))
            return Unauthorized("The access token does not contain a valid user ID.");

        // A user cannot enumerate another account's private playlists by changing the route ID.
        if (authenticatedUserId != userID && !User.IsInRole("Admin"))
            return Forbid();

        try
        {
            var playlists = await _playlistService.GetUserPlaylistsAsync(userID, page, limit);
            return Ok(playlists);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Could not load playlists for user {UserID}.", userID);
            return Problem("Could not load playlists.");
        }
    }

    /// <summary>
    /// Retrieves the playlists followed by a specific user.
    /// This endpoint requires the user to be authenticated.
    /// </summary>
    /// <param name="userID"></param>
    /// <returns></returns>
    [Authorize]
    [HttpGet("followed", Name = "GetUserFollowedPlaylists")]
    public async Task<IActionResult> GetFollowedPlaylists([FromQuery] int userID)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var authenticatedUserId))
            return Unauthorized("The access token does not contain a valid user ID.");
        if (userID <= 0) return BadRequest("A valid user ID is required.");
        if (authenticatedUserId != userID && !User.IsInRole("Admin")) return Forbid();

        return Ok(await _playlistService.GetUserFollowedPlaylistsAsync(userID));
    }

    /// <summary>
    /// Retrieves a specific playlist by its ID.
    /// This endpoint requires the user to be authenticated.
    /// </summary>
    /// <param name="playlistID"></param>
    /// <param name="page"></param>
    /// <param name="limit"></param>
    /// <returns></returns>
    [Authorize]
    [HttpGet("{playlistID}", Name = "GetPlaylistByID")]
    public async Task<IActionResult> GetPlaylistByID(int playlistID)
    {
        if (playlistID <= 0) return BadRequest("A valid playlist ID is required.");
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized("The access token does not contain a valid user ID.");

        var ownsPlaylist = await _dbContext.UserPlaylists.AsNoTracking()
            .AnyAsync(up => up.PlaylistID == playlistID && up.UserID == userId);
        if (!ownsPlaylist && !User.IsInRole("Admin")) return Forbid();

        var playlist = await _playlistService.GetPlaylistByIDAsync(playlistID);
        return playlist is null ? NotFound("Playlist was not found.") : Ok(playlist);
    }

    /// <summary>
    /// Adds a new playlist for the authenticated user.
    /// This endpoint requires the user to be authenticated.
    /// </summary>
    /// <param name="playlistRequest"></param>
    /// <returns></returns>
    [Authorize]
    [HttpPost("", Name = "AddPlaylist")]
    public async Task<IActionResult> Post([FromBody] CreatePlaylistRequest playlistRequest)
    {
        if (playlistRequest == null || string.IsNullOrWhiteSpace(playlistRequest.Name))
        {
            return BadRequest("Playlist name is required.");
        }

        // Retrieve the user ID from the claims of the authenticated user
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userID))
        {
            return Unauthorized("User ID claim is missing or invalid.");
        }

        _logger.LogInformation("Adding new playlist: {Name}", playlistRequest.Name);
        // Create the new playlist using the playlist service
        var result = await _playlistService.CreatePlaylistAsync(playlistRequest.Name.Trim(), userID);

        if (result != null)
        {
            return Ok(new
            {
                message = "Playlist added successfully.",
                result
            });
        }
        else
        {
            return StatusCode(500, "An error occurred while adding the playlist.");
        }
    }

    /// <summary>
    /// Deletes a specific playlist by its ID.
    /// This endpoint requires the user to be authenticated.
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    [Authorize]
    [HttpDelete("playlists/{id}", Name = "DeletePlaylist")]
    public async Task<IActionResult> Delete(int id)
    {
        if (id <= 0) return BadRequest("A valid playlist ID is required.");
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized("The access token does not contain a valid user ID.");

        var ownsPlaylist = await _dbContext.UserPlaylists.AsNoTracking()
            .AnyAsync(up => up.PlaylistID == id && up.UserID == userId);
        if (!ownsPlaylist && !User.IsInRole("Admin")) return Forbid();

        var deleted = await _playlistService.DeletePlaylistAsync(id);
        return deleted ? NoContent() : NotFound("Playlist was not found.");
    }

    /// <summary>
    /// Updates a specific playlist by its ID.
    /// This endpoint requires the user to be authenticated.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="playlist"></param>
    /// <returns></returns>
    [Authorize]
    [HttpPut("playlists/{id}", Name = "UpdatePlaylist")]
    public async Task<IActionResult> Put(int id, [FromBody] Playlist playlist)
    {
        if (id <= 0 || playlist == null || playlist.ID != id || string.IsNullOrWhiteSpace(playlist.Name))
            return BadRequest("Playlist data is invalid.");

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized("The access token does not contain a valid user ID.");

        var ownsPlaylist = await _dbContext.UserPlaylists.AsNoTracking()
            .AnyAsync(up => up.PlaylistID == id && up.UserID == userId);
        if (!ownsPlaylist && !User.IsInRole("Admin")) return Forbid();

        var updated = await _playlistService.UpdatePlaylistAsync(playlist);
        return updated != null ? Ok("Playlist updated successfully.") : NotFound("Playlist was not found.");
    }
}