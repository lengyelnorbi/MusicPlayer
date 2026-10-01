using API.Models;
using API.Utils;

namespace API.Services.Interfaces;

public interface IPlaylistService{
    Task<Playlist> CreatePlaylistAsync(Playlist playlist);
    Task<Playlist> UpdatePlaylistAsync(Playlist playlist);
    Task<bool> DeletePlaylistAsync(int id);
    Task<List<Playlist>> GetUserPlaylistsAsync(int userID);
    Task<List<Playlist>> GetUserFavoritePlaylistsAsync(int userID);
    Task<List<Playlist>> GetUserFollowedPlaylistsAsync(int userID);
    Task<Playlist> GetPlaylistByIDAsync(int playlistID);
    Task<PagedResult<Playlist>> GetPlaylistsAsync(int page, int limit);
}