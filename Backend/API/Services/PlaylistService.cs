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

    public async Task<List<Playlist>> GetPlaylistsAsync(int userID)
    {
        try
        {
            var playlists = await _dbContext.Playlists.ToListAsync();
            return playlists;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while fetching playlists for user ID: {UserID}", userID);
            return new List<Playlist>();
        }
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

    public async Task<Playlist> GetPlaylistByIDAsync(int playlistID)
    {
        try
        {
            var playlist = await _dbContext.Playlists.Include(p => p.Musics).FirstOrDefaultAsync(p => p.ID == playlistID);
            if (playlist != null)
            {
                return playlist;
            }
            else
            {
                _logger.LogWarning("Playlist with ID {PlaylistID} not found.", playlistID);
                return null!;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while fetching playlist with ID: {PlaylistID}", playlistID);
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

    public async Task<List<Playlist>> GetUserFavoritePlaylistsAsync(int userID)
    {
        throw new NotImplementedException();
    }

    public async Task<List<Playlist>> GetUserFollowedPlaylistsAsync(int userID)
    {
        throw new NotImplementedException();
    }

    public async Task<List<Playlist>> GetUserPlaylistsAsync(int userID)
    {
        try
        {
            var userPlaylistsID = await _dbContext.UserPlaylists.Where(p => p.UserID == userID).Select(p => p.PlaylistID).ToListAsync();
            _logger.LogInformation("Fetched playlist IDs for user ID {UserID}: {PlaylistIDs}", userID, string.Join(", ", userPlaylistsID));
            var userplaylistTable = await _dbContext.UserPlaylists.ToListAsync();
            _logger.LogInformation("Fetched UserPlaylists table: {UserPlaylists}", string.Join(", ", userplaylistTable.Select(up => $"UserID: {up.UserID}, PlaylistID: {up.PlaylistID}")));
            var playlists = await _dbContext.Playlists.Where(p => userPlaylistsID.Contains(p.ID)).ToListAsync();
            return playlists;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while fetching playlists for user ID: {UserID}", userID);
            return new List<Playlist>();
        }
    }

    public async Task<Playlist> UpdatePlaylistAsync(Playlist playlist)
    {
        throw new NotImplementedException();
    }
}