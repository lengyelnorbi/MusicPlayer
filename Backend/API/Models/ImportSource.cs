using API.Models.Enums;

namespace API.Models;

public class ImportSource
{
    public JobType Type { get; set; }
    public List<string> Urls { get; set; } = new();
    public List<ImportSourceItem> Items { get; set; } = new();
}

public class ImportSourceItem
{
    public string Url { get; set; } = string.Empty;
    public string? Title { get; set; }
}
