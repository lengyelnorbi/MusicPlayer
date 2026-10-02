namespace API.Models;

public class Music 
{
    public int ID { get; set; }
    public string? Title { get; set; }
    public string? File_id { get; set; }
    public DateOnly? AddedAt { get; set; }

    public Music()
    {
    }

    public Music(int ID, string? Title, string? File_id)
    {
        this.ID = ID;
        this.Title = Title;
        this.File_id = File_id;
        AddedAt = DateOnly.FromDateTime(DateTime.Now);
    }

    public Music(string? Title, string? File_id)
    {
        this.Title = Title;
        this.File_id = File_id;
    }
}