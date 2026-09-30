namespace API.Models.RequestModels;
public class GeneratePwdRequest : BaseRequest
{
    public string Email { get; set; }
    public string Role { get; set; }

    public GeneratePwdRequest(string email, string role, string source = "user") : base(source)
    {
        Email = email;
        Role = role;
    }
}