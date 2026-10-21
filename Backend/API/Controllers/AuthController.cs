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

    /// <summary>
    /// Retrieves the cookie options for setting cookies, including HttpOnly, Secure, SameSite, and expiration settings.
    /// </summary>
    /// <param name="expires"></param>
    /// <returns></returns>
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

    /// <summary>
    /// Authenticates a user based on their email and password, generating access and refresh tokens upon successful authentication.
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPost("", Name = "Authenticate")]
    public async Task<IActionResult> Authenticate([FromBody] LoginRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { error = "Email and password are required." });

        _logger.LogInformation("Authentication attempt received.");
        // UserService currently throws when an email is not found; keep the public
        // response generic so unknown accounts do not cause a 500 or reveal account state.
        API.DTO.UserDTO? user;
        try
        {
            user = await _userService.GetUserByEmailAsync(request.Email.Trim());
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "No user was found during authentication lookup.");
            return Unauthorized(new { error = "Invalid credentials" });
        }

        if (user == null)
        {
            _logger.LogWarning("Authentication failed for email: {Email}", request.Email);
            return Unauthorized(new { error = "Invalid credentials" });
        }

        /* Authenticate user by unique device fingerprint and generate access token on successful authentication*/    
        var deviceFingerprint = GetDeviceFingerprint();
        var clientIp = GetClientIp();
        var (accessToken, refreshToken, accessTokenExpiresAt) = await _authService.AuthenticateAsync(request.Email.Trim(), request.Password, deviceFingerprint, clientIp, request.Source);

        if (accessToken == null || refreshToken == null)
        {
            _logger.LogWarning("Authentication failed for email: {Email}", request.Email);
            return Unauthorized(new { error = "Invalid credentials" });
        }

        /* token generation and device auth done */

        /* Set cookie names and expiration based on source (admin or user) */
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

        /* Cookies setting end here */


        // Log the authentication details for debugging purposes
        _logger.LogInformation("--------------------------------------------------------------------");
        _logger.LogInformation("Source: {Source}", request.Source);
        _logger.LogInformation("Access Token expires at: {AccessTokenExpiresAt}", accessTokenExpiresAt);
        _logger.LogInformation("Refresh Token expires at: {RefreshTokenExpiresAt}", refreshToken.ExpiresAt);
        _logger.LogInformation("tokenCookieName: {TokenCookieName}", tokenCookieName);
        _logger.LogInformation("refreshTokenCookieName: {RefreshTokenCookieName}", refreshTokenCookieName);
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

    /// <summary>
    /// Refreshes the access token and refresh token for an authenticated user based on the provided refresh token in cookies.
    /// This endpoint is protected and requires the user to be authenticated.
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
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

            // Check for admin or user refresh token in cookies
            if (Request.Cookies.TryGetValue("adminRefreshToken", out var adminRefreshTokenHash))
            {
                refreshTokenHash = adminRefreshTokenHash;
                tokenCookieName = "adminToken";
                refreshTokenCookieName = "adminRefreshToken";
                _logger.LogInformation("Refreshing admin token at {Timestamp}", DateTime.UtcNow);
            }
            // Check for user refresh token in cookies
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

            // Get the JTI (JWT ID) from the current access token claims for logging and validation
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

    /// <summary>
    /// Logs out the authenticated user by invalidating their refresh token and deleting the associated cookies.
    /// This endpoint is protected and requires the user to be authenticated.
    /// </summary>
    /// <returns></returns>
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
            
            // Check for admin or user refresh token in cookies
            if (Request.Cookies.TryGetValue("adminRefreshToken", out var adminRefreshTokenHash))
            {
                refreshTokenHash = adminRefreshTokenHash;
                tokenCookieName = "adminToken";
                refreshTokenCookieName = "adminRefreshToken";
                _logger.LogInformation("Admin logout at {Timestamp}", DateTime.UtcNow);
            }
            // Check for user refresh token in cookies
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

    /// <summary>
    /// Rotates a native client's refresh token without relying on browser cookies or an unexpired access token.
    /// The refresh-token hash is a credential and must only be sent over HTTPS in production.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("mobile/refresh")]
    public async Task<IActionResult> MobileRefresh([FromBody] MobileRefreshRequest? request)
    {
        var refreshTokenHash = request?.RefreshToken?.Trim();
        if (string.IsNullOrWhiteSpace(refreshTokenHash))
            return Unauthorized(new { error = "Refresh token is required." });

        try
        {
            var refreshToken = await _authService.GetRefreshTokenByHashAsync(refreshTokenHash);
            if (refreshToken is null)
                return Unauthorized(new { error = "Invalid or expired refresh token." });

            var currentFingerprint = GetDeviceFingerprint();
            if (!string.Equals(refreshToken.DeviceFingerprint, currentFingerprint, StringComparison.Ordinal))
                return Unauthorized(new { error = "Device fingerprint mismatch." });

            // The old access token may already be expired, so its JTI is not available here.
            // The refresh token is rotated, which invalidates the submitted refresh credential.
            var result = await _authService.RefreshAccessTokenAndRefreshTokenAsync(
                refreshToken,
                refreshToken.UserID,
                refreshToken.DeviceFingerprint,
                refreshToken.IpAddress,
                "UnknownJTI",
                "user");

            if (result is null) return Unauthorized(new { error = "Could not refresh this session." });
            var (accessToken, rotatedRefreshToken, expiresAt) = result.Value;
            if (string.IsNullOrWhiteSpace(accessToken) || rotatedRefreshToken is null || expiresAt is null)
                return Unauthorized(new { error = "Could not refresh this session." });

            return Ok(new
            {
                success = true,
                accessToken,
                refreshToken = rotatedRefreshToken.TokenHash,
                expiresAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Mobile token refresh failed.");
            return Problem("Could not refresh the session.");
        }
    }

    /// <summary>
    /// Native logout uses the refresh-token hash returned by MobileLogin instead of browser cookies.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("mobile/logout")]
    public async Task<IActionResult> MobileLogout([FromBody] MobileLogoutRequest? request)
    {
        var refreshTokenHash = request?.RefreshToken?.Trim();
        if (string.IsNullOrWhiteSpace(refreshTokenHash))
            return NoContent();

        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var jti = User.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
            var deviceId = User.FindFirst("DeviceId")?.Value;
            var ipAddress = User.FindFirst("IPAddress")?.Value;
            var refreshToken = await _authService.GetRefreshTokenByHashAsync(refreshTokenHash);

            if (int.TryParse(userIdClaim, out var userId) && userId > 0 &&
                !string.IsNullOrWhiteSpace(jti) && !string.IsNullOrWhiteSpace(deviceId) &&
                !string.IsNullOrWhiteSpace(ipAddress) &&
                (refreshToken is null || (userId == refreshToken.UserID &&
                    string.Equals(deviceId, refreshToken.DeviceFingerprint, StringComparison.Ordinal) &&
                    string.Equals(ipAddress, refreshToken.IpAddress, StringComparison.Ordinal))))
            {
                // Revoke the access token as well when its bearer token is still valid.
                // The service also attempts to revoke the refresh hash, including expired records.
                await _authService.LogoutAsync(userId, deviceId, ipAddress, jti, refreshTokenHash);
            }
            else if (refreshToken is not null)
            {
                // An expired access token can still present a valid refresh credential.
                await _authService.RevokeRefreshTokenAsync(
                    refreshTokenHash,
                    refreshToken.UserID,
                    refreshToken.DeviceFingerprint,
                    refreshToken.IpAddress);
            }

            // Idempotent logout: a token may already be revoked or expired.
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Mobile logout failed.");
            return Problem("Could not complete logout.");
        }
    }

    /// <summary>
    /// Generates a unique fingerprint for the client's device based on its user agent, accept, and accept-encoding headers.
    /// </summary>
    /// <returns>A string representing the device's fingerprint.</returns>
    private string GetDeviceFingerprint()
    {
        if (Request?.HttpContext == null)
            return string.Empty;

        _logger.LogInformation(Request.Headers["User-Agent"].ToString(), Request.Headers["Accept"].ToString(), Request.Headers["Accept-Encoding"].ToString());

        return _deviceService.GenerateFingerprint(Request.Headers["User-Agent"].ToString(), Request.Headers["Accept"].ToString(), Request.Headers["Accept-Encoding"].ToString());
    }

    /// <summary>
    /// Retrieves the client's IP address from the request headers or connection information.
    /// </summary>
    /// <returns>A string representing the client's IP address.</returns>
    private string GetClientIp()
    {
        if (Request?.HttpContext == null)
        {
            return "Unknown";
        }

        var xForwardedFor = Request.Headers["X-Forwarded-For"].ToString();
        return !string.IsNullOrEmpty(xForwardedFor) ? xForwardedFor.Split(',').First().Trim() : HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
    }

    /// <summary>
    /// Mobile login endpoint for authenticating users from mobile devices. This endpoint accepts email and password, generates access and refresh tokens, and returns them in the response.
    /// This endpoint is accessible without authentication.
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [AllowAnonymous]
    [HttpPost("mobile")]
    public async Task<IActionResult> MobileLogin([FromBody] LoginRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { error = "Email and password are required." });
        }

        API.DTO.UserDTO? user;
        try
        {
            user = await _userService.GetUserByEmailAsync(request.Email.Trim());
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "No user was found during mobile authentication lookup.");
            return Unauthorized(new { error = "Invalid credentials" });
        }

        if (user == null)
            return Unauthorized(new { error = "Invalid credentials" });

        var deviceFingerprint = GetDeviceFingerprint();
        var clientIp = GetClientIp();

        // Always use the user role for this mobile endpoint.
        var (accessToken, refreshToken, expiresAt) =
            await _authService.AuthenticateAsync(request.Email.Trim(), request.Password, deviceFingerprint, clientIp, "user");

        if (accessToken == null || refreshToken == null || expiresAt == null)
        {
            return Unauthorized(new { error = "Invalid credentials" });
        }

        return Ok(new
        {
            success = true,
            accessToken,
            // Your current AuthService stores and uses this hash
            // as the refresh-token cookie value.
            refreshToken = refreshToken.TokenHash,
            expiresAt,
            user = new
            {
                user.ID,
                user.Username,
                user.Role
            }
        });
    }
}

public sealed class MobileLogoutRequest
{
    public string? RefreshToken { get; set; }
}

public sealed class MobileRefreshRequest
{
    public string? RefreshToken { get; set; }
}