namespace API.DTO;

public class MusicListResponseDTO
{
    public int TotalItemCount { get; set; }
    public int TotalPages { get; set; }
    public List<MusicDTO> Items { get; set; } = [];
    public List<PlaylistRefDTO> UserPlaylists { get; set; } = [];
}
