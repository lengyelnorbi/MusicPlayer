using Microsoft.AspNetCore.Mvc;
using API.Models.RequestModels;
using API.Services.Interfaces;

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

    [HttpPost("", Name = "AddMusicToPlaylist")]
    public async Task AddMusicToPlaylist([FromBody] PlaylistMusic playlistMusic)
    {
        await _playlistService.AddMusicToPlaylistAsync(playlistMusic.PlaylistID, playlistMusic.MusicID);
    }

    [HttpDelete("", Name = "RemoveMusicFromPlaylist")]
    public async Task RemoveMusicFromPlaylist([FromBody] PlaylistMusic playlistMusic)
    {
        await _playlistService.RemoveMusicFromPlaylistAsync(playlistMusic.PlaylistID, playlistMusic.MusicID);
    }
}