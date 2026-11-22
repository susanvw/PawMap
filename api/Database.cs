using Npgsql;

public static class Database
{
    /// <summary>
    /// Reads the Postgres connection string from ConnectionStrings:Default,
    /// falling back to DATABASE_URL. Accepts both Npgsql key=value strings and
    /// the postgresql://user:pass@host/db URLs that Neon and Render hand out.
    /// </summary>
    public static string GetConnectionString(IConfiguration configuration)
    {
        var raw = configuration.GetConnectionString("Default")
            ?? configuration["DATABASE_URL"]
            ?? throw new InvalidOperationException(
                "No database configured. Set ConnectionStrings:Default (user secrets or the " +
                "ConnectionStrings__Default env var) or DATABASE_URL to your Neon connection string.");

        if (!raw.StartsWith("postgres://") && !raw.StartsWith("postgresql://"))
        {
            return raw;
        }

        var uri = new Uri(raw);
        var userInfo = uri.UserInfo.Split(':', 2);
        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort || uri.Port <= 0 ? 5432 : uri.Port,
            Database = uri.AbsolutePath.TrimStart('/'),
            Username = Uri.UnescapeDataString(userInfo[0]),
            Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : null,
        };

        // Carry over query options such as sslmode=require.
        foreach (var pair in uri.Query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var parts = pair.Split('=', 2);
            var key = Uri.UnescapeDataString(parts[0]);
            var value = parts.Length > 1 ? Uri.UnescapeDataString(parts[1]) : "";
            // Npgsql doesn't understand libpq's channel_binding option.
            if (key.Equals("channel_binding", StringComparison.OrdinalIgnoreCase)) continue;
            builder[key] = value;
        }

        return builder.ConnectionString;
    }
}
