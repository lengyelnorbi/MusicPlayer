using API.Models;
using API.DTO;
using API.Utils;

namespace API.Services.Interfaces;

public interface ITokenService
{
    Task<PagedResult<AccessTokenUserDTO>> GetAccessTokensAsync(int page = 1, int limit = 10);
    Task<PagedResult<RefreshTokenUserDTO>> GetRefreshTokensAsync(int page = 1, int limit = 10);
    Task<bool> RevokeAccessTokenAsync(int tokenId);
    Task<bool> RevokeRefreshTokenAsync(int tokenId);
}
