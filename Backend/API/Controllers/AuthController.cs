using API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using API.Models.RequestModels;
using API.Utils;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IUserService _userService;
    private readonly IDeviceService _deviceService;
    private readonly ILogger<AuthController> _logger;
    private readonly JwtSettings _jwtSettings;
    private readonly IWebHostEnvironment _environment;

    public AuthController(IAuthService authService, IUserService userService, IDeviceService deviceService, ILogger<AuthController> logger, JwtSettings jwtSettings, IWebHostEnvironment environment)
    {
        _authService = authService;
        _userService = userService;
        _deviceService = deviceService;
        _logger = logger;
        _jwtSettings = jwtSettings;
        _environment = environment;
    }

    private CookieOptions GetCookieOptions(DateTime? expires = null)
    {
        // For development, allow non-secure cookies over HTTP
        // For production, enforce secure cookies over HTTPS
        return new CookieOptions 
        { 
            HttpOnly = true, 
            Secure = !_environment.IsDevelopment(),  // false for dev (HTTP), true for prod (HTTPS)
            SameSite = SameSiteMode.Strict, //Development mode
            Expires = expires
        };
    }

    [HttpPost("", Name = "Authenticate")]
    public async Task<IActionResult> Authenticate([FromBody] LoginRequest request)
    {
        _logger.LogInformation("Authentication attempt for email: {Email}", request.Email);
        //Check if user exists
        var user = await _userService.GetUserByEmailAsync(request.Email);
        
        if (user == null)
        {
            _logger.LogWarning("Authentication failed for email: {Email}", request.Email);
            return Unauthorized(new { error = "Invalid credentials" });
        }

        // if(user.Role == "Admin" && request.Source != "admin")
        // {
        //     _logger.LogWarning("Authentication failed for email: {Email} - admin trying to log in from user panel", request.Email);
        //     return Unauthorized(new { error = "Invalid credentials" });
        // }

        // Authenticate user and generate access token        
        var deviceFingerprint = GetDeviceFingerprint();
        var clientIp = GetClientIp();
        var (accessToken, refreshToken, accessTokenExpiresAt) = await _authService.AuthenticateAsync(request.Email, request.Password, deviceFingerprint, clientIp, request.Source);

        if (accessToken == null || refreshToken == null)
        {
            _logger.LogWarning("Authentication failed for email: {Email}", request.Email);
            return Unauthorized(new { error = "Invalid credentials" });
        }

        int expiresIn = 0;
        string tokenCookieName;
        string refreshTokenCookieName;
        int refreshTokenExpiresIn = 0;

        // Determine source and set appropriate cookies and expiration
        if (request.Source == "admin")
        { 
            if(user.Role != "Admin")
            {
                _logger.LogWarning("Authentication failed for email: {Email} - user is not an admin", request.Email);
                return Unauthorized(new { error = "Invalid credentials" });
            }
            tokenCookieName = "adminToken";
            refreshTokenCookieName = "adminRefreshToken";
            expiresIn = _jwtSettings.AdminExpirationMinutes * 60; // Convert minutes to seconds
            refreshTokenExpiresIn = _jwtSettings.AdminRefreshTokenExpirationMinutes * 60; // Convert minutes to seconds
            _logger.LogInformation("Admin user {Email} authenticated successfully from admin panel at {Timestamp}", request.Email, DateTime.UtcNow);
        }
        else
        {
            tokenCookieName = "userToken";
            refreshTokenCookieName = "userRefreshToken";
            expiresIn = _jwtSettings.UserExpirationMinutes * 60; // Convert minutes to seconds
            refreshTokenExpiresIn = _jwtSettings.UserRefreshTokenExpirationMinutes * 60; // Convert minutes to seconds
            _logger.LogInformation("User {Email} authenticated successfully from music player at {Timestamp}", request.Email, DateTime.UtcNow);
        }

        // Set Access Token as httpOnly cookie
        Response.Cookies.Append(tokenCookieName.ToString(), accessToken, GetCookieOptions(accessTokenExpiresAt));
        
        // Set Refresh Token as httpOnly cookie
        Response.Cookies.Append(refreshTokenCookieName.ToString(), refreshToken.TokenHash, GetCookieOptions(refreshToken.ExpiresAt));

        _logger.LogInformation("--------------------------------------------------------------------");
        _logger.LogInformation(accessToken);
        _logger.LogInformation(refreshToken.TokenHash);
        _logger.LogInformation("Source: {Source}", request.Source);
        _logger.LogInformation("Access Token expires at: {AccessTokenExpiresAt}", accessTokenExpiresAt);
        _logger.LogInformation("Refresh Token expires at: {RefreshTokenExpiresAt}", refreshToken.ExpiresAt);
        _logger.LogInformation("tokenCookieName: {TokenCookieName}", tokenCookieName);
        _logger.LogInformation("refreshTokenCookieName: {RefreshTokenCookieName}", refreshTokenCookieName);
        _logger.LogInformation("Refresh token hash stored in cookie: {RefreshTokenHash}", refreshToken.TokenHash);
        _logger.LogInformation("--------------------------------------------------------------------");

        // Return metadata only
        return Ok(new 
        { 
            success = true,
            expiresIn = expiresIn,
            refreshTokenExpiresIn = refreshTokenExpiresIn,
            user = new { user.ID, user.Username, user.Role }
        });
    }

    [HttpPost("refresh")]
    [Authorize]  // Require valid authentication to refresh token
    public async Task<IActionResult> RefreshToken([FromBody] RefreshRequest request)
    {
        try
        {
            _logger.LogInformation("Token refresh attempt at {Timestamp}", DateTime.UtcNow);

            int expiresIn = 0;

            if(request.Source == "admin")
            {
                expiresIn = _jwtSettings.AdminExpirationMinutes * 60; // Convert minutes to seconds
            }
            else if(request.Source == "user")
            {
                expiresIn = _jwtSettings.UserExpirationMinutes * 60; // Convert minutes to seconds
            }
            else
            {
                _logger.LogWarning("Token refresh attempt with unknown source at {Timestamp}", DateTime.UtcNow);
                return Unauthorized(new { error = "Unknown token source" });
            }

            // Determine which token to refresh based on which cookie exists
            string refreshTokenHash = "";
            string tokenCookieName = "";
            string refreshTokenCookieName = "";


            if (Request.Cookies.TryGetValue("adminRefreshToken", out var adminRefreshTokenHash))
            {
                refreshTokenHash = adminRefreshTokenHash;
                tokenCookieName = "adminToken";
                refreshTokenCookieName = "adminRefreshToken";
                _logger.LogInformation("Refreshing admin token at {Timestamp}", DateTime.UtcNow);
            }
            else if (Request.Cookies.TryGetValue("userRefreshToken", out var userRefreshTokenHash))
            {
                refreshTokenHash = userRefreshTokenHash;
                tokenCookieName = "userToken";
                refreshTokenCookieName = "userRefreshToken";
                _logger.LogInformation("Refreshing user token at {Timestamp}", DateTime.UtcNow);
            }
            else
            {
                _logger.LogWarning("Refresh token missing from cookies");
                return Unauthorized(new { error = "Refresh token not found" });
            }

            // Get the refresh token from database to extract user ID and device info
            var refreshToken = await _authService.GetRefreshTokenByHashAsync(refreshTokenHash);
            if (refreshToken == null)
            {
                _logger.LogWarning("Refresh token invalid, revoked, or expired");
                return Unauthorized(new { error = "Invalid or expired refresh token" });
            }

            var deviceFingerprint = GetDeviceFingerprint();
            var clientIp = GetClientIp();

            // Verify device fingerprint matches
            if (refreshToken.DeviceFingerprint != deviceFingerprint)
            {
                _logger.LogWarning("Device fingerprint mismatch for user {UserId}", refreshToken.UserID);
                return Unauthorized(new { error = "Device fingerprint mismatch" });
            }

            var jti = HttpContext.User.FindFirst(JwtRegisteredClaimNames.Jti)?.Value ?? "UnknownJTI";

            // Generate new access token and refresh token with the same expiration as the original
            var result = await _authService.RefreshAccessTokenAndRefreshTokenAsync(refreshToken, refreshToken.UserID, deviceFingerprint, clientIp, jti, request.Source);
            if (result == null)
            {
                _logger.LogWarning("Failed to refresh token for user {UserId}", refreshToken.UserID);
                return StatusCode(StatusCodes.Status500InternalServerError, new { error = "Failed to refresh token" });
            }

            var (newAccessToken, newRefreshToken, accessTokenExpiresAt) = result.Value;

            if(newAccessToken == null || newRefreshToken == null)
            {
                _logger.LogWarning("Failed to refresh token for user {UserId}", refreshToken.UserID);
                return StatusCode(StatusCodes.Status500InternalServerError, new { error = "Failed to refresh token" });
            }

            // Set new Access Token as httpOnly cookie with appropriate name
            Response.Cookies.Append(tokenCookieName, newAccessToken, GetCookieOptions(accessTokenExpiresAt));

            // Set new Refresh Token as httpOnly cookie with appropriate name
            Response.Cookies.Append(refreshTokenCookieName, newRefreshToken.TokenHash, GetCookieOptions(newRefreshToken.ExpiresAt));

            _logger.LogInformation("Token refreshed successfully for user {UserId} at {Timestamp}", refreshToken.UserID, DateTime.UtcNow);

            return Ok(new { success = true, expiresIn = expiresIn });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = "An error occurred during token refresh" });
        }
    }

    [HttpPost("logout")]
    [Authorize]  // Require valid authentication
    public async Task<IActionResult> Logout()
    {
        try
        {
            _logger.LogInformation("Logged out at {Timestamp}", DateTime.UtcNow);
            
            // Determine which session to logout by checking which refresh token is present
            string refreshTokenHash = "";
            string tokenCookieName = "";
            string refreshTokenCookieName = "";
            
            if (Request.Cookies.TryGetValue("adminRefreshToken", out var adminRefreshTokenHash))
            {
                refreshTokenHash = adminRefreshTokenHash;
                tokenCookieName = "adminToken";
                refreshTokenCookieName = "adminRefreshToken";
                _logger.LogInformation("Admin logout at {Timestamp}", DateTime.UtcNow);
            }
            else if (Request.Cookies.TryGetValue("userRefreshToken", out var userRefreshTokenHash))
            {
                refreshTokenHash = userRefreshTokenHash;
                tokenCookieName = "userToken";
                refreshTokenCookieName = "userRefreshToken";
                _logger.LogInformation("User logout at {Timestamp}", DateTime.UtcNow);
            }
            else
            {
                _logger.LogWarning("Refresh token missing from cookies");
                return Unauthorized(new { error = "Refresh token not found" });
            }

            // Get token claims
            var userId = int.Parse(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var jti = HttpContext.User.FindFirst(JwtRegisteredClaimNames.Jti)?.Value ?? "UnknownJTI";
            var deviceId = HttpContext.User.FindFirst("DeviceId")?.Value;
            var ipAddress = HttpContext.User.FindFirst("IPAddress")?.Value;
           
            if (userId == 0 || string.IsNullOrEmpty(jti) || string.IsNullOrEmpty(deviceId) || string.IsNullOrEmpty(ipAddress))
            {
                _logger.LogWarning("Missing claims for logout - UserId: {UserId}, JTI: {Jti}, DeviceId: {DeviceId}, IPAddress: {IpAddress}", userId, jti, deviceId, ipAddress);
                return Unauthorized(new { error = "Invalid token claims" });
            }

            await _authService.LogoutAsync(userId, deviceId, ipAddress, jti, refreshTokenHash);

            _logger.LogInformation("User {UserId} logged out successfully at {Timestamp}", userId, DateTime.UtcNow);

            // Delete only the specific session's cookies - keep other sessions intact
            Response.Cookies.Delete(tokenCookieName);
            Response.Cookies.Delete(refreshTokenCookieName);

            return Ok(StatusCodes.Status200OK);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = "An error occurred during logout" });
        }
    }

    private string GetDeviceFingerprint()
    {
        if (Request?.HttpContext == null)
            return string.Empty;

        _logger.LogInformation(Request.Headers["User-Agent"].ToString(),
            Request.Headers["Accept"].ToString(),
            Request.Headers["Accept-Encoding"].ToString());

        return _deviceService.GenerateFingerprint(
            Request.Headers["User-Agent"].ToString(),
            Request.Headers["Accept"].ToString(),
            Request.Headers["Accept-Encoding"].ToString()
        );
    }

    private string GetClientIp()
    {
        if (Request?.HttpContext == null)
        {
            return "Unknown";
        }

        var xForwardedFor = Request.Headers["X-Forwarded-For"].ToString();
        return !string.IsNullOrEmpty(xForwardedFor) 
            ? xForwardedFor.Split(',').First().Trim() 
            : HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
    }
}