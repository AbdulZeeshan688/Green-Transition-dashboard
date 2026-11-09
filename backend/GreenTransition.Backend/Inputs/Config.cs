using System.Text.Json;
using System.Text.Json.Serialization;

namespace GreenTransition.Backend.Inputs;

public record RouteConfig(double[] DefaultStart, double[] DefaultEnd, int Alternatives, bool UseDemoData);

public record VehicleConfig(
    string Name,
    double MassKg,
    [property: JsonPropertyName("consumption_kwh_100km")] double ConsumptionKwh100Km,
    double DriveEfficiency,
    double RegenEfficiency);

public record GridConfig(double CarbonGPerKwh);

public record PhysicsConfig(double G);

public record AppConfig(RouteConfig Route, VehicleConfig Vehicle, GridConfig Grid, PhysicsConfig Physics);

public static class Config
{
    public static readonly AppConfig App =
        JsonSerializer.Deserialize<AppConfig>(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "config.json")), Json.Options)!;

    public static string? LoadOrsApiKey() => Environment.GetEnvironmentVariable("ORS_API_KEY");
}
