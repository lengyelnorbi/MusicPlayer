namespace API.DTO;
public class AccessTokenUserDTO
{
    public int ID { get; set; }
    public string? jti { get; set; }
    public string DeviceFingerprint { get; set; } = null!;
    public string IpAddress { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public bool IsRevoked { get; set; }
    public DateTime ExpiresAt { get; set; }

    public int UserID { get; set; } = 0;
    public string Username { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Role { get; set; } = null!;
}