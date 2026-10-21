using API.Models;

namespace API.Services.Interfaces;

public interface IAuthService
{
    Task<(string?, RefreshToken?, DateTime?)> AuthenticateAsync(string email, string password, string deviceFingerprint = "UnknownDevice", string ipAddress = "UnknownIP", string source = "user");
    Task<string?> GetUserAccessTokenAsync(int userID);
    Task SaveRefreshTokenAsync(RefreshToken refreshToken);
    Task<RefreshToken> GenerateRefreshTokenAsync(int userId, string role, string deviceFingerprint = "UnknownDevice", string ipAddress = "UnknownIP", DateTime? expiresAt = null, string source = "user");
    Task<bool> GetUserRefreshTokenByTokenHashAsync(string tokenHash);
    Task<bool> ValidateAccessTokenAsync(string jti, int userId, string role);
    Task<(string?, RefreshToken?, DateTime?)?> RefreshAccessTokenAndRefreshTokenAsync(RefreshToken refreshToken, int userId, string deviceFingerprint, string ipAddress, string jti, string source = "user");
    Task<RefreshToken?> GetRefreshTokenByHashAsync(string tokenHash);
    Task<bool> RevokeRefreshTokenAsync(string tokenHash, int userId, string deviceFingerprint = "UnknownDevice", string ipAddress = "UnknownIP");
    Task<bool> RevokeAccessTokenAsync(string jti, int userId, string deviceFingerprint = "UnknownDevice", string ipAddress = "UnknownIP");
    Task LogoutAsync(int userId, string deviceFingerprint, string ipAddress, string jti, string refreshTokenHash);
}