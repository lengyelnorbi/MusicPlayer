using API.Services.Interfaces;
using API.Models;
using BCrypt.Net;
using Microsoft.CodeAnalysis;

namespace API.Services;

public class PasswordService : IPasswordService
{
    private readonly ILogger<PasswordService> _logger = new Logger<PasswordService>(new LoggerFactory());
    private static readonly Random _random = Random.Shared;
    private const string UpperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private const string LowerChars = "abcdefghijklmnopqrstuvwxyz";
    private const string Numbers = "0123456789";
    private const string SpecialChars = "!@#$%^&*().,<>?";
    private const string AllChars = UpperChars + LowerChars + Numbers + SpecialChars;


    public PasswordService()
    {
    }

    public Task<string> HashPasswordAsync(string password)
    {
        try
        {
            // Hash the password using BCrypt with cost factor of 12 (default is recommended)
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);
            _logger.LogInformation("Password hashed successfully");
            return Task.FromResult(hashedPassword);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error hashing password");
            throw;
        }
    }

    public Task<bool> VerifyPasswordAsync(string password, string hash)
    {
        try
        {
            // Check if hash is valid before attempting verification
            if (string.IsNullOrEmpty(hash) || !hash.StartsWith("$2"))
            {
                _logger.LogWarning("Invalid password hash format");
                return Task.FromResult(false);
            }

            // Verify the password against the hash using BCrypt
            var isValid = BCrypt.Net.BCrypt.Verify(password, hash);
            _logger.LogInformation("Password verification completed: {Result}", isValid ? "Valid" : "Invalid");
            return Task.FromResult(isValid);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying password");
            return Task.FromResult(false);
        }
    }

    public Task<string> GeneratePasswordResetTokenAsync(User user)
    {
        // Implement token generation logic for password reset
        throw new NotImplementedException();
    }

    public Task<bool> ValidatePasswordResetTokenAsync(User user, string token)
    {
        // Implement token validation logic for password reset
        throw new NotImplementedException();
    }

    public Task<string> GenerateEmailConfirmationTokenAsync(User user)
    {
        // Implement token generation logic for email confirmation
        throw new NotImplementedException();
    }

    public Task<bool> ValidateEmailConfirmationTokenAsync(User user, string token)
    {
        // Implement token validation logic for email confirmation
        throw new NotImplementedException();
    }

    async public Task<string> GeneratePasswordAsync()
    {
        try
        {
            // Password requirements: at least 12 chars, 2+ numbers, uppercase, lowercase, 1-2 special chars
            var password = new List<char>
            {
                // Add at least 1 uppercase letter
                UpperChars[_random.Next(UpperChars.Length)],
                // Add at least 1 lowercase letter
                LowerChars[_random.Next(LowerChars.Length)],
                // Add at least 2 numbers
                Numbers[_random.Next(Numbers.Length)],
                Numbers[_random.Next(Numbers.Length)],
                // Add at least 1 special character
                SpecialChars[_random.Next(SpecialChars.Length)]
            };

            // Fill remaining 7 slots with random characters from all types
            for (int i = password.Count; i < 12; i++)
            {
                password.Add(AllChars[_random.Next(AllChars.Length)]);
            }

            // Fisher-Yates shuffle for better randomness
            char[] passwordArray = password.ToArray();
            for (int i = passwordArray.Length - 1; i > 0; i--)
            {
                int randomIndex = _random.Next(i + 1);
                (passwordArray[i], passwordArray[randomIndex]) = (passwordArray[randomIndex], passwordArray[i]);
            }

            return new string(passwordArray);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating password");
            return string.Empty;
        }
    }
}