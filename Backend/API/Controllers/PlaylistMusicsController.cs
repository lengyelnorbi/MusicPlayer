using Microsoft.AspNetCore.Mvc;
using API.Models.RequestModels;
using API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlaylistMusicsController : ControllerBase
{
    private readonly ILogger<PlaylistMusicsController> _logger;
    private readonly IPlaylistService _playlistService;

    public PlaylistMusicsController(ILogger<PlaylistMusicsController> logger, IPlaylistService playlistService)
    {
        _logger = logger;
        _playlistService = playlistService;
    }

    /// <summary>
    /// Adds a music item to a specified playlist.
    /// This endpoint requires the user to be authenticated.
    /// </summary>
    /// <param name="playlistMusic"></param>
    /// <returns></returns>
    [HttpPost("", Name = "AddMusicToPlaylist")]
    [Authorize]
    public async Task AddMusicToPlaylist([FromBody] PlaylistMusic playlistMusic)
    {
        // Add the specified music item to the specified playlist using the playlist service
        await _playlistService.AddMusicToPlaylistAsync(playlistMusic.PlaylistID, playlistMusic.MusicID);
    }

    /// <summary>
    /// Removes a music item from a specified playlist.
    /// This endpoint requires the user to be authenticated.
    /// </summary>
    /// <param name="playlistMusic"></param>
    /// <returns></returns>
    [HttpDelete("", Name = "RemoveMusicFromPlaylist")]
    [Authorize]
    public async Task RemoveMusicFromPlaylist([FromBody] PlaylistMusic playlistMusic)
    {
        // Remove the specified music item from the specified playlist using the playlist service
        await _playlistService.RemoveMusicFromPlaylistAsync(playlistMusic.PlaylistID, playlistMusic.MusicID);
    }
}