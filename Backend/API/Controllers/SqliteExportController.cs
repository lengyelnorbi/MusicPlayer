using API.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/mobile")]
public sealed class SqliteExportController : ControllerBase
{
    private readonly MusicPlayerDbContext _db;
    public SqliteExportController(MusicPlayerDbContext db) => _db = db;

    private static readonly (string JsonName, Type ClrType)[] AllowedEntities =
    {
        ("user", typeof(API.DTO.UserDTO)),
        ("music", typeof(API.Models.Music)),
        ("playlist", typeof(API.Models.Playlist)),
        ("userplaylist", typeof(API.Models.UserPlaylist)),
        ("playlistmusics", typeof(API.Models.PlaylistMusic))
    };

    [Authorize]
    [HttpGet("sqlite-export")]
    public async Task<IActionResult> Export(CancellationToken cancellationToken)
    {
        // Never trust a user ID supplied by the client. Resolve it from the
        // validated access token so users cannot export another account's data.
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        if (userIdClaim is null || !int.TryParse(userIdClaim.Value, out var userId) || userId <= 0)
            return Unauthorized("The access token does not contain a valid user ID.");

        var userExists = await _db.Users.AsNoTracking().AnyAsync(u => u.ID == userId, cancellationToken);
        if (!userExists)
            return NotFound("User was not found.");

        var playlistIds = await _db.UserPlaylists.AsNoTracking()
            .Where(up => up.UserID == userId)
            .Select(up => up.PlaylistID)
            .Distinct()
            .ToListAsync(cancellationToken);

        var tables = new List<object>();

        foreach (var (jsonName, clrType) in AllowedEntities)
        {
            var entityType = _db.Model.FindEntityType(clrType);
            if (entityType is null)
                return Problem($"Entity {clrType.Name} is not mapped by MusicPlayerDbContext.");

            var storeObject = StoreObjectIdentifier.Create(entityType, StoreObjectType.Table);
            if (storeObject is null)
                return Problem($"Entity {clrType.Name} is not mapped to a table.");

            // Password hashes and other authentication secrets must never be
            // copied into a client-side database snapshot.
            var exportProperties = entityType.GetProperties()
                .Where(p => p.GetColumnName(storeObject.Value) is not null)
                .Where(p => clrType != typeof(API.DTO.UserDTO) ||
                    !new[] { "PasswordHash", "Password", "Jti", "RefreshToken", "TokenHash", "Secret", "Salt" }
                        .Contains(p.Name, StringComparer.OrdinalIgnoreCase))
                .ToList();

            var columns = exportProperties
                .Select(p => new
                {
                    name = p.GetColumnName(storeObject.Value)!,
                    dataType = p.GetRelationalTypeMapping().StoreType,
                    nullable = p.IsNullable
                }).ToList();

            var primaryKeyNames = entityType.FindPrimaryKey()?.Properties
                .Select(p => p.GetColumnName(storeObject.Value)!).ToArray() ?? Array.Empty<string>();

            var foreignKeys = entityType.GetForeignKeys().Select(fk =>
            {
                var principal = fk.PrincipalEntityType;
                var principalStore = StoreObjectIdentifier.Create(principal, StoreObjectType.Table);
                return new
                {
                    columns = fk.Properties.Select(p => p.GetColumnName(storeObject.Value)!).ToArray(),
                    referencedTable = PrincipalAlias(principal.ClrType),
                    referencedColumns = fk.PrincipalKey.Properties
                        .Select(p => principalStore is null ? p.Name : p.GetColumnName(principalStore.Value)!)
                        .ToArray(),
                    onDelete = MapDeleteAction(fk.DeleteBehavior),
                    onUpdate = "NO ACTION"
                };
            }).ToList();

            var entities = await LoadEntitiesAsync(clrType, userId, playlistIds, cancellationToken);
            var rows = new List<Dictionary<string, object?>>(entities.Count);
            foreach (var entity in entities)
            {
                var row = new Dictionary<string, object?>(StringComparer.Ordinal);
                foreach (var property in exportProperties)
                {
                    var columnName = property.GetColumnName(storeObject.Value);
                    if (columnName is null) continue;
                    var value = _db.Entry(entity).Property(property.Name).CurrentValue;
                    row[columnName] = NormalizeJsonValue(value);
                }
                rows.Add(row);
            }

            tables.Add(new { name = jsonName, columns, primaryKey = primaryKeyNames, foreignKeys, rows });
        }

        return Ok(new { schemaVersion = 1, tables });
    }

    private async Task<List<object>> LoadEntitiesAsync(
        Type clrType,
        int userId,
        List<int> playlistIds,
        CancellationToken ct)
    {
        if (clrType == typeof(API.DTO.UserDTO))
            return (await _db.Users.AsNoTracking().Where(u => u.ID == userId).ToListAsync(ct)).Cast<object>().ToList();
        if (clrType == typeof(API.Models.Music)) 
            return (await _db.Musics.AsNoTracking().ToListAsync(ct)).Cast<object>().ToList();
        if (clrType == typeof(API.Models.Playlist))
            return (await _db.Playlists.AsNoTracking().Where(p => playlistIds.Contains(p.ID)).ToListAsync(ct)).Cast<object>().ToList();
        if (clrType == typeof(API.Models.UserPlaylist))
            return (await _db.UserPlaylists.AsNoTracking().Where(up => up.UserID == userId).ToListAsync(ct)).Cast<object>().ToList();
        if (clrType == typeof(API.Models.PlaylistMusic))
            return (await _db.PlaylistMusics.AsNoTracking().Where(pm => playlistIds.Contains(pm.PlaylistID)).ToListAsync(ct)).Cast<object>().ToList();
        throw new InvalidOperationException("Entity is not on the export allow-list.");
    }

    private static string PrincipalAlias(Type type)
    {
        if (type == typeof(API.DTO.UserDTO)) return "user";
        if (type == typeof(API.Models.Music)) return "music";
        if (type == typeof(API.Models.Playlist)) return "playlist";
        if (type == typeof(API.Models.UserPlaylist)) return "userplaylist";
        if (type == typeof(API.Models.PlaylistMusic)) return "playlistmusics";
        return type.Name.ToLowerInvariant();
    }

    private static object? NormalizeJsonValue(object? value)
    {
        if (value is null) return null;
        if (value is DateOnly dateOnly) return dateOnly.ToString("yyyy-MM-dd");
        if (value is TimeOnly timeOnly) return timeOnly.ToString("HH:mm:ss.fffffff");
        if (value is DateTime dt) return dt.ToString("O");
        if (value is DateTimeOffset dto) return dto.ToString("O");
        if (value is byte[] bytes) return Convert.ToBase64String(bytes);
        if (value is Enum enumValue) return enumValue.ToString();
        if (value is ulong ulongValue) return ulongValue.ToString();
        return value;
    }

    private static string MapDeleteAction(DeleteBehavior behavior) => behavior switch
    {
        DeleteBehavior.Cascade => "CASCADE",
        DeleteBehavior.SetNull => "SET NULL",
        DeleteBehavior.Restrict => "RESTRICT",
        _ => "NO ACTION"
    };
}
