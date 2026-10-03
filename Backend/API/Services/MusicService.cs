using API.Models;
using API.Services.Interfaces;
using API.Data;
using Microsoft.EntityFrameworkCore;
using API.DTO;
using API.Utils;

namespace API.Services;

public class MusicService : IMusicService
{
    private readonly ILogger<MusicService> _logger;
    private readonly MusicPlayerDbContext _dbContext;

    public MusicService(ILogger<MusicService> logger, MusicPlayerDbContext dbContext)
    {
        _logger = logger;
        _dbContext = dbContext;
    }

    public async Task<Music>? AddMusicAsync(Music music)
    {
        var result = await _dbContext.Musics.AddAsync(music);
        if (result != null)
        {
            await _dbContext.SaveChangesAsync();
            return result.Entity;
        }
        else
        {
            _logger.LogError("Failed to add music: {Title}", music.Title);
            return null;
        }
    }

    public async Task<List<Music>> GetPlaylistMusics(List<int> playlistIDs, int page, int limit)
    {
        var musics = await _dbContext.Musics.Where(music => playlistIDs.Contains(music.ID)).Skip((page - 1) * limit).Take(limit).ToListAsync();
        return musics;
    }

    public Task<Music> CreateMusicAsync(Music music)
    {
        throw new NotImplementedException();
    }

    public Task<bool> DeleteMusicAsync(int id)
    {
        throw new NotImplementedException();
    }

    public Task<List<Music>> GetFavoriteMusicsByUserIdAsync(int userId)
    {
        throw new NotImplementedException();
    }

    public Task<Music> GetMusicByIDAsync(int id)
    {
        var music = _dbContext.Musics.FirstOrDefault(m => m.ID == id);
        if (music != null)
        {
            return Task.FromResult(music);
        }
        else
        {
            _logger.LogWarning("Music with ID {MusicId} not found.", id);
            return Task.FromResult<Music>(null);
        }
    }

    public async Task<MusicListResponseDTO> GetMusicsAsync(int page, int limit, int? userID)
    {
        var query = _dbContext.Musics
            .Select(m => new MusicDTO
            {
                ID = m.ID,
                Title = m.Title,
                AddedAt = m.AddedAt
            });

        var totalItemCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalItemCount / (double)limit);

        var items = await query
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        if (userID == null)
        {
            return new MusicListResponseDTO
            {
                Items = items,
                TotalItemCount = totalItemCount,
                TotalPages = totalPages,
                UserPlaylists = new List<PlaylistRefDTO>()
            };
        }

        var musicIds = items.Select(m => m.ID).ToList();

        var userPlaylists = await (
            from up in _dbContext.UserPlaylists
            join p in _dbContext.Playlists on up.PlaylistID equals p.ID
            where up.UserID == userID.Value
            select new PlaylistRefDTO
            {
                ID = p.ID,
                Name = p.Name
            })
            .ToListAsync();

        var memberships = await (
            from pm in _dbContext.PlaylistMusics
            join up in _dbContext.UserPlaylists on pm.PlaylistID equals up.PlaylistID
            where musicIds.Contains(pm.MusicID) && up.UserID == userID.Value
            select new
            {
                pm.MusicID,
                pm.PlaylistID
            })
            .ToListAsync();

        var membershipsByMusic = memberships
            .GroupBy(x => x.MusicID)
            .ToDictionary(g => g.Key, g => g.Select(x => x.PlaylistID).Distinct().ToList());

        foreach (var music in items)
        {
            music.PlaylistIDs = membershipsByMusic.TryGetValue(music.ID, out var playlistIds)
                ? playlistIds
                : new List<int>();
        }

        return new MusicListResponseDTO
        {
            Items = items,
            TotalItemCount = totalItemCount,
            TotalPages = totalPages,
            UserPlaylists = userPlaylists
        };
    }

    public async Task<int[]> GetMusicsIDFromDBAsync()
    {
        _logger.LogInformation("Fetching music IDs from database...");
        List<int> musicIDs = await _dbContext.Musics.Select(m => m.ID).ToListAsync();
        _logger.LogInformation($"Fetched {musicIDs.Count} music IDs.");
        return musicIDs.ToArray();
    }
    
    public Task<List<Music>> GetMusicsByPlaylistIdAsync(int playlistId)
    {
        throw new NotImplementedException();
    }

    public async Task<string> GetGoogleDriveFileIdByMusicIdAsync(int musicID)
    {
        var music = await _dbContext.Musics.FirstOrDefaultAsync(m => m.ID == musicID);
        if (music != null)
        {
            return music.File_id;
        }
        else
        {
            _logger.LogWarning("Music with ID {MusicId} not found.", musicID);
            return null;
        }
    }

    public Task<Music> UpdateMusicAsync(Music music)
    {
        throw new NotImplementedException();
    }

    // public Task<List<Music>> GetMusicsDataAsync()
    // {
    //     var googleDrive = new GoogleDriveService();
    //     var driveConnection = googleDrive.GetServiceAsync().Result;

    //     return googleDrive.ListMusicFilesInFolder(driveConnection);
    // }

    // public async Task UpdateMusicDataInDBFromGoogleDrive()
    // {
    //     var musics = await GetMusicsDataAsync();
    //     foreach (var music in musics)
    //     {
    //         var existingMusic = _dbContext.Musics.FirstOrDefault(m => m.File_id == music.File_id);
    //         if (existingMusic == null)
    //         {
    //             _dbContext.Musics.Add(music);
    //         }
    //         else
    //         {
    //             existingMusic.Title = music.Title;
    //             existingMusic.File_id = music.File_id;
    //         }
    //     }
    //     _dbContext.SaveChanges();
    // }

    // public async Task UploadMusicToGoogleDriveAsync(Music music, Stream fileStream)
    // {
    //     var googleDrive = new GoogleDriveService();
    //     var driveConnection = await googleDrive.GetServiceAsync();
    //     await googleDrive.UploadFileAsync(driveConnection, music.Title, fileStream);
    // }
}