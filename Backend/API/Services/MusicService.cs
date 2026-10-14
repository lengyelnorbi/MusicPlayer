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

    /// <summary>
    /// Adds a new music entry to the database.
    /// This method saves the provided Music object to the database and returns the added entity.
    /// </summary>
    /// <param name="music"></param>
    /// <returns></returns>
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

    /// <summary>
    /// Retrieves a paginated list of musics associated with the specified playlist IDs.
    /// </summary>
    /// <param name="playlistIDs"></param>
    /// <param name="page"></param>
    /// <param name="limit"></param>
    /// <returns></returns>
    public async Task<List<Music>> GetPlaylistMusics(List<int> playlistIDs, int page, int limit)
    {
        var musics = await _dbContext.Musics.Where(music => playlistIDs.Contains(music.ID)).Skip((page - 1) * limit).Take(limit).ToListAsync();
        return musics;
    }

    /// <summary>
    /// Creates a new music entry.
    /// </summary>
    /// <param name="music"></param>
    /// <returns></returns>
    public Task<Music> CreateMusicAsync(Music music)
    {
        throw new NotImplementedException();
    }

    /// <summary>
    /// Deletes a music entry by its ID.
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    public Task<bool> DeleteMusicAsync(int id)
    {
        throw new NotImplementedException();
    }

    /// <summary>
    /// Retrieves a list of favorite musics for a specific user by their user ID.
    /// This method is not yet implemented and will throw a NotImplementedException when called.
    /// </summary>
    /// <param name="userId"></param>
    /// <returns></returns>
    /// <exception cref="NotImplementedException"></exception>
    public Task<List<Music>> GetFavoriteMusicsByUserIdAsync(int userId)
    {
        throw new NotImplementedException();
    }

    /// <summary>
    /// Retrieves a music entry by its ID.
    /// If the music entry is found, it returns the Music object; otherwise, it returns
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    /// <exception cref="NotImplementedException"></exception>
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

    /// <summary>
    /// Retrieves a paginated list of musics based on the provided parameters.
    /// This method supports filtering by user ID, search term, and genres.
    /// </summary>
    /// <param name="page"></param>
    /// <param name="limit"></param>
    /// <param name="userID"></param>
    /// <param name="search"></param>
    /// <param name="genres"></param>
    /// <returns></returns>
    public async Task<MusicListResponseDTO> GetMusicsAsync(int page, int limit, int? userID, string? search, IReadOnlyCollection<string>? genres)
    {
        // Build the base query for musics, applying filters for search and genres if provided
        var musicQuery = _dbContext.Musics
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var titleSearch = search.Trim();
            musicQuery = musicQuery.Where(music => music.Title != null && EF.Functions.ILike(music.Title, $"%{titleSearch}%"));
        }

        var selectedGenres = genres?
            .Where(genre => !string.IsNullOrWhiteSpace(genre))
            .Select(genre => genre.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray() ?? [];

        if (selectedGenres.Length > 0)
        {
            musicQuery = musicQuery.Where(music =>
                music.Genre != null &&
                selectedGenres.Any(genre =>
                    EF.Functions.ILike(music.Genre, genre) ||
                    EF.Functions.ILike(music.Genre, genre + ";%") ||
                    EF.Functions.ILike(music.Genre, "%;" + genre) ||
                    EF.Functions.ILike(music.Genre, "%;" + genre + ";%")
                ));
        }

        var genreStrings = await _dbContext.Musics
            .AsNoTracking()
            .Where(m => m.Genre != null && m.Genre != "")
            .Select(m => m.Genre!)
            .ToListAsync();

        var availableGenres = genreStrings
            .SelectMany(g => g.Split(
                new[] { ';' },
                StringSplitOptions.RemoveEmptyEntries))
            .Select(g => g.Trim())
            .Where(g => g != "")
            .Distinct()
            .OrderBy(g => g)
            .ToList();

        var query = musicQuery
            .Select(m => new MusicDTO
            {
                ID = m.ID,
                Title = m.Title,
                Genre = m.Genre,
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
                UserPlaylists = new List<PlaylistRefDTO>(),
                AvailableGenres = availableGenres
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

        // Retrieves the playlist memberships for the specified music IDs and user ID.
        // Memberships represent the association between musics and playlists for the given user.
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

        // Group the memberships by music ID to create a dictionary mapping each music ID to its associated playlist IDs.
        var membershipsByMusic = memberships
            .GroupBy(x => x.MusicID)
            .ToDictionary(g => g.Key, g => g.Select(x => x.PlaylistID).Distinct().ToList());

        foreach (var music in items)
        {
            music.PlaylistIDs = membershipsByMusic.TryGetValue(music.ID, out var playlistIds) ? playlistIds : new List<int>();
        }

        return new MusicListResponseDTO
        {
            Items = items,
            TotalItemCount = totalItemCount,
            TotalPages = totalPages,
            UserPlaylists = userPlaylists,
            AvailableGenres = availableGenres
        };
    }

    /// <summary>
    /// Retrieves an array of music IDs from the database.
    /// This method fetches all music IDs from the Musics table and returns them as an array of integers.
    /// </summary>
    /// <returns></returns>
    public async Task<int[]> GetMusicsIDFromDBAsync()
    {
        _logger.LogInformation("Fetching music IDs from database...");
        List<int> musicIDs = await _dbContext.Musics.Select(m => m.ID).ToListAsync();
        _logger.LogInformation($"Fetched {musicIDs.Count} music IDs.");
        return musicIDs.ToArray();
    }

    /// <summary>
    /// Retrieves an array of music file IDs from the database.
    /// This method fetches all music file IDs from the Musics table and returns them as an array of strings.
    /// </summary>
    /// <param name="driveMusics"></param>
    /// <returns></returns>
    public async Task<MusicSyncResultDTO> AddMissingDriveMusicAsync(IEnumerable<Music> driveMusics)
    {
        var driveMusicList = driveMusics
            .Where(music => !string.IsNullOrWhiteSpace(music.File_id))
            .ToList();

        var driveFileIds = driveMusicList
            .Select(music => music.File_id!)
            .Distinct(StringComparer.Ordinal)
            .ToList();

        var existingFileIds = (await _dbContext.Musics
                .Where(music => music.File_id != null && driveFileIds.Contains(music.File_id))
                .Select(music => music.File_id!)
                .ToListAsync())
            .ToHashSet(StringComparer.Ordinal);

        var missing = driveMusicList
            .Where(music => !existingFileIds.Contains(music.File_id!))
            .GroupBy(music => music.File_id!, StringComparer.Ordinal)
            .Select(group => group.First())
            .ToList();

        var newMusic = missing.Select(music => new Music
        {
            Title = music.Title,
            File_id = music.File_id,
            AddedAt = DateOnly.FromDateTime(DateTime.UtcNow)
        }).ToList();

        if (newMusic.Count > 0)
        {
            await _dbContext.Musics.AddRangeAsync(newMusic);
            await _dbContext.SaveChangesAsync();
        }

        return new MusicSyncResultDTO
        {
            DriveFileCount = driveFileIds.Count,
            AddedCount = newMusic.Count,
            Added = newMusic.Select(music => new MusicSyncItemDTO
            {
                Title = music.Title,
                FileId = music.File_id
            }).ToList()
        };
    }

    /// <summary>
    /// Retrieves the Google Drive file ID associated with a specific music entry by its music ID.
    /// This method queries the database for the music entry and returns its associated Google Drive file ID.
    /// </summary>
    /// <param name="musicID"></param>
    /// <returns></returns>
    public async Task<string> GetGoogleDriveFileIdByMusicIdAsync(int musicID)
    {
        var music = await _dbContext.Musics.FirstOrDefaultAsync(m => m.ID == musicID);
        if (music != null)
        {
            if(string.IsNullOrWhiteSpace(music.File_id))
            {
                _logger.LogWarning("Music with ID {MusicId} has no associated Google Drive File ID.", musicID);
                return String.Empty;
            }
            return music.File_id;
        }
        else
        {
            _logger.LogWarning("Music with ID {MusicId} not found.", musicID);
            return String.Empty;
        }
    }
}
