using API.Models.Enums;

namespace API.Models;

public class ImportSource
{
    public JobType Type { get; set; }
    public List<string> Urls { get; set; } = new();
}
