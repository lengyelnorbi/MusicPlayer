namespace API.DTO;
public class UserDTO
{
    public int ID { get; set; }
    public string Username { get; set; }
    public string Email { get; set; }
    public string? PasswordHash { get; set; }
    public DateOnly? RegisteredAt { get; set; }
    public string Role { get; set; }
    public string? Jti { get; set; } // Unique identifier for JWT token, used for token revocation and tracking

    public UserDTO(){}

    public UserDTO(int ID, string Username, string Email, DateOnly? RegisteredAt, string Role)
    {
        this.ID = ID;
        this.Username = Username;
        this.Email = Email;
        this.RegisteredAt = RegisteredAt ?? DateOnly.FromDateTime(DateTime.Parse("1970-01-01").Date);
        this.Role = Role;
    }

    // Constructor for creating new users (ID auto-incremented by database)
    public UserDTO(string Username, string Email, string PasswordHash, string Role = "User", DateOnly? RegisteredAt = null)
    {
        this.Username = Username;
        this.Email = Email;
        this.PasswordHash = PasswordHash;
        this.Role = Role;
        this.RegisteredAt = RegisteredAt ?? DateOnly.FromDateTime(DateTime.Now);
    }

    // Constructor for retrieving existing users from database
    public UserDTO(int ID, string Username, string Email, string PasswordHash, DateOnly? RegisteredAt, string Role, string Jti)
    {
        this.ID = ID;
        this.Username = Username;
        this.Email = Email;
        this.PasswordHash = PasswordHash;
        this.Role = Role;
        this.RegisteredAt = RegisteredAt ?? DateOnly.FromDateTime(DateTime.Now);
    } 

    public override string ToString()
    {
        return $"UserDTO [ID={ID}, Username={Username}, Email={Email}, PasswordHash={PasswordHash}, RegisteredAt={RegisteredAt}, Role={Role}, Jti={Jti}]";
    }
}