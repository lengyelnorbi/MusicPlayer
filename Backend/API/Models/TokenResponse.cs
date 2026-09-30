namespace API.Models;

public class TokenResponse
{
    public string Token { get; set; }
    public string TokenType { get; set; }
    public int ExpiresIn { get; set; }

    public TokenResponse(string token, string tokenType, int expiresIn)
    {
        Token = token;
        TokenType = tokenType;
        ExpiresIn = expiresIn;
    }
}
