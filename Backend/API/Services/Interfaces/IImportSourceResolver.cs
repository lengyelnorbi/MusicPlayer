using API.Models;

namespace API.Services.Interfaces;

public interface IImportSourceResolver
{
    Task<ImportSource> ResolveAsync(
        string url,
        CancellationToken cancellationToken = default);
}