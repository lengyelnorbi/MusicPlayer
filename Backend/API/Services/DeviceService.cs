using System.Security.Cryptography;
using System.Text;
using API.Services.Interfaces;

namespace API.Services;

public class DeviceService : IDeviceService
{
    public string GenerateFingerprint(string userAgent, string accept, string encoding)
    {
        //var raw = string.Join("|", userAgent ?? "", accept ?? "", encoding ?? ""); - original approach - accept and accept encoding can be empty on same device and cause different fingerprints for same device
        var raw = userAgent ?? "";
        using (var sha256 = SHA256.Create())
        {
            var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(raw));
            return Convert.ToBase64String(hash);
        }
    }

    public string ExtractClientIp(string xForwardedFor, string connectionIp)
    {
        return !string.IsNullOrEmpty(xForwardedFor) 
            ? xForwardedFor.Split(',').First().Trim() 
            : connectionIp ?? "Unknown";
    }

    public async Task<bool> IsDeviceTrustedAsync(int userId, string deviceFingerprint)
    {
        // Placeholder for actual implementation
        // In a real application, you would check the database for trusted devices associated with the user
        await Task.CompletedTask; // Simulate async work
        return false; // Default to not trusted for now
    }
}