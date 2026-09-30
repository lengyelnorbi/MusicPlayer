using API.Models;

namespace API.Services.Interfaces;

public interface IPasswordService
{
    Task<string> HashPasswordAsync(string password);
    Task<bool> VerifyPasswordAsync(string password, string hash);
    Task<string> GeneratePasswordResetTokenAsync(User user);
    Task<bool> ValidatePasswordResetTokenAsync(User user, string token);
    Task<string> GenerateEmailConfirmationTokenAsync(User user);
    Task<bool> ValidateEmailConfirmationTokenAsync(User user, string token);
    Task<string> GeneratePasswordAsync();
}