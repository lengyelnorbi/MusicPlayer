using API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using API.Models;
using API.Services;
using API.Utils;

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

    [HttpGet("", Name = "GetPlaylists")]
    public async Task<PagedResult<Playlist>> GetPlaylists([FromQuery] int page, [FromQuery] int limit)
    {
        try
        {
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

    [HttpGet("user/{userID}", Name = "GetUserPlaylists")]
    public IEnumerable<Playlist> GetUserPlaylists(int userID)
    {
        return _playlistService.GetUserPlaylistsAsync(userID).Result;
    }

    [HttpGet("followed", Name = "GetUserFollowedPlaylists")]
    public async Task<IEnumerable<Playlist>> GetFollowedPlaylists(int userID)
    {
        return await _playlistService.GetUserFollowedPlaylistsAsync(userID);
    }

    [HttpGet("{playlistID}", Name = "GetPlaylistByID")]
    public async Task<Playlist> GetPlaylistByID(int playlistID, [FromQuery] int page, [FromQuery] int limit)
    {
        return await _playlistService.GetPlaylistByIDAsync(playlistID);
    }

    [HttpPost("", Name = "AddPlaylist")]
    public IActionResult Post([FromBody] Playlist playlist)
    {
        if (playlist == null)
        {
            return BadRequest("Playlist data is null.");
        }

        _logger.LogInformation("Adding new playlist: {Name}", playlist.Name);
        var result = _playlistService.CreatePlaylistAsync(playlist).Result;

        if (result != null)
        {
            return Ok("Playlist added successfully.");
        }
        else
        {
            return StatusCode(500, "An error occurred while adding the playlist.");
        }
    }

    [HttpDelete("playlists/{id}", Name = "DeletePlaylist")]
    public IActionResult Delete(int id)
    {
        _logger.LogInformation("Deleting playlist with ID: {Id}", id);
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

    [HttpPut("playlists/{id}", Name = "UpdatePlaylist")]
    public IActionResult Put(int id, [FromBody] Playlist playlist)
    {
        if (playlist == null || playlist.ID != id)
        {
            return BadRequest("Playlist data is invalid.");
        }

        _logger.LogInformation("Updating playlist with ID: {Id}", id);
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