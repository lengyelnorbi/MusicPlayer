using API.DTO;

namespace API.Models;

public class RefreshToken
{
    public int ID { get; set; }
    public int UserID { get; set; }
    public string TokenHash { get; set; }  // Hash of the refresh token
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public string DeviceFingerprint { get; set; }
    public string IpAddress { get; set; }
    public bool IsRevoked { get; set; } = false;
    
    // Foreign key
    public UserDTO? User { get; set; }

    public RefreshToken(int UserID, string TokenHash, DateTime ExpiresAt, string DeviceFingerprint, string IpAddress, bool IsRevoked = false)
    {
        this.UserID = UserID;
        this.TokenHash = TokenHash;
        this.ExpiresAt = ExpiresAt;
        this.CreatedAt = DateTime.UtcNow;
        this.DeviceFingerprint = DeviceFingerprint;
        this.IpAddress = IpAddress;
        this.IsRevoked = IsRevoked;
    }
}