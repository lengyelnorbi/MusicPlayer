namespace API.DTO;

public class MusicSyncResultDTO
{
    public int DriveFileCount { get; set; }
    public int AddedCount { get; set; }
    public List<MusicSyncItemDTO> Added { get; set; } = new();
}

public class MusicSyncItemDTO
{
    public string? Title { get; set; }
    public string? FileId { get; set; }
}
