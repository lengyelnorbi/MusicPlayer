using API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using API.Models;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlaylistController : ControllerBase
{
    private readonly ILogger<PlaylistController> _logger;
    private readonly IPlaylistService _playlistService;

    public PlaylistController(ILogger<PlaylistController> logger, IPlaylistService playlistService)
    {
        _logger = logger;
        _playlistService = playlistService;
    }

    [HttpGet("", Name = "GetPlaylists")]
    public IEnumerable<Playlist> Get()
    {
        return _playlistService.GetPlaylistsAsync().Result;
    }

    [HttpGet("playlists/{userID}", Name = "GetUserPlaylists")]
    public IEnumerable<Playlist> Get(int userID)
    {
        return _playlistService.GetPlaylistsAsync().Result;
    }

    [HttpGet("playlists/followed", Name = "GetUserFollowedPlaylists")]
    public IEnumerable<Playlist> Get(int userID)
    {
        return _playlistService.GetUserFollowedPlaylists(userID);
    }

    [HttpGet("playlists/{id}"), Name = "GetPlaylistByID"]
    public IEnumerable<Playlist> Get(string playlistID, [FromQuery] int page, [FromQuery] int limit)
    {
        var playlist = await _playlistService.GetPlaylistByID(playlistID);
        if(playlist){
            MusicService _musicService = new MusicService();
            await _musicService.GetPlaylistMusics(playlist.musics, page, limit)
        }
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