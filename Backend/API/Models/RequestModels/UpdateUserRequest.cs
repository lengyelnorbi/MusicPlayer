using API.DTO;

namespace API.Models.RequestModels;
public class UpdateUserRequest
{
    public int ID { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Password { get; set; } = null;
    public UserUpdateDTO UserUpdateDTO { get; set; }
    public UpdateUserRequest(int id, string username, string email, string? password)
    {
        if(password == null)
        {
            UserUpdateDTO userUpDTOWithoutPwdChange = new UserUpdateDTO(id, username, email);
            UserUpdateDTO = userUpDTOWithoutPwdChange;
            return;
        }
        UserUpdateDTO userUpdateDTO = new UserUpdateDTO(id, username, email, password);
        UserUpdateDTO = userUpdateDTO;
    }
}