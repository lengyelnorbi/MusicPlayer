using API.Models;
using API.DTO;
using API.Utils;
using API.Models.RequestModels;

namespace API.Services.Interfaces;

public interface IUserService
{
    Task<PagedResult<UserDTO>> GetUsersAsync(int page, int limit);
    Task<bool> CreateUserAsync(UserDTO user);
    Task<UserDTO> GetUserByEmailAsync(string email);
    Task<UserDTO> GetUserByIdAsync(int id);
    Task<bool> UpdateUserAsync(UserUpdateDTO user);
}
