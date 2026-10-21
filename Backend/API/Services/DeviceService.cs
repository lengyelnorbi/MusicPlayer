using System.Security.Cryptography;
using System.Text;
using API.Services.Interfaces;

namespace API.Services;

public class DeviceService : IDeviceService
{
    /// <summary>
    /// Generates a unique fingerprint for a device based on the provided user agent, accept header, and encoding.
    /// The fingerprint is created by hashing the concatenated string of these values using SHA256 and returning the Base64-encoded string representation of the hash.
    /// This fingerprint can be used to identify and track devices for security and authentication purposes.
    /// </summary>
    /// <param name="userAgent"></param>
    /// <param name="accept"></param>
    /// <param name="encoding"></param>
    /// <returns></returns>
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

    /// <summary>
    /// Extracts the client's IP address from the provided X-Forwarded-For header and connection IP address.
    /// If the X-Forwarded-For header is present, it takes precedence and the first IP address in the list is returned. 
    /// If the header is not present, the connection IP address is used. If both are unavailable, "Unknown" is returned.
    /// </summary>
    /// <param name="xForwardedFor"></param>
    /// <param name="connectionIp"></param>
    /// <returns></returns>
    public string ExtractClientIp(string xForwardedFor, string connectionIp)
    {
        return !string.IsNullOrEmpty(xForwardedFor) 
            ? xForwardedFor.Split(',').First().Trim() 
            : connectionIp ?? "Unknown";
    }
    
    /// <summary>
    /// Checks if a device is trusted for a specific user.
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="deviceFingerprint"></param>
    /// <returns></returns>
    public async Task<bool> IsDeviceTrustedAsync(int userId, string deviceFingerprint)
    {
        // Placeholder for actual implementation
        // In a real application, you would check the database for trusted devices associated with the user
        await Task.CompletedTask; // Simulate async work
        return false; // Default to not trusted for now
    }
}