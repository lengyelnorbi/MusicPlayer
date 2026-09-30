namespace API.Models;

public class PlaylistMusic
{
    public int PlaylistID { get; set; }
    public int MusicID { get; set; }
    
    // Navigation properties (optional, for accessing related entities)
    public Playlist? Playlist { get; set; }
    public Music? Music { get; set; }
}