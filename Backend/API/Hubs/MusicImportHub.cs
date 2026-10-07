using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace API.Hubs;

[Authorize]
public class MusicImportHub : Hub
{
    private readonly ILogger<MusicImportHub> _logger;

    public MusicImportHub(
        ILogger<MusicImportHub> logger)
    {
        _logger = logger;
    }

    public async Task JoinJob(Guid jobId)
    {
        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            $"job:{jobId}");

        _logger.LogInformation(
            "Connection {ConnectionId} joined job {JobId}",
            Context.ConnectionId,
            jobId);
    }

    public async Task LeaveJob(Guid jobId)
    {
        await Groups.RemoveFromGroupAsync(
            Context.ConnectionId,
            $"job:{jobId}");

        _logger.LogInformation(
            "Connection {ConnectionId} left job {JobId}",
            Context.ConnectionId,
            jobId);
    }

    public override async Task OnDisconnectedAsync(
        Exception? exception)
    {
        _logger.LogInformation(
            "SignalR connection disconnected: {ConnectionId}",
            Context.ConnectionId);

        await base.OnDisconnectedAsync(exception);
    }
}