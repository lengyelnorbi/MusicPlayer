namespace API.Models;

public class Playlist 
{
    public int ID { get; set; }
    public string Name { get; set; }
    public int MusicCount { get; set; } // Count of associated musics
    
    // Store related IDs for many-to-many relationships
    public List<Music> Musics { get; set; } = new();

    public Playlist()
    {
    }

    public Playlist(int ID, string Name, int MusicCount = 0)
    {
        this.ID = ID;
        this.Name = Name;
        this.MusicCount = MusicCount;
    }
}