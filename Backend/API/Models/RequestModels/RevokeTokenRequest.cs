namespace API.Models.RequestModels;

public class RevokeTokenRequest : BaseRequest
{
    public int TokenID { get; set; }

    public RevokeTokenRequest(int tokenID, string source) : base(source)
    {
        TokenID = tokenID;
    }

}