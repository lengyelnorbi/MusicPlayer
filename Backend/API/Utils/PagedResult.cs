namespace API.Utils;
public class PagedResult<T>
{
    public int TotalItemCount { get; set; }
    public int TotalPages { get; set; }
    public IEnumerable<T> Items { get; set; } = [];
}