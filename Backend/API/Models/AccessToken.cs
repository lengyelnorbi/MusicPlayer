using API.DTO;

namespace API.Models;

public class AccessToken
{
    public int ID { get; set; }
    public string? jti { get; set; } // Unique identifier for the token, used for revocation and tracking
    public int UserID { get; set; }
    public string DeviceFingerprint { get; set; }
    public string IpAddress { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }

    public UserDTO? User { get; set; }

    public AccessToken(string jti, int userID, string deviceFingerprint, string ipAddress, DateTime createdAt, DateTime expiresAt, bool isRevoked = false)
    {
        this.jti = jti;
        this.UserID = userID;
        this.DeviceFingerprint = deviceFingerprint;
        this.IpAddress = ipAddress;
        this.CreatedAt = createdAt;
        this.ExpiresAt = expiresAt;
        this.IsRevoked = isRevoked;
    }
}