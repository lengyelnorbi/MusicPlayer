using System.Security.Claims;
using API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace API.Hubs;

[Authorize]
public class MusicImportHub : Hub
{
    private readonly MusicPlayerDbContext _dbContext;

    public MusicImportHub(MusicPlayerDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>
    /// Allows a user to join a specific import job group.
    /// </summary>
    /// <param name="jobId"></param>
    /// <returns></returns>
    public async Task JoinJob(Guid jobId)
    {
        // Retrieve the user ID from the claims in the current context
        var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
        {
            throw new HubException("Unable to identify the current user.");
        }
        // Check if the user owns the import job with the specified jobId
        var ownsJob = await _dbContext.ImportJobs
            .AsNoTracking()
            .AnyAsync(x => x.Id == jobId && x.UserId == userId);

        if (!ownsJob)
        {
            throw new HubException("Import job not found.");
        }
        // Add the user to the SignalR group associated with the specified import job
        await Groups.AddToGroupAsync(Context.ConnectionId, $"job:{jobId}");
    }

    /// <summary>
    /// Allows a user to leave a specific import job group.
    /// </summary>
    /// <param name="jobId"></param>
    public Task LeaveJob(Guid jobId) => Groups.RemoveFromGroupAsync(Context.ConnectionId, $"job:{jobId}");
}
