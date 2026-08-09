public static class PhotoStorage
{
    private static readonly string PhotosDirectory =
        Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "photos");

    public static async Task<string> SaveAsync(IFormFile photo)
    {
        Directory.CreateDirectory(PhotosDirectory);

        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(photo.FileName)}";
        var filePath = Path.Combine(PhotosDirectory, fileName);

        await using var stream = File.Create(filePath);
        await photo.CopyToAsync(stream);

        return $"/photos/{fileName}";
    }
}
