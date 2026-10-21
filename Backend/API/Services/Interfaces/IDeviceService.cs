namespace API.Services.Interfaces;

public interface IDeviceService
{
    Task<bool> IsDeviceTrustedAsync(int userId, string deviceFingerprint);
    string GenerateFingerprint(string userAgent, string accept, string encoding);
    string ExtractClientIp(string xForwardedFor, string connectionIp);
}