using API.Services;
using API.Services.Interfaces;
using API.Data;
using API.Utils;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Serilog;
using Microsoft.AspNetCore.Mvc;
using API.Messaging;
using API.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console()
    .WriteTo.File(
        "/app/logs/app-.log",
        rollingInterval: RollingInterval.Day,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

builder.Host.UseSerilog();

// Configure JWT Settings
var jwtSettings = new JwtSettings
{
    SecretKey = builder.Configuration["Jwt:SecretKey"] ?? "your-super-secret-key-change-this-in-production-must-be-at-least-32-characters-long!",
    Issuer = builder.Configuration["Jwt:Issuer"] ?? "MusicPlayerAPI",
    Audience = builder.Configuration["Jwt:Audience"] ?? "MusicPlayerClient",
    UserExpirationMinutes = int.Parse(builder.Configuration["Jwt:ExpirationMinutes"] ?? "15"), // Default to 15 minutes for users
    AdminExpirationMinutes = int.Parse(builder.Configuration["Jwt:AdminExpirationMinutes"] ?? "5"), // Default to 5 minutes for admins
    UserRefreshTokenExpirationMinutes = int.Parse(builder.Configuration["Jwt:UserRefreshTokenExpirationMinutes"] ?? "480"), // Default to 480 minutes
    AdminRefreshTokenExpirationMinutes = int.Parse(builder.Configuration["Jwt:AdminRefreshTokenExpirationMinutes"] ?? "60") // Default to 600 minutes
};

builder.Services.Configure<RabbitMqSettings>(
    builder.Configuration.GetSection("RabbitMQ"));

builder.Services.AddSingleton(jwtSettings);
builder.Services.AddSingleton<RabbitMqPublisher>();

// Configure PostgreSQL DbContext
builder.Services.AddDbContext<MusicPlayerDbContext>(options =>  
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IMusicService, MusicService>();
builder.Services.AddScoped<IPlaylistService, PlaylistService>();
builder.Services.AddScoped<IPasswordService, PasswordService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IDeviceService, DeviceService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IGoogleDriveService, GoogleDriveService>();
builder.Services.AddScoped<IAdvancedMsgQueueCommService, AdvancedMsgQueueCommService>();
builder.Services.AddScoped<IMusicImportService, MusicImportService>();
builder.Services.AddScoped<IImportSourceResolver, ImportSourceResolver>();

builder.Services.AddHostedService<MusicWorkCompletedConsumer>();

builder.Services.AddSignalR();



// Configure JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidateAudience = true,
        ValidAudience = jwtSettings.Audience,
        ValidateLifetime = true,
        IssuerSigningKey = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtSettings.SecretKey))
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            try
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                
                logger.LogInformation("====== OnMessageReceived START ======");
                logger.LogInformation("Available cookies: {CookieCount}", context.Request.Cookies.Count);
                
                foreach (var cookie in context.Request.Cookies)
                {
                    logger.LogInformation("Cookie: {CookieName} = {CookieValueLength} chars", cookie.Key, cookie.Value?.Length ?? 0);
                }

                // Read token from httpOnly cookie if not in Authorization header
                // Check for new source-specific cookies first, then fall back to old cookie for backward compatibility
                if (context.Request.Cookies.TryGetValue("adminToken", out var adminToken))
                {
                    logger.LogInformation("Admin token found in cookies, length: {TokenLength}", adminToken?.Length ?? 0);
                    context.Token = adminToken;
                    logger.LogInformation("Admin token set in context");
                }
                else if (context.Request.Cookies.TryGetValue("userToken", out var userToken))
                {
                    logger.LogInformation("User token found in cookies, length: {TokenLength}", userToken?.Length ?? 0);
                    context.Token = userToken;
                    logger.LogInformation("User token set in context");
                }
                else if (context.Request.Cookies.TryGetValue("token", out var token))
                {
                    logger.LogInformation("Legacy token found in cookies, length: {TokenLength}", token?.Length ?? 0);
                    context.Token = token;
                    logger.LogInformation("Legacy token set in context");
                }
                else
                {
                    logger.LogWarning("NO TOKEN FOUND IN COOKIES!");
                }
                
                logger.LogInformation("====== OnMessageReceived END - Token set: {TokenSet} ======", context.Token != null);
            }
            catch (Exception ex)
            {
                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                logger.LogError(ex, "ERROR in OnMessageReceived - this prevents OnAuthenticationFailed from being called!");
            }
            
            return Task.CompletedTask;
        },

        OnTokenValidated = async context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();

            var deviceService = context.HttpContext.RequestServices.GetRequiredService<IDeviceService>();

            logger.LogInformation("Token validated successfully for user: {User}", context.Principal?.Identity?.Name);

            if (context.Principal == null)
            {
                logger.LogError("Invalid token: Principal is null");
                context.Fail("Invalid token");
                return;
            }

            var storedFingerprint = context.Principal.FindFirst("DeviceId")?.Value;
            var currentFingerprint = GetDeviceFingerprintFromRequest(deviceService, context.HttpContext.Request);

            logger.LogInformation("Device fingerprint validation: Stored={StoredFingerprint}, Current={CurrentFingerprint}", 
                storedFingerprint, currentFingerprint);
            
            if (storedFingerprint != currentFingerprint)
            {
                logger.LogWarning("Device fingerprint mismatch: Stored={StoredFingerprint}, Current={CurrentFingerprint}", 
                    storedFingerprint, currentFingerprint);
                context.Fail("Device fingerprint mismatch");
                return;
            }

            // Get user role from claims
            var userRole = context.Principal.FindFirst(ClaimTypes.Role)?.Value ?? "User";
            var userId = int.Parse(context.Principal.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var jti = context.Principal.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;

            // For Admins: validate access token is in whitelist, not revoked, and not expired
            if (userRole == "Admin" && !string.IsNullOrEmpty(jti))
            {
                IAuthService authService = context.HttpContext.RequestServices.GetRequiredService<IAuthService>();
                var isValid = await authService.ValidateAccessTokenAsync(jti, userId, userRole);
                if (!isValid)
                {
                    context.Fail("Access token is not in whitelist or has been revoked");
                    return;
                }
            }
            // For Users: only expiration is checked (already done by JWT middleware)
            
            return;
        },

         OnAuthenticationFailed = async context =>
        {
            ILogger<Program> logger = null;
            try
            {
                logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            }
            catch
            {
                // If logger fails, we can't log, but continue
            }

            try
            {
                logger?.LogInformation("====== OnAuthenticationFailed START ======");
                logger?.LogInformation("Exception type: {ExceptionType}", context.Exception?.GetType().Name ?? "NULL");
                logger?.LogInformation("Exception message: {ExceptionMessage}", context.Exception?.Message ?? "No message");
                logger?.LogInformation("Full exception: {Exception}", context.Exception?.ToString() ?? "No exception");

                if (context.Exception is SecurityTokenExpiredException)
                {
                    logger.LogWarning("JWT-Pipeline: Access Token expired.");
                    var authService = context.HttpContext.RequestServices.GetRequiredService<IAuthService>();
                    
                    string refreshTokenHash = null;
                    string tokenCookieName = null;
                    string refreshTokenCookieName = null;
                    string rawExpiredToken = null;
                    
                    logger.LogInformation("Step 1: Identifying environment from cookies...");
                    
                    // 1. Identify environment from existing cookies
                    if (context.HttpContext.Request.Cookies.TryGetValue("adminRefreshToken", out var adminHash))
                    {
                        refreshTokenHash = adminHash;
                        tokenCookieName = "adminToken";
                        refreshTokenCookieName = "adminRefreshToken";
                        context.HttpContext.Request.Cookies.TryGetValue("adminToken", out rawExpiredToken);
                        logger.LogInformation("Admin token found in cookies");
                    }
                    else if (context.HttpContext.Request.Cookies.TryGetValue("userRefreshToken", out var userHash))
                    {
                        refreshTokenHash = userHash;
                        tokenCookieName = "userToken";
                        refreshTokenCookieName = "userRefreshToken";
                        context.HttpContext.Request.Cookies.TryGetValue("userToken", out rawExpiredToken);
                        logger.LogInformation("User token found in cookies");
                    }

                    // If no specific cookie, check legacy version
                    if (refreshTokenHash == null && context.HttpContext.Request.Cookies.TryGetValue("refreshToken", out var legacyHash))
                    {
                        refreshTokenHash = legacyHash;
                        tokenCookieName = "token";
                        refreshTokenCookieName = "refreshToken";
                        context.HttpContext.Request.Cookies.TryGetValue("token", out rawExpiredToken);
                        logger.LogInformation("Legacy token found in cookies");
                    }

                    if (refreshTokenHash != null)
                    {
                        logger.LogInformation("Step 2: Checking refresh token validity in database...");
                        
                        // 2. Check refresh token in database (IMPORTANT: with await, not .Result!)
                        try
                        {
                            var isRefreshTokenValid = await authService.GetUserRefreshTokenByTokenHashAsync(refreshTokenHash);
                            logger.LogInformation("Refresh token valid: {IsValid}", isRefreshTokenValid);
                            
                            // 3. EXTRACT DATA MANUALLY (since context.Principal is guaranteed NULL!)
                            int userId = 0;
                            string jti = "UnknownJTI";
                            string deviceFingerprint = "UnknownDevice";
                            string ipAddress = "UnknownIP";

                            logger.LogInformation("Step 3: Parsing expired token to extract claims...");
                            
                            if (!string.IsNullOrEmpty(rawExpiredToken))
                            {
                                try
                                {
                                    var tokenHandler = new JwtSecurityTokenHandler();
                                    if (tokenHandler.CanReadToken(rawExpiredToken))
                                    {
                                        logger.LogInformation("Token can be read, attempting to parse...");
                                        var jwtToken = tokenHandler.ReadJwtToken(rawExpiredToken);
                                        
                                        // Extract claims from raw expired token
                                        var sub = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == JwtRegisteredClaimNames.Sub)?.Value;
                                        int.TryParse(sub, out userId);
                                        
                                        jti = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value ?? "UnknownJTI";
                                        deviceFingerprint = jwtToken.Claims.FirstOrDefault(c => c.Type == "DeviceId")?.Value ?? "UnknownDevice";
                                        ipAddress = jwtToken.Claims.FirstOrDefault(c => c.Type == "IPAddress")?.Value ?? "UnknownIP";
                                        
                                        logger.LogInformation("Token parsed successfully - UserId: {UserId}, JTI: {JTI}, Device: {Device}, IP: {IP}", 
                                            userId, jti, deviceFingerprint, ipAddress);
                                    }
                                    else
                                    {
                                        logger.LogWarning("Token cannot be read by handler");
                                    }
                                }
                                catch (Exception tokenParseEx)
                                {
                                    logger.LogError(tokenParseEx, "Error parsing expired token");
                                }
                            }
                            else
                            {
                                logger.LogWarning("No raw expired token found in cookies");
                            }

                            // 4. If refresh token is also expired/invalid, or this is the last valid refresh
                            if (!isRefreshTokenValid)
                            {
                                logger.LogWarning("Step 4: Refresh token is expired or invalid. Full session revocation for UserId: {UserId}", userId);
                                
                                try
                                {
                                    // Security cleanup in database (IMPORTANT: with await, not .Wait()!)
                                    logger.LogInformation("Revoking refresh token...");
                                    await authService.RevokeRefreshTokenAsync(refreshTokenHash, userId, deviceFingerprint, ipAddress);
                                    logger.LogInformation("Refresh token revoked successfully");
                                    
                                    if (jti != "UnknownJTI")
                                    {
                                        logger.LogInformation("Revoking access token...");
                                        await authService.RevokeAccessTokenAsync(jti, userId, deviceFingerprint, ipAddress);
                                        logger.LogInformation("Access token revoked successfully");
                                    }

                                    // Physical deletion of cookies from client browser
                                    logger.LogInformation("Deleting cookies: {TokenCookie}, {RefreshTokenCookie}", tokenCookieName, refreshTokenCookieName);
                                    context.HttpContext.Response.Cookies.Delete(tokenCookieName);
                                    context.HttpContext.Response.Cookies.Delete(refreshTokenCookieName);
                                    logger.LogInformation("Cookies deleted successfully");
                                }
                                catch (Exception revokeEx)
                                {
                                    logger.LogError(revokeEx, "Error during token revocation");
                                }
                                
                                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                                logger.LogInformation("Response status set to 401 Unauthorized");
                                logger.LogInformation("====== OnAuthenticationFailed END (tokens revoked) ======");
                                return;
                            }
                            
                            // If refresh token is still valid but access token expired,
                            // allow the 401 through as frontend timer/interceptor will call /refresh
                            logger.LogInformation("Access token expired but refresh token is still active. Frontend should refresh.");
                        }
                        catch (Exception dbEx)
                        {
                            logger.LogError(dbEx, "Error checking refresh token in database");
                        }
                    }
                    else
                    {
                        logger.LogWarning("Step 2: No refresh token found in cookies. Cleaning up orphaned tokens.");
                        // Cleanup orphaned expired tokens
                        context.HttpContext.Response.Cookies.Delete("token");
                        context.HttpContext.Response.Cookies.Delete("refreshToken");
                    }

                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    logger.LogInformation("====== OnAuthenticationFailed END ======");
                }
                else
                {
                    logger?.LogWarning("OnAuthenticationFailed: Exception is NOT SecurityTokenExpiredException. Type: {ExceptionType}, Message: {Message}", 
                        context.Exception?.GetType().Name ?? "NULL", 
                        context.Exception?.Message ?? "No message");
                    logger?.LogInformation("====== OnAuthenticationFailed END (different exception type) ======");
                }
            }
            catch (Exception ex)
            {
                logger?.LogError(ex, "CRITICAL ERROR in OnAuthenticationFailed handler - unexpected exception!");
                logger?.LogInformation("====== OnAuthenticationFailed END (EXCEPTION) ======");
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            }
        }
    };

    static string GetDeviceFingerprintFromRequest(IDeviceService deviceService, HttpRequest request)
    {
        if (request?.HttpContext == null)
            return string.Empty;

        var userAgent = request.Headers["User-Agent"].ToString();
        var accept = request.Headers["Accept"].ToString();
        var encoding = request.Headers["Accept-Encoding"].ToString();
        
        var logger = request.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogInformation("Device fingerprint headers - UA: {UserAgent}, Accept: {Accept}, Encoding: {Encoding}", 
            userAgent ?? "(empty)", accept ?? "(empty)", encoding ?? "(empty)");

        return deviceService.GenerateFingerprint(userAgent, accept, encoding);
    }
});

// Configure Authorization Policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminSource", policy =>
    {
        policy.RequireClaim("source", "admin");
        policy.RequireRole("Admin");
    });
});

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            // Development: Allow localhost and local network IPs
            policy.WithOrigins("http://192.168.1.2:4200", "https://localhost:4200", "https://127.0.0.1:4200")
                    .AllowAnyMethod()
                    .AllowCredentials()  // This is critical
                    .AllowAnyHeader()
                    .WithExposedHeaders("Content-Disposition");
        }
        else
        {
            // Production: Allow your production domain
            policy.WithOrigins(
                "https://yourdomain.com",
                "https://www.yourdomain.com"
            )
            .AllowAnyMethod()
            .WithHeaders("Authorization", "Content-Type")
            .AllowCredentials();
        }
    });
});
Console.WriteLine("=== ASSEMBLY OPENAPI REFERENCES ===");

foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
{
    try
    {
        var reference = assembly
            .GetReferencedAssemblies()
            .FirstOrDefault(x => x.Name == "Microsoft.OpenApi");

        if (reference != null)
        {
            Console.WriteLine(
                $"{assembly.GetName().Name} -> Microsoft.OpenApi {reference.Version}");
        }
    }
    catch
    {
        // Ignore assemblies that cannot be inspected.
    }
}

Console.WriteLine("=== END ASSEMBLY OPENAPI REFERENCES ===");

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        ILogger<Program> logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
        foreach (var kv in context.ModelState)
        {
            foreach (var err in kv.Value.Errors)
            {
                logger.LogWarning("Model validation error for field '{Field}': {ErrorMessage}", kv.Key, err.ErrorMessage);
            }
        }

        return new BadRequestObjectResult(context.ModelState);
    };
});
builder.Host.UseSerilog();

var app = builder.Build();

// The development compose setup runs the API and completion consumer together.
// Apply pending migrations before hosted services can query the import tables.
if (app.Environment.IsDevelopment())
{
    try
    {
        using var migrationScope = app.Services.CreateScope();
        var dbContext = migrationScope.ServiceProvider.GetRequiredService<MusicPlayerDbContext>();
        await dbContext.Database.MigrateAsync();
    }
    catch (Exception ex)
    {
        app.Logger.LogCritical(ex, "Database migration failed during API startup.");
        throw;
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseRouting();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<MusicImportHub>("/hubs/music-import");

app.Run();
