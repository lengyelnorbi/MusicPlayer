namespace API.Models.RequestModels;

public class LoginRequest : BaseRequest
{
    public string Email { get; set; }
    public string Password { get; set; }

    public LoginRequest(string email, string password, string source = "user") : base(source)
    {
        Email = email;
        Password = password;
    }
}