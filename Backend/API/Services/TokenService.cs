using API.Services.Interfaces;
using API.Models;
using API.DTO;
using API.Data;
using Microsoft.EntityFrameworkCore;
using API.Utils;

namespace API.Services;

public class TokenService : ITokenService
{
    private readonly ILogger<TokenService> _logger;
    private readonly MusicPlayerDbContext _dbContext;

    public TokenService(ILogger<TokenService> logger, MusicPlayerDbContext dbContext)
    {
        _logger = logger;
        _dbContext = dbContext;
    }

    public async Task<PagedResult<AccessTokenUserDTO>> GetAccessTokensAsync(int page = 1, int limit = 10)
    {
       var query = _dbContext.AccessTokens
            .Where(at => at.IsRevoked == false)
            .Select(at => new AccessTokenUserDTO
            {
                ID = at.ID,
                jti = at.jti,
                DeviceFingerprint = at.DeviceFingerprint,
                IpAddress = at.IpAddress,
                CreatedAt = at.CreatedAt,
                IsRevoked = at.IsRevoked,
                ExpiresAt = at.ExpiresAt,

                UserID = at.User!.ID,
                Username = at.User.Username,
                Email = at.User.Email,
                Role = at.User.Role
            });

        var totalItemCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalItemCount / (double)limit);

        var items = await query
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(); 

        return new PagedResult<AccessTokenUserDTO>{
            Items = items,
            TotalItemCount = totalItemCount,
            TotalPages = totalPages,
        };
    }

    public async Task<PagedResult<RefreshTokenUserDTO>> GetRefreshTokensAsync(int page = 1, int limit = 10)
    {
         var query = _dbContext.RefreshTokens
            .Where(rt => rt.IsRevoked == false)
            .Select(rt => new RefreshTokenUserDTO
            {
                ID = rt.ID,
                TokenHash = rt.TokenHash,
                DeviceFingerprint = rt.DeviceFingerprint,
                IpAddress = rt.IpAddress,
                CreatedAt = rt.CreatedAt,
                IsRevoked = rt.IsRevoked,
                ExpiresAt = rt.ExpiresAt,

                UserID = rt.User!.ID,
                Username = rt.User.Username,
                Email = rt.User.Email,
                Role = rt.User.Role
            });

        var totalItemCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalItemCount / (double)limit);

        var items = await query
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(); 

        return new PagedResult<RefreshTokenUserDTO>{
            Items = items,
            TotalItemCount = totalItemCount,
            TotalPages = totalPages,
        };
    }

    public async Task<bool> RevokeAccessTokenAsync(int tokenID)
    {
        var accessToken = await _dbContext.AccessTokens.FirstOrDefaultAsync(at => at.ID == tokenID);
        if (accessToken == null)
        {
            _logger.LogWarning("Access token with ID {TokenId} not found for revocation.", tokenID);
            return false;
        }

         _logger.LogInformation("{accessToken} Revoking access token with ID {TokenId}.", accessToken.jti, tokenID);

        accessToken.IsRevoked = true;
        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("Access token with ID {TokenId} has been revoked.", tokenID);
        return true;
    }

    public async Task<bool> RevokeRefreshTokenAsync(int tokenID)
    {
        var refreshToken = await _dbContext.RefreshTokens.FirstOrDefaultAsync(rt => rt.ID == tokenID);
        if (refreshToken == null)
        {
            _logger.LogWarning("Refresh token with ID {TokenId} not found for revocation.", tokenID);
            return false;
        }

        _logger.LogInformation("{refreshToken} Revoking refresh token with ID {TokenId}.", refreshToken.TokenHash, tokenID);

        refreshToken.IsRevoked = true;
        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("Refresh token with ID {TokenId} has been revoked.", tokenID);
        return true;
    }
}