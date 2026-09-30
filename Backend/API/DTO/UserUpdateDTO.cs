namespace API.DTO;
public class UserUpdateDTO
{
    public int ID { get; set; }
    public string Username { get; set; }
    public string Email { get; set; }
    public string? PasswordHash { get; set; }
    public UserUpdateDTO(){}

    public UserUpdateDTO(int ID, string Username, string Email, string? PasswordHash = null)
    {
        this.ID = ID;
        this.Username = Username;
        this.Email = Email;
        this.PasswordHash = PasswordHash;
    }

    public override string ToString()
    {
        return $"UserUpdateDTO [ID={ID}, Username={Username}, Email={Email}, PasswordHash={PasswordHash}]";
    }
}