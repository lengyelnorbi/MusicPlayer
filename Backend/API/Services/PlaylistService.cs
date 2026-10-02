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

    public async Task<PagedResult<Playlist>> GetPlaylistsAsync(int page, int limit)
    {
        try
        {
            var query = _dbContext.Playlists
            .Select(at => new Playlist
            {
                ID = at.ID,
                Name = at.Name,
                MusicCount = _dbContext.PlaylistMusics.Count(pm => pm.PlaylistID == at.ID)
            });

            var totalItemCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItemCount / (double)limit);

            var items = await query
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync(); 

            return new PagedResult<Playlist>{
                Items = items,
                TotalItemCount = totalItemCount,
                TotalPages = totalPages,
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while fetching playlists for page: {Page}, limit: {Limit}", page, limit);
            return new PagedResult<Playlist>();
        }
    }

    public async Task AddMusicToPlaylistAsync(int playlistID, int musicID)
    {
        try
        {
            var playlistMusic = new PlaylistMusic
            {
                PlaylistID = playlistID,
                MusicID = musicID
            };

            await _dbContext.PlaylistMusics.AddAsync(playlistMusic);
            await _dbContext.SaveChangesAsync();

            var updatedPlaylist = await _dbContext.Playlists
                .FirstOrDefaultAsync(p => p.ID == playlistID);
            
            if(updatedPlaylist != null)
            {
                updatedPlaylist.MusicCount += 1;
                await _dbContext.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while adding music ID {MusicID} to playlist ID {PlaylistID}", musicID, playlistID);
        }
    }

    public async Task RemoveMusicFromPlaylistAsync(int playlistID, int musicID)
    {
        try
        {
            var playlistMusic = await _dbContext.PlaylistMusics
                .FirstOrDefaultAsync(pm => pm.PlaylistID == playlistID && pm.MusicID == musicID);

            if (playlistMusic != null)
            {
                _dbContext.PlaylistMusics.Remove(playlistMusic);
                await _dbContext.SaveChangesAsync();

                var updatedPlaylist = await _dbContext.Playlists
                    .FirstOrDefaultAsync(p => p.ID == playlistID);
                
                if(updatedPlaylist != null && updatedPlaylist.MusicCount > 0)
                {
                    updatedPlaylist.MusicCount -= 1;
                    await _dbContext.SaveChangesAsync();
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while removing music ID {MusicID} from playlist ID {PlaylistID}", musicID, playlistID);
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
            var playlist = await _dbContext.Playlists
                .FirstOrDefaultAsync(p => p.ID == playlistID);

            if (playlist != null)
            {
                playlist.Musics = await _dbContext.PlaylistMusics
                    .Where(pm => pm.PlaylistID == playlistID)
                    .Select(pm => pm.Music)
                    .ToListAsync();

                _logger.LogInformation(
                    "Fetched playlist with ID {PlaylistID}: {PlaylistName}, Music count: {Count}",
                    playlistID,
                    playlist.Name,
                    playlist.Musics.Count);

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

    public async Task<PagedResult<Playlist>> GetUserPlaylistsAsync(int userID, int page, int limit)
    {
        try
        {
            var userPlaylistIDs = _dbContext.UserPlaylists
            .Where(p => p.UserID == userID)
            .Select(at => new Playlist
            {
                ID = at.Playlist.ID,
            });

            _logger.LogInformation("userPLaylistIDs: {UserPlaylistIDs}", userPlaylistIDs); ;

            var query = _dbContext.Playlists
            .Where(p => userPlaylistIDs.Any(up => up.ID == p.ID))
            .Select(at => new Playlist
            {
                ID = at.ID,
                Name = at.Name,
                MusicCount = _dbContext.PlaylistMusics.Count(pm => pm.PlaylistID == at.ID)
            });

            var totalItemCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItemCount / (double)limit);

            var items = await query
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync(); 

            return new PagedResult<Playlist>{
                Items = items,
                TotalItemCount = totalItemCount,
                TotalPages = totalPages,
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while fetching playlists for page: {Page}, limit: {Limit}", page, limit);
            return new PagedResult<Playlist>();
        }
    }

    public async Task<Playlist> UpdatePlaylistAsync(Playlist playlist)
    {
        throw new NotImplementedException();
    }
}