using Microsoft.AspNetCore.Mvc;
using API.Models.RequestModels;
using API.Models;
using API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using API.DTO;
using API.Utils;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly ILogger<UserController> _logger;
    private readonly IUserService _userService;
    private readonly IPasswordService _passwordService;

    public UserController(ILogger<UserController> logger, IUserService userService, IPasswordService passwordService)
    {
        _logger = logger;
        _userService = userService;
        _passwordService = passwordService;
    }

    /// <summary>
    /// Retrieves a paginated list of users.
    /// This endpoint is protected and requires the "AdminSource" policy for access.
    /// </summary>
    /// <param name="page"></param>
    /// <param name="limit"></param>
    /// <returns></returns>
    [HttpGet("", Name = "GetUsers")]
    [Authorize(Policy = "AdminSource")]
    public async Task<PagedResult<UserDTO>> Get(int page, int limit)
    {
        // Fetch the paginated list of users using the user service
        return await _userService.GetUsersAsync(page, limit);
    }

    /// <summary>
    /// Creates a new user with the provided details.
    /// This endpoint is protected and requires the "AdminSource" policy for access.
    /// </summary>
    /// <param name="user"></param>
    /// <returns></returns>
    [HttpPost("", Name = "CreateUser")]
    [Authorize(Policy = "AdminSource")]
    public async Task<IActionResult> CreateUserAsync([FromBody] CreateUserRequest user)
    {
        try
        {
            if(user.UserDTO == null || string.IsNullOrEmpty(user.UserDTO.Username) || string.IsNullOrEmpty(user.UserDTO.Email) || string.IsNullOrEmpty(user.UserDTO.PasswordHash))
            {
                return BadRequest("Invalid user data");
            }
            // Hash the password before creating the user
            user.UserDTO.PasswordHash = await _passwordService.HashPasswordAsync(user.UserDTO.PasswordHash);
            // Create the new user using the user service
            bool success = await _userService.CreateUserAsync(user.UserDTO);
            if (!success)
            {
                return BadRequest("Failed to create user");
            }
            _logger.LogInformation(user.UserDTO.ToString());
            return StatusCode(201, "User created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Updates an existing user with the provided details.
    /// This endpoint is protected and requires the "AdminSource" policy for access.
    /// </summary>
    /// <param name="user"></param>
    /// <returns></returns>
    [HttpPut("", Name = "UpdateUser")]
    [Authorize(Policy = "AdminSource")]
    public async Task<IActionResult> UpdateUserAsync([FromBody] UpdateUserRequest user)
    {
         try
        {
            if (user?.UserUpdateDTO == null)
            {
                return BadRequest("Invalid user data");
            }
            _logger.LogInformation("Updating user with ID {UserID}.", user.UserUpdateDTO.ID);
            if (user.UserUpdateDTO.Email == null || user.UserUpdateDTO.Username == null|| string.IsNullOrEmpty(user.UserUpdateDTO.Email) || string.IsNullOrEmpty(user.UserUpdateDTO.Username))
            {
                return BadRequest("Invalid user data");
            }
            // Hash the password if it's provided before updating the user
            bool success = await _userService.UpdateUserAsync(user.UserUpdateDTO);
            if (!success)
            {
                return BadRequest("Failed to update user");
            }

            return StatusCode(200, "User updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user");
            return StatusCode(500, "Internal server error");
        }
    }
}