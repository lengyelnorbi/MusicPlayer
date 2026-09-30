using API.Models;

namespace API.Services.Interfaces;

public interface IAdvancedMsgQueueCommService
{
    Task SendMessageAsync(MusicUploadMessage message);
    MusicUploadMessage CreateMusicUploadMessage(string link);
}