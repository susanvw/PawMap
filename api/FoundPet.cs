public enum PetSpecies
{
    Dog,
    Cat,
    Other
}

public class FoundPet
{
    public int Id { get; set; }
    public PetSpecies Species { get; set; }
    public required string PhotoUrl { get; set; }
    public string? Comment { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public required string Status { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
