using API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using API.Models;
using API.Services;
using API.Utils;
using API.Models.RequestModels;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlaylistController : ControllerBase
{
    private readonly ILogger<PlaylistController> _logger;
    private readonly IPlaylistService _playlistService;
    private readonly IMusicService _musicService;

    public PlaylistController(ILogger<PlaylistController> logger, IPlaylistService playlistService, IMusicService musicService)
    {
        _logger = logger;
        _playlistService = playlistService;
        _musicService = musicService;
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
    public async Task<PagedResult<Playlist>> GetPlaylists([FromQuery] int page, [FromQuery] int limit)
    {
        try
        {
            // Fetch the paginated list of playlists using the playlist service
            var playlists = await _playlistService.GetPlaylistsAsync(page, limit);
            _logger.LogInformation("Fetched playlists for page: {Page}, limit: {Limit}", page, limit);
            return playlists;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while fetching playlists!");
            return new PagedResult<Playlist>();
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
    public PagedResult<Playlist> GetUserPlaylists(int userID, [FromQuery] int page, [FromQuery] int limit)
    {
        // Fetch the paginated list of playlists for the specified user using the playlist service
        return _playlistService.GetUserPlaylistsAsync(userID, page, limit).Result;
    }

    /// <summary>
    /// Retrieves the playlists followed by a specific user.
    /// This endpoint requires the user to be authenticated.
    /// </summary>
    /// <param name="userID"></param>
    /// <returns></returns>
    [Authorize]
    [HttpGet("followed", Name = "GetUserFollowedPlaylists")]
    public async Task<IEnumerable<Playlist>> GetFollowedPlaylists(int userID)
    {
        // Fetch the list of playlists followed by the specified user using the playlist service
        return await _playlistService.GetUserFollowedPlaylistsAsync(userID);
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
    public async Task<Playlist> GetPlaylistByID(int playlistID, [FromQuery] int page, [FromQuery] int limit)
    {
        // Fetch the playlist by its ID using the playlist service
        return await _playlistService.GetPlaylistByIDAsync(playlistID);
    }

    /// <summary>
    /// Adds a new playlist for the authenticated user.
    /// This endpoint requires the user to be authenticated.
    /// </summary>
    /// <param name="playlistRequest"></param>
    /// <returns></returns>
    [Authorize]
    [HttpPost("", Name = "AddPlaylist")]
    public IActionResult Post([FromBody] CreatePlaylistRequest playlistRequest)
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
        var result = _playlistService.CreatePlaylistAsync(playlistRequest.Name, userID).Result;

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
    public IActionResult Delete(int id)
    {
        _logger.LogInformation("Deleting playlist with ID: {Id}", id);
        // Delete the specified playlist using the playlist service
        var result = _playlistService.DeletePlaylistAsync(id).Result;

        if (result)
        {
            return Ok("Playlist deleted successfully.");
        }
        else
        {
            return StatusCode(500, "An error occurred while deleting the playlist.");
        }
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
    public IActionResult Put(int id, [FromBody] Playlist playlist)
    {
        if (playlist == null || playlist.ID != id)
        {
            return BadRequest("Playlist data is invalid.");
        }

        _logger.LogInformation("Updating playlist with ID: {Id}", id);
        // Update the specified playlist using the playlist service
        var result = _playlistService.UpdatePlaylistAsync(playlist).Result;

        if (result != null)
        {
            return Ok("Playlist updated successfully.");
        }
        else
        {
            return StatusCode(500, "An error occurred while updating the playlist.");
        }
    }
}