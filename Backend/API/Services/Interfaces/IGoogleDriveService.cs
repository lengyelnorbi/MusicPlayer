using API.Models;

namespace API.Services.Interfaces;

public interface IGoogleDriveService
{
    Task<Stream> GetFileStreamAsync(string fileID, CancellationToken cancellationToken = default);
    Task<(byte[] Content, string FileName, string MimeType)> DownloadMusicFileAsync(string fileID);
    Task<byte[]> DownloadAllMusicFileAsync();
    Task<Music[]> ListMusicFilesInFolder();
}