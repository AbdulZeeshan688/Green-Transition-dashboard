using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Logging;

namespace GreenTransition.Backend.Inputs;

public record OrsRoute(double DistanceM, double DurationS, double[][] Coords);

public static class Ors
{
    const string OrsUrl = "https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson";
    static readonly List<OrsRoute> DemoRoutes =
        ParseRoutes(JsonNode.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "data", "demo_routes.json")))!);
    static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(10) };

    public static async Task<(List<OrsRoute> Routes, string DataSource)> GetRoutes(
        double[] start, double[] end, RouteConfig routeConfig, string? apiKey, ILogger logger)
    {
        if (routeConfig.UseDemoData || string.IsNullOrEmpty(apiKey))
            return (DemoRoutes, "demo");
        try
        {
            return (ParseRoutes(await RequestRoutes(start, end, routeConfig.Alternatives, apiKey)), "ors");
        }
        catch (Exception error) when (error is HttpRequestException or TaskCanceledException)
        {
            logger.LogWarning("ORS request failed, using demo data: {Error}", error.Message);
            return (DemoRoutes, "demo");
        }
    }

    static async Task<JsonNode> RequestRoutes(double[] start, double[] end, int alternatives, string apiKey)
    {
        try
        {
            return await RequestOrs(start, end, alternatives, apiKey);
        }
        catch (HttpRequestException error) when (error.StatusCode is not null)
        {
            return await RequestOrs(start, end, 1, apiKey);
        }
    }

    static async Task<JsonNode> RequestOrs(double[] start, double[] end, int alternatives, string apiKey)
    {
        var body = new Dictionary<string, object> { ["coordinates"] = new[] { start, end }, ["elevation"] = true };
        if (alternatives > 1)
            body["alternative_routes"] = new { target_count = alternatives };
        using var request = new HttpRequestMessage(HttpMethod.Post, OrsUrl) { Content = JsonContent.Create(body) };
        request.Headers.TryAddWithoutValidation("Authorization", apiKey);
        using var response = await Http.SendAsync(request);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<JsonNode>())!;
    }

    static List<OrsRoute> ParseRoutes(JsonNode raw) =>
        raw["features"]!.AsArray().Select(feature =>
        {
            var summary = feature!["properties"]!["summary"]!;
            return new OrsRoute(
                summary["distance"]!.GetValue<double>(),
                summary["duration"]!.GetValue<double>(),
                feature["geometry"]!["coordinates"].Deserialize<double[][]>()!);
        }).ToList();
}
