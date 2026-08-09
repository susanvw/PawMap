using Microsoft.EntityFrameworkCore;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<FoundPet> FoundPets => Set<FoundPet>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<FoundPet>()
            .Property(p => p.Species)
            .HasConversion<string>();
    }
}
