using API.Models;
using API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using API.DTO;

namespace API.Data;

public class MusicPlayerDbContext : DbContext
{
    public MusicPlayerDbContext(DbContextOptions<MusicPlayerDbContext> options) : base(options)
    {
    }

    public DbSet<UserDTO> Users { get; set; } = null!;
    public DbSet<Music> Musics { get; set; } = null!;
    public DbSet<Playlist> Playlists { get; set; } = null!;
    public DbSet<UserPlaylist> UserPlaylists { get; set; } = null!;
    public DbSet<PlaylistMusic> PlaylistMusics { get; set; } = null!;
    public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;
    public DbSet<AccessToken> AccessTokens { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure User entity
        modelBuilder.Entity<UserDTO>(entity =>
        {
            entity.HasKey(e => e.ID);
            entity.Property(e => e.ID).ValueGeneratedOnAdd();
            entity.Property(e => e.Username).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.PasswordHash).HasMaxLength(255).IsRequired();
            entity.Property(e => e.RegisteredAt).HasDefaultValueSql("CURRENT_DATE");
            entity.Property(e => e.Role).HasMaxLength(50).HasDefaultValue("User");

            // Exclude Jti from database mapping
            entity.Ignore(e => e.Jti);
        });

        // Configure Music entity
        modelBuilder.Entity<Music>(entity =>
        {
            entity.HasKey(e => e.ID);
            entity.Property(e => e.ID).ValueGeneratedOnAdd();
            entity.Property(e => e.Title).HasMaxLength(255);
            entity.Property(e => e.File_id).HasMaxLength(255);
            entity.Property(e => e.AddedAt).HasDefaultValueSql("CURRENT_DATE");
            entity.Ignore(e => e.Playlists); // Ignore the Playlists property for database mapping
        });

        // Configure Playlist entity
        modelBuilder.Entity<Playlist>(entity =>
        {
            entity.HasKey(e => e.ID);
            entity.Property(e => e.ID).ValueGeneratedOnAdd();
            entity.Property(e => e.Name).HasMaxLength(255).IsRequired();
            entity.Property(e => e.MusicCount).HasDefaultValue(0);
            entity.Ignore(e => e.Musics); // Ignore the Musics property for database mapping
        });

        // Configure UserPlaylist join table entity
        modelBuilder.Entity<UserPlaylist>(entity =>
        {
            // Composite primary key
            entity.HasKey(e => new { e.UserID, e.PlaylistID });
            
            // Foreign key to User
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserID)
                .OnDelete(DeleteBehavior.Cascade);
            
            // Foreign key to Playlist
            entity.HasOne(e => e.Playlist)
                .WithMany()
                .HasForeignKey(e => e.PlaylistID)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure many-to-many relationship between Playlist and Music
        modelBuilder.Entity<PlaylistMusic>(entity =>{
                entity.HasKey(e => new { e.PlaylistID, e.MusicID });
                
                // Foreign key to Playlist
                entity.HasOne(e => e.Playlist)
                    .WithMany()
                    .HasForeignKey(e => e.PlaylistID)
                    .OnDelete(DeleteBehavior.Cascade);
                
                // Foreign key to Music
                entity.HasOne(e => e.Music)
                    .WithMany()
                    .HasForeignKey(e => e.MusicID)
                    .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.ID);
            entity.Property(e => e.UserID).IsRequired();
            entity.Property(e => e.ID).ValueGeneratedOnAdd();
            entity.Property(e => e.TokenHash).HasMaxLength(255).IsRequired();
            entity.Property(e => e.ExpiresAt).IsRequired();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_DATE");
            entity.Property(e => e.DeviceFingerprint).HasMaxLength(255);
            entity.Property(e => e.IpAddress).HasMaxLength(255);
            entity.Property(e => e.IsRevoked).HasDefaultValue(false);
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserID)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AccessToken>(entity =>
        {
            entity.HasKey(e => e.ID);
            entity.Property(e => e.ID).ValueGeneratedOnAdd();
            entity.Property(e => e.jti).HasMaxLength(255).IsRequired();
            entity.HasIndex(e => e.jti).IsUnique();
            entity.Property(e => e.UserID).IsRequired();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_DATE");
            entity.Property(e => e.ExpiresAt).IsRequired();
            entity.Property(e => e.DeviceFingerprint).HasMaxLength(255);
            entity.Property(e => e.IpAddress).HasMaxLength(255);
            entity.Property(e => e.IsRevoked).HasDefaultValue(false);
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserID)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
