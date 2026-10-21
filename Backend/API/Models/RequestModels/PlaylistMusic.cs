namespace API.Models.RequestModels;

public class PlaylistMusic
{
    public int PlaylistID { get; set; }
    public int MusicID { get; set; }

    public PlaylistMusic(int playlistID, int musicID)
    {
        PlaylistID = playlistID;
        MusicID = musicID;
    }
}