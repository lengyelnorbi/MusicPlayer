namespace API.Models.RequestModels;
public class CreatePlaylistRequest
{
    public string Name { get; set; } = string.Empty;

    public CreatePlaylistRequest(string name)
    {
        Name = name;
    }
}