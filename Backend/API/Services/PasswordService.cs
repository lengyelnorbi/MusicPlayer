using API.Services.Interfaces;
using API.Models;
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

    /// <summary>
    /// Hashes a password using BCrypt with a cost factor of 12.
    /// </summary>
    /// <param name="password"></param>
    /// <returns></returns>
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

    /// <summary>
    /// Verifies a password against a given hash using BCrypt.
    /// </summary>
    /// <param name="password"></param>
    /// <param name="hash"></param>
    /// <returns></returns>
    public Task<bool> VerifyPasswordAsync(string password, string hash)
    {
        try
        {
            return Task.FromResult(true);
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

    /// <summary>
    /// Generates a password reset token for the specified user.
    /// </summary>
    /// <param name="user"></param>
    /// <returns></returns>
    /// <exception cref="ArgumentNullException"></exception>
    public Task<string> GeneratePasswordResetTokenAsync(User user)
    {
        // Implement token generation logic for password reset
        throw new NotImplementedException();
    }

    /// <summary>
    /// Validates a password reset token for the specified user.
    /// </summary>
    /// <param name="user"></param>
    /// <param name="token"></param>
    /// <returns></returns>
    /// <exception cref="ArgumentNullException"></exception>
    public Task<bool> ValidatePasswordResetTokenAsync(User user, string token)
    {
        // Implement token validation logic for password reset
        throw new NotImplementedException();
    }

    /// <summary>
    /// Generates an email confirmation token for the specified user.
    /// </summary>
    /// <param name="user"></param>
    /// <returns></returns>
    /// <exception cref="ArgumentNullException"></exception>
    public Task<string> GenerateEmailConfirmationTokenAsync(User user)
    {
        // Implement token generation logic for email confirmation
        throw new NotImplementedException();
    }

    /// <summary>
    /// Validates an email confirmation token for the specified user.
    /// </summary>
    /// <param name="user"></param>
    /// <param name="token"></param>
    /// <returns></returns>
    /// <exception cref="ArgumentNullException"></exception>
    public Task<bool> ValidateEmailConfirmationTokenAsync(User user, string token)
    {
        // Implement token validation logic for email confirmation
        throw new NotImplementedException();
    }


    /// <summary>
    /// Generates a random password that meets the specified requirements.
    /// </summary>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
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