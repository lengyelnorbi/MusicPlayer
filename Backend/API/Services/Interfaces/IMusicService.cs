using API.Models;
using API.DTO;
using API.Utils;

namespace API.Services.Interfaces;

public interface IMusicService
{
    Task<MusicListResponseDTO> GetMusicsAsync(int page = 1, int limit = 10, int? userID = null);
    Task<Music> AddMusicAsync(Music music);
    Task<Music> GetMusicByIDAsync(int id);
    Task<Music> CreateMusicAsync(Music music);
    Task<Music> UpdateMusicAsync(Music music);
    Task<bool> DeleteMusicAsync(int id);
    Task<List<Music>> GetMusicsByPlaylistIdAsync(int playlistId);
    Task<List<Music>> GetFavoriteMusicsByUserIdAsync(int userId);
    Task<string> GetGoogleDriveFileIdByMusicIdAsync(int musicID);
    Task<int[]> GetMusicsIDFromDBAsync();
    Task<List<Music>> GetPlaylistMusics(List<int> playlistIDs, int page, int limit);
    // Task<List<Music>> GetMusicsDataAsync();
    // Task UpdateMusicDataInDBFromGoogleDrive();
    // Task UploadMusicToGoogleDriveAsync(Music music, Stream fileStream);
}