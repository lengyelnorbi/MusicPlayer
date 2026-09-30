using Xunit;
using Xunit.Abstractions;
using Moq;
using API.Services.Interfaces;
using API.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using API.Services;
using API.Data;
using API.Utils;
using Microsoft.EntityFrameworkCore;

namespace MusicPlayer.Tests;

public class AuthControllerHttpTest
{
    // private MusicPlayerDbContext GetInMemoryDbContext()
    // {
    //     var options = new DbContextOptionsBuilder<MusicPlayerDbContext>()
    //         .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
    //         .Options;
        
    //     return new MusicPlayerDbContext(options);
    // }
    // private readonly ITestOutputHelper _output;

    // public AuthControllerHttpTest(ITestOutputHelper output)
    // {
    //     _output = output;
    // }

    // [Fact]
    // public void GetDeviceFingerprint_WithValidHeaders_ReturnsNonEmptyHash()
    // {
    //    // Arrange
    //     var mockUserService = new Mock<IUserService>();
    //     var mockAuthService = new Mock<IAuthService>();
    //     var deviceService = new DeviceService(); // Use real implementation for hashing
        
    //     var controller = new AuthController(mockAuthService.Object, mockUserService.Object, deviceService);

    //     var httpContext = new DefaultHttpContext();
    //     httpContext.Request.Headers["User-Agent"] = "Mozilla/5.0";
    //     httpContext.Request.Headers["Accept"] = "application/json";
    //     httpContext.Request.Headers["Accept-Encoding"] = "gzip";

    //     controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

    //     // Act
    //     string fingerprint = controller.GetDeviceFingerprint();

    //     // Assert
    //     _output.WriteLine($"Generated Fingerprint: {fingerprint}");
    //     Assert.NotNull(fingerprint);
    //     Assert.NotEmpty(fingerprint);
    // }

    // [Fact]
    // public void GetDeviceFingerprint_WithoutHttpContext_ReturnsEmpty()
    // {
    //     // Arrange
    //     var mockUserService = new Mock<IUserService>();
    //     var mockAuthService = new Mock<IAuthService>();
    //     var mockDeviceService = new Mock<IDeviceService>();
    //     var controller = new AuthController(mockAuthService.Object, mockUserService.Object, mockDeviceService.Object);
    //     // No HttpContext set

    //     // Act
    //     string fingerprint = controller.GetDeviceFingerprint();

    //     // Assert
    //     _output.WriteLine($"Generated Fingerprint: {fingerprint}");
    //     Assert.NotNull(fingerprint);
    //     Assert.Empty(fingerprint); // Should return empty string when no context
    // }

    // [Fact]
    // public void GetClientIp_WithXForwardedFor_ReturnsProxyIp()
    // {
    //     // Arrange
    //     var mockUserService = new Mock<IUserService>();
    //     var mockAuthService = new Mock<IAuthService>();
    //     var mockDeviceService = new Mock<IDeviceService>();
    //     var controller = new AuthController(mockAuthService.Object, mockUserService.Object, mockDeviceService.Object);

    //     var httpContext = new DefaultHttpContext();
    //     httpContext.Request.Headers["X-Forwarded-For"] = "192.168.1.100, 10.0.0.1";

    //     controller.ControllerContext = new ControllerContext
    //     {
    //         HttpContext = httpContext
    //     };

    //     // Act
    //     var ip = controller.GetClientIp(); // Call via reflection or make method public

    //     // Assert - would need to test private method or refactor
    //     _output.WriteLine($"Extracted IP: {ip}");
    //     Assert.Equal("192.168.1.100", ip);
    // }

    // [Fact]
    // public void Test()
    // {
    //     var mockUserService = new Mock<IUserService>();
    //     var passwordService = new Mock<IPasswordService>();
    //     var dbContext = GetInMemoryDbContext();
    //     var jwtSettings = new JwtSettings { SecretKey = "your-super-secret-key-change-this-in-production-must-be-at-least-32-characters-long!", Issuer = "TestIssuer", Audience = "TestAudience", ExpirationMinutes = 60 };
    //     var authService = new AuthService(mockUserService.Object, passwordService.Object, jwtSettings, dbContext);
    //     var token = authService.GenerateJwtToken(1, "test@example.com", "testuser", "User", "TestDevice", "192.168.1.1");
    //     var token2 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjEiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9lbWFpbGFkZHJlc3MiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvbmFtZSI6InRlc3R1c2VyIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiVXNlciIsIkRldmljZUlkIjoiVGVzdERldmljZSIsIklQQWRkcmVzcyI6IjE5Mi4xNjguMS4xIiwiVG9rZW5WZXJzaW9uIjoiMSIsImV4cCI6MTc3ODYzMTU3MCwiaXNzIjoiVGVzdElzc3VlciIsImF1ZCI6IlRlc3RBdWRpZW5jZSJ9.ReZA6sIKijLDOBlXP0QK_OHNLVZIc3-DQJ89VyhLwfE";
    //     _output.WriteLine($"Generated JWT Token: {token}");

    //     Assert.NotNull(token);
    //     Assert.NotEmpty(token);
    //     Assert.NotEqual(token, token2); // Each token should be unique due to JTI
    // }
}