using API.Data;
using API.Services.Interfaces;
using API.Models;
using Microsoft.EntityFrameworkCore;

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

    public async Task<Playlist> AddPlaylistAsync(Playlist playlist)
    {
            try
            {
                var result = await _dbContext.Playlists.AddAsync(playlist);
                if (result != null)
                {
                    await _dbContext.SaveChangesAsync();
                    return result.Entity;
                }
                else
                {
                    _logger.LogError("Failed to add playlist: {Name}", playlist.Name);
                    return null!;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while adding a playlist: {Name}", playlist.Name);
                return null!;
            }
    }

    public async Task<Playlist> CreatePlaylistAsync(Playlist playlist)
    {
        try
        {
            var result = await _dbContext.Playlists.AddAsync(playlist);
            if (result != null)
            {
                await _dbContext.SaveChangesAsync();
                return result.Entity;
            }
            else
            {
                _logger.LogError("Failed to create playlist: {Name}", playlist.Name);
                return null!;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while creating a playlist: {Name}", playlist.Name);
            return null!;
        }
    }

    public async Task<bool> DeletePlaylistAsync(int id)
    {
        try
        {
            var playlist = await _dbContext.Playlists.FindAsync(id);
            if (playlist != null)
            {
                _dbContext.Playlists.Remove(playlist);
                await _dbContext.SaveChangesAsync();
                return true;
            }
            else
            {
                _logger.LogWarning("Playlist with ID {Id} not found for deletion.", id);
                return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while deleting playlist with ID: {Id}", id);
            return false;
        }
    }

    public async Task<Playlist> GetPlaylistByIdAsync(int id)
    {
        try
        {
            var playlist = await _dbContext.Playlists.FindAsync(id);
            if (playlist != null)
            {
                return playlist;
            }
            else
            {
                _logger.LogWarning("Playlist with ID {Id} not found.", id);
                return null!;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while fetching playlist with ID: {Id}", id);
            return null!;
        }
    }

    public async Task<IEnumerable<Playlist>> GetPlaylistsAsync()
    {
        try
        {
            return await _dbContext.Playlists.ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while fetching playlists.");
            return Enumerable.Empty<Playlist>();
        }
    }

    public async Task<List<Playlist>> GetUserFavoritePlaylistsAsync(int userId)
    {
        throw new NotImplementedException();
    }

    public async Task<List<Playlist>> GetUserFollowedPlaylistsAsync(int userId)
    {
        throw new NotImplementedException();
    }

    public async Task<List<Playlist>> GetUserPlaylistsAsync(int userId)
    {
        throw new NotImplementedException();
    }

    public async Task<Playlist> UpdatePlaylistAsync(Playlist playlist)
    {
        throw new NotImplementedException();
    }
}