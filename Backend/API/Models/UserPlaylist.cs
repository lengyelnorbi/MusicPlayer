using API.DTO;

namespace API.Models;

public class UserPlaylist
{
    public int UserID { get; set; }
    public int PlaylistID { get; set; }
    
    // Navigation properties (optional, for accessing related entities)
    public UserDTO? User { get; set; }  
    public Playlist? Playlist { get; set; }
}
