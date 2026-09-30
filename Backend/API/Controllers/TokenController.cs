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
public class TokenController : ControllerBase
{
    private readonly ILogger<TokenController> _logger;
    private readonly ITokenService _tokenService;

    public TokenController(ILogger<TokenController> logger, ITokenService tokenService)
    {
        _logger = logger;
        _tokenService = tokenService;
    }

    [HttpGet("access-token", Name = "GetAccessTokens")]
    // [Authorize(Policy = "AdminSource")]
    public async Task<PagedResult<AccessTokenUserDTO>> GetAccessTokens([FromQuery] int page = 1, [FromQuery] int limit = 10)
    {
        _logger.LogInformation("Received request to fetch access tokens with pagination: page={Page}, limit={Limit}", page, limit);
        return await _tokenService.GetAccessTokensAsync(page, limit);
    }

    [HttpGet("refresh-token", Name = "GetRefreshTokens")]
    // [Authorize(Policy = "AdminSource")]
    public async Task<PagedResult<RefreshTokenUserDTO>> GetRefreshTokens([FromQuery] int page = 1, [FromQuery] int limit = 10)
    {
        _logger.LogInformation("Received request to fetch refresh tokens with pagination: page={Page}, limit={Limit}", page, limit);
        return await _tokenService.GetRefreshTokensAsync(page, limit);
    }

    [HttpPut("revoke-access-token", Name = "RevokeAccessToken")]
    [Authorize(Policy = "AdminSource")]
    public async Task<IActionResult> RevokeAccessToken([FromBody] RevokeTokenRequest request)
    {
        _logger.LogInformation("Received request to revoke access token: tokenId={TokenId}", request.TokenID);
        var result = await _tokenService.RevokeAccessTokenAsync(request.TokenID);
        if (result)
        {
            return Ok();
        }
        return NotFound();
    }

    [HttpPut("revoke-refresh-token", Name = "RevokeRefreshToken")]
    [Authorize(Policy = "AdminSource")]
    public async Task<IActionResult> RevokeRefreshToken([FromBody] RevokeTokenRequest request)
    {
        _logger.LogInformation("Received request to revoke refresh token: tokenId={TokenId}", request.TokenID);
        var result = await _tokenService.RevokeRefreshTokenAsync(request.TokenID);
        if (result)
        {
            return Ok();
        }
        return NotFound();
    }
}