namespace API.Models.RequestModels;

public class BaseRequest
{
    public string Source { get; set; } // "admin" or "user"

    public BaseRequest(string source)
    {
        Source = source;
    }
   
}