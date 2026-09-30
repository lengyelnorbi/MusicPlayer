using API.Models;

namespace API.Services.Interfaces;

public interface IPlaylistService{
    Task<IEnumerable<Playlist>> GetPlaylistsAsync();
    Task<Playlist> GetPlaylistByIdAsync(int id);
    Task<Playlist> CreatePlaylistAsync(Playlist playlist);
    Task<Playlist> UpdatePlaylistAsync(Playlist playlist);
    Task<bool> DeletePlaylistAsync(int id);
    Task<List<Playlist>> GetUserPlaylistsAsync(int userId);
    Task<List<Playlist>> GetUserFavoritePlaylistsAsync(int userId);
    Task<List<Playlist>> GetUserFollowedPlaylistsAsync(int userId);
}