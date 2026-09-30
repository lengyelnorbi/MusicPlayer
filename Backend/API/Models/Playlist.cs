namespace API.Models;

public class Playlist 
{
    public int ID { get; set; }
    public string Name { get; set; }
    
    // Store related IDs for many-to-many relationships
    public List<int> Musics { get; set; } = new();

    public Playlist(int ID, string Name)
    {
        this.ID = ID;
        this.Name = Name;
    }
}