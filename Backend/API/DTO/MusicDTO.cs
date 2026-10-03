namespace API.DTO;

public class MusicDTO
{
    public int ID { get; set; }
    public string? Title { get; set; }
    public DateOnly? AddedAt { get; set; }

    public List<int> PlaylistIDs { get; set; } = new();
}
