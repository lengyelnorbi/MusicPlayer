using System.ComponentModel.DataAnnotations;

namespace API.Models.RequestModels;

public class CreateImportJobRequest
{
    [Required]
    [Url]
    [MaxLength(2048)]
    public string Url { get; set; } = string.Empty;
}
