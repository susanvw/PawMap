using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Render tells the service which port to listen on through PORT.
if (Environment.GetEnvironmentVariable("PORT") is { Length: > 0 } port)
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(Database.GetConnectionString(builder.Configuration)));

// Photos go to Cloudinary when CLOUDINARY_URL is set (production), otherwise to local disk.
builder.Services.AddSingleton<IPhotoStorage>(
    builder.Configuration["CLOUDINARY_URL"] is { Length: > 0 } cloudinaryUrl
        ? new CloudinaryPhotoStorage(cloudinaryUrl)
        : new LocalPhotoStorage());

builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();
}

app.UseStaticFiles();

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

app.MapPost("/found-pets", async ([FromForm] CreateFoundPetRequest request, AppDbContext db, IPhotoStorage photoStorage) =>
{
    var errors = FoundPetValidation.Validate(request, out var species, out var extension);
    if (errors.Count > 0)
    {
        return Results.ValidationProblem(errors);
    }

    var photoUrl = await photoStorage.SaveAsync(request.Photo, extension);

    var foundPet = new FoundPet
    {
        Species = species,
        PhotoUrl = photoUrl,
        Comment = string.IsNullOrWhiteSpace(request.Comment) ? null : request.Comment.Trim(),
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

public static class FoundPetValidation
{
    public const long MaxPhotoBytes = 10 * 1024 * 1024;
    public const int MaxCommentLength = 500;

    // The stored file extension comes from this list, never from the uploaded file name.
    private static readonly Dictionary<string, string> AllowedPhotoTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        ["image/jpeg"] = ".jpg",
        ["image/png"] = ".png",
        ["image/webp"] = ".webp",
        ["image/heic"] = ".heic",
    };

    public static Dictionary<string, string[]> Validate(
        CreateFoundPetRequest request, out PetSpecies species, out string extension)
    {
        var errors = new Dictionary<string, string[]>();
        extension = "";

        if (!Enum.TryParse(request.Species, ignoreCase: true, out species) || !Enum.IsDefined(species))
        {
            errors["species"] = [$"Species must be one of: {string.Join(", ", Enum.GetNames<PetSpecies>())}"];
        }

        if (request.Latitude is < -90 or > 90 || double.IsNaN(request.Latitude))
        {
            errors["latitude"] = ["Latitude must be between -90 and 90."];
        }

        if (request.Longitude is < -180 or > 180 || double.IsNaN(request.Longitude))
        {
            errors["longitude"] = ["Longitude must be between -180 and 180."];
        }

        if (request.Comment is { Length: > MaxCommentLength })
        {
            errors["comment"] = [$"Comment must be {MaxCommentLength} characters or fewer."];
        }

        if (request.Photo.Length == 0)
        {
            errors["photo"] = ["Photo is empty."];
        }
        else if (request.Photo.Length > MaxPhotoBytes)
        {
            errors["photo"] = ["Photo must be 10 MB or smaller."];
        }
        else if (!AllowedPhotoTypes.TryGetValue(request.Photo.ContentType ?? "", out extension!))
        {
            extension = "";
            errors["photo"] = ["Photo must be a JPEG, PNG, WebP or HEIC image."];
        }

        return errors;
    }
}
