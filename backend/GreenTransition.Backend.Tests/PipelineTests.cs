using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Logging.Abstractions;

namespace GreenTransition.Backend.Tests;

public class PipelineTests
{
    [Fact]
    public async Task NoApiKeyUsesDemoRoutes()
    {
        var result = await Pipeline.PlanRoutes(null, null, null, NullLogger.Instance);
        Assert.Equal("demo", result.DataSource);
        Assert.NotEmpty(result.Routes);
        Assert.Equal(result.Routes.MinBy(r => r.ETotalKwh)!.Id, result.BestId);
    }

    [Fact]
    public void ConfigLoadsEveryVehicleValue()
    {
        var vehicle = Inputs.Config.App.Vehicle;
        Assert.Equal(new Inputs.VehicleConfig("Polestar 2 Long Range Single Motor", 2070, 17.1, 0.85, 0.65), vehicle);
    }

    // The dashboard reads these exact names (frontend/src/lib/backendRoutes.js).
    [Fact]
    public async Task ResponseKeepsSnakeCaseFieldNames()
    {
        var result = await Pipeline.PlanRoutes(null, null, null, NullLogger.Instance);
        var json = JsonNode.Parse(JsonSerializer.Serialize(result, Json.Options))!.AsObject();

        Assert.Equal(
            ["data_source", "vehicle", "default_id", "best_id", "saved_kwh", "saved_co2_kg", "routes"],
            json.Select(p => p.Key));
        Assert.Equal(
            ["id", "coords", "distance_m", "duration_s", "climb_m", "descent_m",
             "e_flat_kwh", "e_up_kwh", "e_re_kwh", "e_total_kwh", "co2_kg"],
            json["routes"]![0]!.AsObject().Select(p => p.Key));
    }
}
