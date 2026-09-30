using API.Models;
using API.Services.Interfaces;
using API.Data;
using Microsoft.EntityFrameworkCore;
using API.DTO;
using API.Utils;
using API.Models.RequestModels;

namespace API.Services;

public class UserService : IUserService
{
    private readonly ILogger<UserService> _logger;
    private readonly MusicPlayerDbContext _dbContext;

    public UserService(ILogger<UserService> logger, MusicPlayerDbContext dbContext)
    {
        _logger = logger;
        _dbContext = dbContext;
    }

    public async Task<PagedResult<UserDTO>> GetUsersAsync(int page, int limit)
    {
        var query = _dbContext.Users
            .Select(u => new UserDTO
                {
                    ID = u.ID,
                    Username = u.Username,
                    Email = u.Email,
                    RegisteredAt = u.RegisteredAt,
                    Role = u.Role
                })
            .Where(u => u.Role != "Admin")
            .OrderBy(u => u.ID);
            

        var totalItemCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalItemCount / (double)limit);

        var items = await query
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(); 

        return new PagedResult<UserDTO>{
            Items = items,
            TotalItemCount = totalItemCount,
            TotalPages = totalPages,
        };
    }

    public async Task<bool> UpdateUserAsync(UserUpdateDTO user)
    {
        _logger.LogWarning("Updating user with ID: {UserID}, Email: {Email}, Username: {Username}", user.ID, user.Email, user.Username);
        try
        {
            var existingUser = await _dbContext.Users.FindAsync(user.ID);
            if (existingUser == null)
            {
                _logger.LogWarning($"User with ID {user.ID} not found");
                return false;
            }

            existingUser.Email = user.Email;
            existingUser.Username = user.Username;
            
            if(!string.IsNullOrEmpty(user.PasswordHash) && user.PasswordHash != null)
            {
                PasswordService passwordService = new PasswordService();
                string hashedPassword = await passwordService.HashPasswordAsync(user.PasswordHash); // Validate the password before updating
                existingUser.PasswordHash = hashedPassword; // Assuming the password is already hashed before being passed to this method
            }

            _dbContext.Users.Update(existingUser);
            await _dbContext.SaveChangesAsync();
            _logger.LogInformation("User updated successfully");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user");
            return false;
        }
    }

    public async Task<bool> CreateUserAsync(UserDTO user)
    {
        _logger.LogInformation(user.ToString());
        try
        {
            _dbContext.Users.Add(user);
            _logger.LogInformation(user.ToString());
            await _dbContext.SaveChangesAsync();
            _logger.LogInformation("User created successfully");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            return false;
        }
    }

    public async Task<UserDTO> GetUserByEmailAsync(string email)
    {
        _logger.LogInformation("Fetching user by email from database...");
        return await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == email) ?? throw new Exception("User not found");
    }

    public async Task<UserDTO> GetUserByIdAsync(int id)
    {
        _logger.LogInformation("Fetching user by ID from database...");
        return await _dbContext.Users.FirstOrDefaultAsync(u => u.ID == id) ?? throw new Exception("User not found");
    }
}