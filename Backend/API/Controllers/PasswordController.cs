using API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using API.Models.RequestModels;
using API.Utils;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PasswordController : ControllerBase
{
    private readonly ILogger<PasswordController> _logger;
    private readonly JwtSettings _jwtSettings;
    private readonly IWebHostEnvironment _environment;
    private readonly IPasswordService _passwordService;

    public PasswordController(ILogger<PasswordController> logger, JwtSettings jwtSettings, IWebHostEnvironment environment, IPasswordService passwordService)
    {
        _logger = logger;
        _jwtSettings = jwtSettings;
        _environment = environment;
        _passwordService = passwordService;
    }


    [Authorize]
    [HttpPost("generate-password", Name = "GeneratePassword")]
    public async Task<IActionResult> GeneratePassword()
    {
        var password = await _passwordService.GeneratePasswordAsync();
        return Ok(new { Password = password });
    }
   
}