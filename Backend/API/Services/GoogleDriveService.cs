using API.Models;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Drive.v3;
using Google.Apis.Drive.v3.Data;
using Google.Apis.Services;

namespace API.Services.Interfaces;

public class GoogleDriveService : IGoogleDriveService
{
    private readonly DriveService _driveService;
    
    public GoogleDriveService(IConfiguration configuration)
    {
        var credentialsPath =
            configuration["GOOGLE_APPLICATION_CREDENTIALS_PATH"];

        var credential = CredentialFactory
            .FromFile<ServiceAccountCredential>(credentialsPath)
            .ToGoogleCredential()
            .CreateScoped(DriveService.Scope.DriveReadonly);

        _driveService = new DriveService(
            new BaseClientService.Initializer
            {
                HttpClientInitializer = credential,
                ApplicationName = "MusicPlayer"
            });
    }

    public async Task<Stream> GetFileStreamAsync(
        string fileId,
        CancellationToken cancellationToken = default)
    {
        var request = _driveService.Files.Get(fileId);

        var stream = new MemoryStream();

        await request.DownloadAsync(stream, cancellationToken);

        stream.Position = 0;

        return stream;
    }

    // public async Task<Music> GetMusicsFromGoogleDrive(string file_id)
    // {
    //     DriveService driveService = await GetServiceAsync();

        
    //     // Simulate fetching music data from Google Drive
    //     return new Music(
    //         "Sample Music",
    //         "https://drive.google.com/sample-music.mp3"
    //     );
    // }

    public Task<Music[]> ListMusicFilesInFolder(string folderID = "1uaIrMoQw3d-KIh6w0M-QRviPrlr2Xeod")
    {
        var listRequest = _driveService.Files.List();
        
        // Filter for files in the folder, not in trash, and matching common audio formats
        listRequest.Q = $"'{folderID}' in parents and trashed = false and (" +
                            "mimeType contains 'audio/' or " +
                            "mimeType = 'application/x-flac' or " +
                            "name contains '.mp3' or " +
                            "name contains '.wav')";
        
        // Request only the name (title) and id fields to optimize performance
        listRequest.Fields = "nextPageToken, files(id, name)";
        listRequest.PageSize = 100;

        FileList result = listRequest.Execute();
        IList<Google.Apis.Drive.v3.Data.File> files = result.Files;

        List<Music> musics = new List<Music>();
        if (files != null)
        {
            foreach (var file in files)
            {
                musics.Add(new Music(file.Name, file.Id));
            }
        }
        return Task.FromResult(musics.ToArray()); // Return the first music file for demonstration
    }

    public async Task<(byte[] Content, string FileName, string MimeType)> DownloadMusicFileAsync(string fileID)
    {
        var metadataRequest = _driveService.Files.Get(fileID);
        metadataRequest.Fields = "name,mimeType";

        var metadata = await metadataRequest.ExecuteAsync();

        var downloadRequest = _driveService.Files.Get(fileID);

        using var memoryStream = new MemoryStream();

        await downloadRequest.DownloadAsync(memoryStream);

        return (
            memoryStream.ToArray(),
            metadata.Name,
            metadata.MimeType
        );
    }

    public async Task<byte[]> DownloadAllMusicFileAsync()
    {

        var downloadRequest = _driveService.Files.Get("1uaIrMoQw3d-KIh6w0M-QRviPrlr2Xeod"); // Replace with the actual file ID of your music database

        using var memoryStream = new MemoryStream();

        await downloadRequest.DownloadAsync(memoryStream);

        return (
            memoryStream.ToArray()
        );
    }

    public async Task DownloadMusicDBAsync(DriveService driveService, string destinationPath)
    {
        var request = driveService.Files.Get("1uaIrMoQw3d-KIh6w0M-QRviPrlr2Xeod"); // Replace with the actual file ID of your music database
        using (var fileStream = new FileStream(destinationPath, FileMode.Create, FileAccess.Write))
        {
            await request.DownloadAsync(fileStream);
        }
    }

    public async Task UploadFileAsync(DriveService driveService, string fileName, Stream fileStream)
    {
        var fileMetadata = new Google.Apis.Drive.v3.Data.File()
        {
            Name = fileName,
            Parents = new List<string> { "1uaIrMoQw3d-KIh6w0M-QRviPrlr2Xeod" } // Specify the folder ID
        };

        var request = driveService.Files.Create(fileMetadata, fileStream, "audio/mpeg");
        request.Fields = "id";
        await request.UploadAsync();
    }
}
