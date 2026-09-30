using Xunit;
using API.Services;
using Microsoft.Extensions.Logging;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Xunit.Abstractions;

namespace MusicPlayer.Tests;

public class PasswordServiceTests
{
    private readonly ITestOutputHelper _output;

    public PasswordServiceTests(ITestOutputHelper output)
    {
        _output = output;
    }


    [Fact]
    public async Task PasswordAutoGeneration_Test()
    {
        // Arrange
        var passwordService = new PasswordService();
    
        // Act
        string generatedPassword = await passwordService.GeneratePasswordAsync();

        // Assert
        Assert.NotNull(generatedPassword);
        Assert.NotEmpty(generatedPassword);
        Assert.True(generatedPassword.Length >= 8, "Generated password should be at least 8 characters long");
        Assert.Matches(@"[A-Z]", generatedPassword); // Contains uppercase
        Assert.Matches(@"[a-z]", generatedPassword); // Contains lowercase
        Assert.Matches(@"[0-9]", generatedPassword); // Contains digit
        Assert.Matches(@"[!@#$%^&*().,<>?]", generatedPassword); // Contains special character
    }   

    [Fact]
    public async Task PasswordHashing_Test()
    {
        // Arrange
        var passwordService = new PasswordService();
        string password = "admin1234";

        // Act
        string hashedPassword = await passwordService.HashPasswordAsync(password);
        _output.WriteLine($"Original Password: {password}");
        _output.WriteLine($"Hashed Password: {hashedPassword}");

        // Assert
        Assert.NotNull(hashedPassword);
        Assert.NotEmpty(hashedPassword);
        Assert.NotEqual(password, hashedPassword); // Ensure the hashed password is different from the original
    }

    [Fact]
    public async Task VerifyPasswordTrue_Test()
    {
        // Arrange
        var passwordService = new PasswordService();
        string password = "497#I2Mk#hwX";
        string hashedPassword = await passwordService.HashPasswordAsync(password);

        // Act
        bool verificationResult = await passwordService.VerifyPasswordAsync(password, hashedPassword);

        // Assert
        Assert.True(verificationResult, "Password verification should succeed for the correct password");
    }

    [Fact]
    public async Task VerifyPasswordFalse_Test()
    {
        // Arrange
        var passwordService = new PasswordService();
        string password = "497#I2Mk#hwX";
        string badPassword = "wrongpassword";
        string hashedPassword = await passwordService.HashPasswordAsync(password);

        // Act
        bool verificationResult = await passwordService.VerifyPasswordAsync(badPassword, hashedPassword);

        // Assert
        Assert.False(verificationResult, "Password verification should fail for the wrong password");
    }
}
