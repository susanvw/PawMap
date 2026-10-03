using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();
}

app.UseStaticFiles();

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

app.MapPost("/found-pets", async ([FromForm] CreateFoundPetRequest request, AppDbContext db) =>
{
    if (!Enum.TryParse<PetSpecies>(request.Species, ignoreCase: true, out var species))
    {
        return Results.BadRequest($"Species must be one of: {string.Join(", ", Enum.GetNames<PetSpecies>())}");
    }

    var photoUrl = await PhotoStorage.SaveAsync(request.Photo);

    var foundPet = new FoundPet
    {
        Species = species,
        PhotoUrl = photoUrl,
        Comment = request.Comment,
        Latitude = request.Latitude,
        Longitude = request.Longitude,
        Status = "Found",
        CreatedAt = DateTimeOffset.UtcNow
    };

    db.FoundPets.Add(foundPet);
    await db.SaveChangesAsync();

    return Results.Created($"/found-pets/{foundPet.Id}", foundPet);
}).DisableAntiforgery();

app.MapGet("/found-pets", async (AppDbContext db) =>
    Results.Ok(await db.FoundPets.OrderByDescending(p => p.CreatedAt).ToListAsync()));

app.MapGet("/found-pets/{id:int}", async (int id, AppDbContext db) =>
    await db.FoundPets.FindAsync(id) is { } foundPet
        ? Results.Ok(foundPet)
        : Results.NotFound());

app.Run();

public class CreateFoundPetRequest
{
    public required string Species { get; set; }
    public string? Comment { get; set; }
    public required double Latitude { get; set; }
    public required double Longitude { get; set; }
    public required IFormFile Photo { get; set; }
}
