namespace API.Utils;

public class JwtSettings
{
    public string SecretKey { get; set; }
    public string Issuer { get; set; }
    public string Audience { get; set; }
    public int UserExpirationMinutes { get; set; }
    public int UserRefreshTokenExpirationMinutes { get; set; }
    public int AdminExpirationMinutes { get; set; } // Default to 15 minutes for admins
    public int AdminRefreshTokenExpirationMinutes { get; set; } // Default to 60 minutes for admins
}
