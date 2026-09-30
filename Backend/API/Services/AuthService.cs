using API.Services.Interfaces;
using API.Utils;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using API.Models;
using API.Data;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public class AuthService : IAuthService
{
    private readonly IUserService _userService;
    private readonly IPasswordService _passwordService;
    private readonly JwtSettings _jwtSettings;
    private readonly MusicPlayerDbContext _dbContext;
    private readonly ILogger<AuthService> _logger;

    public AuthService(IUserService userService, IPasswordService passwordService, JwtSettings jwtSettings, MusicPlayerDbContext dbContext, ILogger<AuthService> logger)
    {
        _userService = userService;
        _passwordService = passwordService;
        _jwtSettings = jwtSettings;
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<(string?, RefreshToken?, DateTime?)> AuthenticateAsync(string email, string password, string deviceFingerprint = "UnknownDevice", string ipAddress = "UnknownIP", string source = "user")
    {
        var user = await _userService.GetUserByEmailAsync(email);
        if (user == null)
        {
            return (null, null, null); // Authentication failed
        }

        if(await _passwordService.VerifyPasswordAsync(password, user.PasswordHash) == false)
        {
            return (null, null, null); // Authentication failed
        }

        // Generate and return JWT token
        var (accessToken, accessTokenExpiresAt) = await GenerateAccessToken(user.ID, user.Email, user.Username, user.Role, deviceFingerprint, ipAddress, source: source);

        // Create Refresh Token (different from JTI)
        var refreshToken = await GenerateRefreshTokenAsync(user.ID, user.Role, deviceFingerprint, ipAddress); 

        return (accessToken, refreshToken, accessTokenExpiresAt);
    }

    private async Task<(string, DateTime)> GenerateAccessToken(int userId, string email, string username, string role = "User", string deviceFingerprint = "UnknownDevice", string ipAddress = "UnknownIP", DateTime? rfExpiresAt = null, string source = "user")
    {
        var key = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var jti = Guid.NewGuid().ToString(); // Unique identifier for the token
        var createdAt = DateTime.UtcNow;
        DateTime expiresAt;

        if(source == "admin" && role == "Admin")
        {
            expiresAt = createdAt.AddMinutes(_jwtSettings.AdminExpirationMinutes);
        }
        else
        {
            expiresAt = createdAt.AddMinutes(_jwtSettings.UserExpirationMinutes);
        }
        if (rfExpiresAt.HasValue && rfExpiresAt.Value < expiresAt)
        {
            expiresAt = rfExpiresAt.Value; // Ensure access token expires the same time as refresh token
        }
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.Name, username),
            new Claim(JwtRegisteredClaimNames.Jti, jti),
            new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
            new Claim(JwtRegisteredClaimNames.Exp, new DateTimeOffset(expiresAt).ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
            new Claim(ClaimTypes.Role, role),
            new Claim("Source", source), // To differentiate between user and admin tokens
            new Claim("DeviceId", deviceFingerprint),  // Detect token theft
            new Claim("IPAddress", ipAddress),
            new Claim("TokenVersion", "1") // For future token versioning and invalidation
        };

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);


        var accessToken = new AccessToken(jti, userId, deviceFingerprint, ipAddress, createdAt, expiresAt, false);

        await SaveUserAccessTokenAsync(accessToken);

        return (new JwtSecurityTokenHandler().WriteToken(token), accessToken.ExpiresAt);
    }
    public async Task<RefreshToken> GenerateRefreshTokenAsync(int userId, string role, string deviceFingerprint = "UnknownDevice", string ipAddress = "UnknownIP", DateTime? expiresAt = null, string source = "user")
    {
        var refreshTokenString = Guid.NewGuid().ToString();

        DateTime rfExpiresAt;

        if(source == "admin" && role == "Admin")
        {
            rfExpiresAt = expiresAt ?? DateTime.UtcNow.AddMinutes(_jwtSettings.AdminRefreshTokenExpirationMinutes);
        }
        else
        {
            rfExpiresAt = expiresAt ?? DateTime.UtcNow.AddMinutes(_jwtSettings.UserRefreshTokenExpirationMinutes);
        }

        var refreshToken = new RefreshToken(
            userId,
            HashToken(refreshTokenString),
            expiresAt ?? rfExpiresAt,
            deviceFingerprint,
            ipAddress,
            false
        );

        await SaveRefreshTokenAsync(refreshToken);
        return refreshToken;
    }
    

    public async Task<RefreshToken?> GetRefreshTokenByHashAsync(string tokenHash)
    {
        return await _dbContext.RefreshTokens
            .Where(rt => rt.TokenHash == tokenHash && !rt.IsRevoked && rt.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(rt => rt.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<(string?, RefreshToken?, DateTime?)?> RefreshAccessTokenAndRefreshTokenAsync(RefreshToken refreshToken, int userId, string deviceFingerprint, string ipAddress, string jti, string source = "user")
    {
        // Get user data for generating new access token
        var user = await _userService.GetUserByIdAsync(userId);
        if (user == null)
        {
            return null;
        }

        // Generate new access token (expiration is based on ExpirationMinutes config)
        var (newAccessToken, accessTokenExpiresAt) = await GenerateAccessToken(userId, user.Email, user.Username, user.Role, deviceFingerprint, ipAddress, refreshToken.ExpiresAt, source);
        
        var isRevoked = await RevokeAccessTokenAsync(jti, userId, deviceFingerprint, ipAddress); // Revoke old access token

        _logger.LogInformation("Access token AccessToken for user {UserId} revoked: {Revoked}", userId, isRevoked);

        // Generate new refresh token with THE SAME expiration date as the original
        var newRefreshToken = await GenerateRefreshTokenAsync(userId, user.Role, deviceFingerprint, ipAddress, refreshToken.ExpiresAt, source);

        isRevoked = await RevokeRefreshTokenAsync(refreshToken.TokenHash, userId, deviceFingerprint, ipAddress); // Revoke old refresh token

        _logger.LogInformation("Refresh token {RefreshTokenHash} for user {UserId} revoked: {Revoked}", refreshToken.TokenHash, userId, isRevoked);

        return (newAccessToken, newRefreshToken, accessTokenExpiresAt);
    }

    public async Task<bool> RevokeRefreshTokenAsync(string tokenHash, int userId, string deviceFingerprint = "UnknownDevice", string ipAddress = "UnknownIP")
    {
        var refreshToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash && rt.UserID == userId && rt.DeviceFingerprint == deviceFingerprint && rt.IpAddress == ipAddress);
        
        if (refreshToken == null)
        {
            return false; // Token not found
        }
        
        if (refreshToken.IsRevoked)
        {
            return true; // Already revoked, no need to update
        }
        
        refreshToken.IsRevoked = true;
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RevokeAccessTokenAsync(string jti, int userID, string deviceFingerprint = "UnknownDevice", string ipAddress = "UnknownIP")
    {
        var accessToken = await _dbContext.AccessTokens
            .FirstOrDefaultAsync(at => at.jti == jti && at.UserID == userID && at.DeviceFingerprint == deviceFingerprint && at.IpAddress == ipAddress);
        
        _logger.LogInformation("Attempting to revoke access token with jti {Jti} for user {UserId} from device {DeviceFingerprint} and IP {IpAddress}", jti, userID, deviceFingerprint, ipAddress);
        _logger.LogInformation("Access token found: {AccessTokenFound}", accessToken);
        if (accessToken == null)
        {
            return false; // Token not found
        }
        
        if (accessToken.IsRevoked)
        {
            return true; // Already revoked, no need to update
        }
        
        accessToken.IsRevoked = true;
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<bool> GetUserRefreshTokenByTokenHashAsync(string tokenHash)
    {
        var refreshToken = await _dbContext.RefreshTokens
            .Where(rt => rt.TokenHash == tokenHash && !rt.IsRevoked && rt.ExpiresAt < DateTime.UtcNow)
            .OrderByDescending(rt => rt.CreatedAt)
            .FirstOrDefaultAsync();

        return refreshToken != null;
    }   
    
    private string HashToken(string token)
    {
        using (var sha256 = System.Security.Cryptography.SHA256.Create())
        {
            var hashedBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(token));
            return Convert.ToBase64String(hashedBytes);
        }
    }

    
    public async Task LogoutAsync(int userId, string deviceFingerprint, string ipAddress, string jti, string refreshTokenHash)
    {
        try
        {
            // Revoke all access tokens for the user
            await RevokeTokensForUserAsync(userId, deviceFingerprint, ipAddress, jti, refreshTokenHash);

            await _dbContext.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // Log the exception (you can use a logging framework like Serilog, NLog, etc.)
            Console.WriteLine($"Error during logout for user {userId}: {ex.Message}");
        }
     }

    public async Task SaveRefreshTokenAsync(RefreshToken refreshToken)
    {
        // Implement logic to save refresh token hash in the database with associated user ID, device fingerprint, and IP address
        _dbContext.RefreshTokens.Add(refreshToken);
        await _dbContext.SaveChangesAsync();
    }

    public async Task<string?> GetUserJtiAsync(int userID)
    {
        var user = await _userService.GetUserByIdAsync(userID);
        return user?.Jti;
    }

    private async Task SaveUserAccessTokenAsync(AccessToken token)
    {
        _dbContext.AccessTokens.Update(token);
        await _dbContext.SaveChangesAsync();
    }

    public async Task RevokeTokensForUserAsync(int userID, string deviceFingerprint, string ipAddress, string jti, string refreshTokenHash)
    {
        try
        {
            await RevokeAccessTokenAsync(jti, userID, deviceFingerprint ?? "UnknownDevice", ipAddress ?? "UnknownIP");
            await RevokeRefreshTokenAsync(refreshTokenHash, userID, deviceFingerprint ?? "UnknownDevice", ipAddress ?? "UnknownIP");
        }
        catch (Exception ex)
        {
            // Log the exception (you can use a logging framework like Serilog, NLog, etc.)
            Console.WriteLine($"Error revoking tokens for user {userID}: {ex.Message}");
        }
    }

    public async Task<string?> GetUserAccessTokenAsync(int userID)
    {
        var accessToken = await _dbContext.AccessTokens
            .Where(at => at.UserID == userID && !at.IsRevoked)
            .OrderByDescending(at => at.CreatedAt)
            .FirstOrDefaultAsync();

        return accessToken?.jti;
    }

    public async Task<bool> ValidateAccessTokenAsync(string jti, int userId, string role)
    {
        // For "User" role: only check expiration (handled by JWT middleware)
        if (role == "User")
        {
            return true; // Expiration is already validated by JWT middleware
        }

        // For "Admin" role: check whitelist (database), revocation status, and expiration
        if (role == "Admin")
        {
            var accessToken = await _dbContext.AccessTokens
                .Where(at => at.jti == jti && at.UserID == userId && !at.IsRevoked && at.ExpiresAt > DateTime.UtcNow)
                .FirstOrDefaultAsync();

            return accessToken != null;
        }

        return false;
    }

}