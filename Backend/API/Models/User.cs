namespace API.Models;

public class User 
{
    public int ID { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public DateOnly? RegisteredAt { get; set; }
    public string Role { get; set; } = "User"; // Default role is "User"
    public string? Jti { get; set; } // Unique identifier for JWT token, used for token revocation and tracking (nullable)
    public string TokenVersion { get; set; } = "1"; // For future token versioning and invalidation
    
    // Store related IDs for many-to-many relationships
    public List<int> Playlists { get; set; } = new();
    public List<int> FavoritePlaylists { get; set; } = new();
    public List<int> FollowedPlaylists { get; set; } = new();
    public List<int> FavoriteMusics { get; set; } = new();
    

    //Creating User
    public User(int ID, string Name, string Email, string PasswordHash, string Role, string? Jti, string TokenVersion, Playlist[]? Playlists, Playlist[]? FavoritePlaylists, Playlist[]? FollowedPlaylists, Music[]? FavoriteMusics)
    {
        this.ID = ID;
        this.Name = Name;
        this.Email = Email;
        this.PasswordHash = PasswordHash;
        this.Role = Role;
        this.Jti = Jti;
        this.TokenVersion = TokenVersion;
        this.RegisteredAt = DateOnly.FromDateTime(DateTime.Now);
        this.Playlists = Playlists?.Select(p => p.ID).ToList() ?? new List<int>();
        this.FavoritePlaylists = FavoritePlaylists?.Select(p => p.ID).ToList() ?? new List<int>();
        this.FollowedPlaylists = FollowedPlaylists?.Select(p => p.ID).ToList() ?? new List<int>();
        this.FavoriteMusics = FavoriteMusics?.Select(m => m.ID).ToList() ?? new List<int>();
    }
}