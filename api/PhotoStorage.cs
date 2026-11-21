using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

public interface IPhotoStorage
{
    /// <summary>Stores the photo and returns the URL it can be loaded from.</summary>
    Task<string> SaveAsync(IFormFile photo, string extension);
}

/// <summary>
/// Saves photos to wwwroot/photos and returns a relative URL. For local
/// development only: on Render the disk is wiped on every deploy.
/// </summary>
public class LocalPhotoStorage : IPhotoStorage
{
    private static readonly string PhotosDirectory =
        Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "photos");

    public async Task<string> SaveAsync(IFormFile photo, string extension)
    {
        Directory.CreateDirectory(PhotosDirectory);

        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(PhotosDirectory, fileName);

        await using var stream = File.Create(filePath);
        await photo.CopyToAsync(stream);

        return $"/photos/{fileName}";
    }
}

/// <summary>
/// Uploads photos to Cloudinary and returns an absolute HTTPS URL.
/// Used whenever CLOUDINARY_URL is set.
/// </summary>
public class CloudinaryPhotoStorage(string cloudinaryUrl) : IPhotoStorage
{
    private readonly Cloudinary _cloudinary = new(cloudinaryUrl) { Api = { Secure = true } };

    public async Task<string> SaveAsync(IFormFile photo, string extension)
    {
        await using var stream = photo.OpenReadStream();
        var result = await _cloudinary.UploadAsync(new ImageUploadParams
        {
            File = new FileDescription($"{Guid.NewGuid()}{extension}", stream),
            Folder = "pawmap/found-pets",
        });

        if (result.Error is not null)
        {
            throw new InvalidOperationException($"Cloudinary upload failed: {result.Error.Message}");
        }

        return result.SecureUrl.ToString();
    }
}
