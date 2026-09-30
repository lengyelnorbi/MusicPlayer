using Xunit;
using Moq;
using API.Services;
using API.Data;
using API.DTO;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;

namespace MusicPlayer.Tests;

public class UserServiceTests
{
    private MusicPlayerDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<MusicPlayerDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        return new MusicPlayerDbContext(options);
    }

    // [Fact]
    // public async Task CreateUserAsync_WithValidUser_ReturnsTrue()
    // {
    //     // Arrange
    //     var mockLogger = new Mock<ILogger<UserService>>();
    //     var dbContext = GetInMemoryDbContext();
        
    //     var newUser = new UserDTO("testuser", "test@example.com", "hashedPassword123", null);
    //     var userService = new UserService(mockLogger.Object, dbContext);

    //     // Act
    //     var result = await userService.CreateUserAsync(newUser);
    //     var userInDb = await dbContext.Users.FirstOrDefaultAsync(u => u.Username == "testuser");

    //     // Assert
    //     Assert.True(result);
    //     Assert.NotNull(userInDb);
    //     Assert.Equal("test@example.com", userInDb.Email);
    // }

    // [Fact]
    // public async Task CreateUserAsync_MultipleUsers_AllSavedSuccessfully()
    // {
    //     // Arrange
    //     var mockLogger = new Mock<ILogger<UserService>>();
    //     var dbContext = GetInMemoryDbContext();
    //     var userService = new UserService(mockLogger.Object, dbContext);
        
    //     var user1 = new UserDTO("user1", "user1@example.com", "hash1", null);
    //     var user2 = new UserDTO("user2", "user2@example.com", "hash2", null);

    //     // Act
    //     var result1 = await userService.CreateUserAsync(user1);
    //     var result2 = await userService.CreateUserAsync(user2);

    //     // Assert
    //     Assert.True(result1);
    //     Assert.True(result2);
    //     var allUsers = await dbContext.Users.ToListAsync();
    //     Assert.Equal(2, allUsers.Count);
    // }

    // [Fact]
    // public async Task CreateUserAsync_DuplicateUser_ReturnsFalse()
    // {
    //     // Arrange
    //     var mockLogger = new Mock<ILogger<UserService>>();
    //     var dbContext = GetInMemoryDbContext();
    //     var userService = new UserService(mockLogger.Object, dbContext);
    //     var user = new UserDTO("testuser", "test@example.com", "hash123", null);
    //     var duplicateUser = new UserDTO("testuser2", "test@example.com", "hash456", null);

    //     // Act
    //     var firstUserResult = await userService.CreateUserAsync(user);
    //     var getFirstUser = await dbContext.Users.FirstOrDefaultAsync(u => u.Email == "test@example.com");
    //     Assert.NotNull(getFirstUser); // Ensure the first user was created
    //     Console.WriteLine($"First user created with ID: {getFirstUser.ID}");

    //     var duplicateUserResult = await userService.CreateUserAsync(duplicateUser);
    //     var getDuplicateUser = await dbContext.Users.Where(u => u.Email == "test@example.com").ToListAsync();
    //     Assert.Single(getDuplicateUser); // Ensure the duplicate user was not created

    //     // Assert - This depends on your DB constraints
    //     // If email is unique, this should fail
    //     Assert.True(firstUserResult);
    //     Assert.False(duplicateUserResult);
    // }
}