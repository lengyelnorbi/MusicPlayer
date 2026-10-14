using API.Models;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Drive.v3;
using Google.Apis.Drive.v3.Data;
using Google.Apis.Services;

namespace API.Services.Interfaces;

public class GoogleDriveService : IGoogleDriveService
{
    private readonly DriveService _driveService;
    private readonly string folderID = "";
    
    /// <summary>
    /// Initializes a new instance of the GoogleDriveService class with the specified configuration.
    /// This constructor sets up the Google Drive API client using service account credentials and configures the folder ID for music storage. 
    /// It throws an ArgumentNullException if the folder ID is not configured in the provided configuration.
    /// </summary>
    /// <param name="configuration"></param>
    /// <exception cref="ArgumentNullException"></exception>
    public GoogleDriveService(IConfiguration configuration)
    {
        var credentialsPath = configuration["GOOGLE_APPLICATION_CREDENTIALS_PATH"];

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
        folderID = configuration["MusicStorage:GoogleDrive_FolderID"] ?? throw new ArgumentNullException("GoogleDrive_FolderID is not configured.");
    }

    /// <summary>
    /// Retrieves a stream of the file with the specified file ID from Google Drive.
    /// The method uses the Google Drive API to download the file and returns it as a MemoryStream. The stream's position is reset to the beginning before returning it.
    /// </summary>
    /// <param name="fileID"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task<Stream> GetFileStreamAsync(string fileID, CancellationToken cancellationToken = default)
    {
        var request = _driveService.Files.Get(fileID);

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

    /// <summary>
    /// Retrieves a list of music files from the specified Google Drive folder. The method filters for audio files and returns an array of Music objects containing the file names and IDs.
    /// </summary>
    /// <returns></returns>
    public async Task<Music[]> ListMusicFilesInFolder()
    {
        // Create a request to list files in the specified folder
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

        var musics = new List<Music>();
        string? pageToken = null;

        // Loop through pages of results to retrieve all music files in the folder
        do
        {
            listRequest.PageToken = pageToken;
            var result = await listRequest.ExecuteAsync();

            if (result.Files != null)
            {
                foreach (var file in result.Files)
                {
                    musics.Add(new Music(file.Name, file.Id));
                }
            }

            pageToken = result.NextPageToken;
        }
        while (!string.IsNullOrEmpty(pageToken));

        return musics.ToArray();
    }

    /// <summary>
    /// Downloads a music file from Google Drive by its file ID and returns the file content, name, and MIME type. 
    /// The method retrieves the file metadata to obtain the name and MIME type, then downloads the file content into a memory stream.
    /// </summary>
    /// <param name="fileID"></param>
    /// <returns></returns>
    public async Task<(byte[] Content, string FileName, string MimeType)> DownloadMusicFileAsync(string fileID)
    {
        // Retrieve the file metadata to get the name and MIME type
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

    /// <summary>
    /// Downloads all music files from the specified Google Drive folder and returns them as a single byte array.
    /// </summary>
    /// <returns></returns>
    public async Task<byte[]> DownloadAllMusicFileAsync()
    {

        var downloadRequest = _driveService.Files.Get(folderID);

        using var memoryStream = new MemoryStream();

        await downloadRequest.DownloadAsync(memoryStream);

        return (
            memoryStream.ToArray()
        );
    }

    /// <summary>
    /// Downloads the music database from Google Drive and saves it to the specified destination path.
    /// </summary>
    /// <param name="driveService"></param>
    /// <param name="destinationPath"></param>
    /// <returns></returns>
    public async Task DownloadMusicDBAsync(DriveService driveService, string destinationPath)
    {
        var request = driveService.Files.Get(folderID);
        // Download the file and save it to the specified destination path
        using (var fileStream = new FileStream(destinationPath, FileMode.Create, FileAccess.Write))
        {
            await request.DownloadAsync(fileStream);
        }
    }

    /// <summary>
    /// Uploads a file to Google Drive in the specified folder with the given file name and content stream. 
    /// The method creates a new file in Google Drive and uploads the provided content as an audio/mpeg file.
    /// </summary>
    /// <param name="driveService"></param>
    /// <param name="fileName"></param>
    /// <param name="fileStream"></param>
    /// <returns></returns>
    public async Task UploadFileAsync(DriveService driveService, string fileName, Stream fileStream)
    {
        // Create a new file metadata object with the specified name and parent folder ID
        var fileMetadata = new Google.Apis.Drive.v3.Data.File()
        {
            Name = fileName,
            Parents = new List<string> { folderID } // Specify the folder ID
        };

        var request = driveService.Files.Create(fileMetadata, fileStream, "audio/mpeg");
        request.Fields = "id";
        await request.UploadAsync();
    }
}
