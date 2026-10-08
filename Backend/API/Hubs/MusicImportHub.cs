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

    public async Task JoinJob(Guid jobId)
    {
        var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
            throw new HubException("Unable to identify the current user.");

        var ownsJob = await _dbContext.ImportJobs
            .AsNoTracking()
            .AnyAsync(x => x.Id == jobId && x.UserId == userId);

        if (!ownsJob)
            throw new HubException("Import job not found.");

        await Groups.AddToGroupAsync(Context.ConnectionId, $"job:{jobId}");
    }

    public Task LeaveJob(Guid jobId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, $"job:{jobId}");
}
