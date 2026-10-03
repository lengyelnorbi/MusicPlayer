using API.Models;
using API.Utils;

namespace API.Services.Interfaces;

public interface IPlaylistService{
    Task<Playlist> CreatePlaylistAsync(string name, int userID);
    Task<Playlist> UpdatePlaylistAsync(Playlist playlist);
    Task<bool> DeletePlaylistAsync(int id);
    Task<PagedResult<Playlist>> GetUserPlaylistsAsync(int userID, int page, int limit);
    Task<List<Playlist>> GetUserFavoritePlaylistsAsync(int userID);
    Task<List<Playlist>> GetUserFollowedPlaylistsAsync(int userID);
    Task<Playlist> GetPlaylistByIDAsync(int playlistID);
    Task<PagedResult<Playlist>> GetPlaylistsAsync(int page, int limit);
    Task AddMusicToPlaylistAsync(int playlistID, int musicID);
    Task RemoveMusicFromPlaylistAsync(int playlistID, int musicID);
}