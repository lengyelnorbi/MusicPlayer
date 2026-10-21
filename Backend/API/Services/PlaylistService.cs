using API.Data;
using API.Services.Interfaces;
using API.Models;
using Microsoft.EntityFrameworkCore;
using API.Utils;

namespace API.Services;

public class PlaylistService : IPlaylistService
{
    private readonly ILogger<PlaylistService> _logger;
    private readonly MusicPlayerDbContext _dbContext;

    public PlaylistService(ILogger<PlaylistService> logger, MusicPlayerDbContext dbContext)
    {
        _logger = logger;
        _dbContext = dbContext;
    }

    /// <summary>
    /// Retrieves a paginated list of playlists.
    /// This method fetches playlists from the database, calculates the total number of items and pages, and returns a PagedResult containing the playlists for the specified page and limit.
    /// </summary>
    /// <param name="page"></param>
    /// <param name="limit"></param>
    /// <returns></returns>
    public async Task<PagedResult<Playlist>> GetPlaylistsAsync(int page, int limit)
    {
        if (page < 1 || limit < 1) throw new ArgumentOutOfRangeException(nameof(page), "Page and limit must be positive.");

        var query = _dbContext.Playlists
            .AsNoTracking()
            .Select(playlist => new Playlist
            {
                ID = playlist.ID,
                Name = playlist.Name,
                MusicCount = _dbContext.PlaylistMusics.Count(membership => membership.PlaylistID == playlist.ID)
            });

        var totalItemCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalItemCount / (double)limit);
        var items = await query
            .OrderBy(playlist => playlist.Name)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return new PagedResult<Playlist>
        {
            Items = items,
            TotalItemCount = totalItemCount,
            TotalPages = totalPages,
        };
    }

    /// <summary>
    /// Adds a music to a playlist.
    /// </summary>
    /// <param name="playlistID"></param>
    /// <param name="musicID"></param>
    /// <returns></returns>
    public async Task AddMusicToPlaylistAsync(int playlistID, int musicID)
    {
        if (playlistID <= 0 || musicID <= 0)
            throw new ArgumentOutOfRangeException(nameof(playlistID), "Playlist and music IDs must be positive.");

        var playlist = await _dbContext.Playlists.FirstOrDefaultAsync(p => p.ID == playlistID)
            ?? throw new KeyNotFoundException("Playlist was not found.");
        var musicExists = await _dbContext.Musics.AnyAsync(m => m.ID == musicID);
        if (!musicExists) throw new KeyNotFoundException("Music was not found.");

        var alreadyAdded = await _dbContext.PlaylistMusics
            .AnyAsync(pm => pm.PlaylistID == playlistID && pm.MusicID == musicID);
        if (alreadyAdded) return;

        _dbContext.PlaylistMusics.Add(new PlaylistMusic
        {
            PlaylistID = playlistID,
            MusicID = musicID
        });
        playlist.MusicCount += 1;
        await _dbContext.SaveChangesAsync();
    }

    /// <summary>
    /// Removes a music from a playlist.
    /// </summary>
    /// <param name="playlistID"></param>
    /// <param name="musicID"></param>
    /// <returns></returns>
    public async Task RemoveMusicFromPlaylistAsync(int playlistID, int musicID)
    {
       if (playlistID <= 0 || musicID <= 0)
            throw new ArgumentOutOfRangeException(nameof(playlistID), "Playlist and music IDs must be positive.");

        var playlist = await _dbContext.Playlists.FirstOrDefaultAsync(p => p.ID == playlistID)
            ?? throw new KeyNotFoundException("Playlist was not found.");
        var membership = await _dbContext.PlaylistMusics
            .FirstOrDefaultAsync(pm => pm.PlaylistID == playlistID && pm.MusicID == musicID);
        if (membership is null) return;

        _dbContext.PlaylistMusics.Remove(membership);
        if (playlist.MusicCount > 0) playlist.MusicCount -= 1;
        await _dbContext.SaveChangesAsync();
    }

    /// <summary>
    /// Creates a new playlist.
    /// </summary>
    /// <param name="name"></param>
    /// <param name="userID"></param>
    /// <returns></returns>
    /// <exception cref="ArgumentNullException"></exception>
    public async Task<Playlist> CreatePlaylistAsync(string name, int userID)
    {
       if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Playlist name is required.", nameof(name));
        if (userID <= 0) throw new ArgumentOutOfRangeException(nameof(userID));

        await using var transaction = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            var playlist = new Playlist
            {
                Name = name.Trim(),
                MusicCount = 0
            };
            await _dbContext.Playlists.AddAsync(playlist);
            await _dbContext.SaveChangesAsync();

            await _dbContext.UserPlaylists.AddAsync(new UserPlaylist
            {
                UserID = userID,
                PlaylistID = playlist.ID
            });
            await _dbContext.SaveChangesAsync();
            await transaction.CommitAsync();
            return playlist;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "An error occurred while adding a playlist: {Name}", name);
            return null!;
        }
    }

    /// <summary>
    /// Retrieves a specific playlist by its ID.
    /// </summary>
    /// <param name="playlistID"></param>
    /// <returns></returns>
    public async Task<Playlist> GetPlaylistByIDAsync(int playlistID)
    {
        if (playlistID <= 0) throw new ArgumentOutOfRangeException(nameof(playlistID));

        var playlist = await _dbContext.Playlists
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.ID == playlistID);
        if (playlist is null) return null!;

        playlist.Musics = await _dbContext.PlaylistMusics
            .AsNoTracking()
            .Where(membership => membership.PlaylistID == playlistID)
            .Select(membership => membership.Music)
            .ToListAsync();
        return playlist;
    }

    /// <summary>
    /// Deletes a playlist by its ID.
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    public async Task<bool> DeletePlaylistAsync(int id)
    {
        if (id <= 0) throw new ArgumentOutOfRangeException(nameof(id));
        var playlist = await _dbContext.Playlists.FirstOrDefaultAsync(item => item.ID == id);
        if (playlist is null) return false;

        _dbContext.Playlists.Remove(playlist);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// Retrieves a list of user's favorite playlists.
    /// </summary>
    /// <param name="userID"></param>
    /// <returns></returns>
    public Task<List<Playlist>> GetUserFavoritePlaylistsAsync(int userID)
    {
        // The supplied schema has no favorites relation/table. Return an empty
        // collection until favorites are modeled explicitly rather than crashing callers.
        return Task.FromResult(new List<Playlist>());
    }

     /// <summary>
    /// Retrieves a list of playlists that a user is following.
    /// </summary>
    /// <param name="userID"></param>
    /// <returns></returns>
    public async Task<List<Playlist>> GetUserFollowedPlaylistsAsync(int userID)
    {
        return await _dbContext.UserPlaylists
            .AsNoTracking()
            .Where(userPlaylist => userPlaylist.UserID == userID)
            .Select(userPlaylist => new Playlist
            {
                ID = userPlaylist.Playlist.ID,
                Name = userPlaylist.Playlist.Name,
                MusicCount = _dbContext.PlaylistMusics.Count(music => music.PlaylistID == userPlaylist.PlaylistID)
            })
            .ToListAsync();
    }

     /// <summary>
    /// Updates an existing playlist.
    /// </summary>
    /// <param name="playlist"></param>
    /// <returns></returns>
    public async Task<Playlist> UpdatePlaylistAsync(Playlist playlist)
    {
        if (playlist is null || playlist.ID <= 0 || string.IsNullOrWhiteSpace(playlist.Name))
            throw new ArgumentException("A valid playlist ID and name are required.", nameof(playlist));

        var existing = await _dbContext.Playlists.FirstOrDefaultAsync(item => item.ID == playlist.ID);
        if (existing is null) return null!;

        existing.Name = playlist.Name.Trim();
        await _dbContext.SaveChangesAsync();
        return existing;
    }

    /// <summary>
    /// Retrieves a paginated list of playlists for a specific user.
    /// This method fetches playlists associated with a user from the database, calculates the total number of items and pages, and returns a PagedResult containing the playlists for the specified page and limit.
    /// </summary>
    /// <param name="userID"></param>
    /// <param name="page"></param>
    /// <param name="limit"></param>
    /// <returns></returns>
    public async Task<PagedResult<Playlist>> GetUserPlaylistsAsync(int userID, int page, int limit)
    {
       if (userID <= 0 || page < 1 || limit < 1)
            throw new ArgumentOutOfRangeException(nameof(userID), "User ID, page, and limit must be positive.");

        var userPlaylistIds = _dbContext.UserPlaylists
            .AsNoTracking()
            .Where(userPlaylist => userPlaylist.UserID == userID)
            .Select(userPlaylist => userPlaylist.PlaylistID);

        var query = _dbContext.Playlists
            .AsNoTracking()
            .Where(playlist => userPlaylistIds.Contains(playlist.ID))
            .Select(playlist => new Playlist
            {
                ID = playlist.ID,
                Name = playlist.Name,
                MusicCount = _dbContext.PlaylistMusics.Count(membership => membership.PlaylistID == playlist.ID)
            });

        var totalItemCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalItemCount / (double)limit);
        var items = await query
            .OrderBy(playlist => playlist.Name)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return new PagedResult<Playlist>
        {
            Items = items,
            TotalItemCount = totalItemCount,
            TotalPages = totalPages,
        };
    }
}