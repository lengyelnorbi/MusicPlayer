using API.DTO;

namespace API.Models.RequestModels;

public class CreateUserRequest
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "User"; // Default role is "User"
    public UserDTO UserDTO { get; set; }
    public CreateUserRequest(string username, string email, string passwordHash, string role)
    {
        UserDTO userDTO = new UserDTO(username, email, passwordHash, role);
        UserDTO = userDTO;
    }
}