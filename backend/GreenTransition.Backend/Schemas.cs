using System.Text.Json;

namespace GreenTransition.Backend;

public record RouteRequest(double[]? Start, double[]? End);

public record RouteResult(
    int Id,
    double[][] Coords,
    double DistanceM,
    double DurationS,
    double ClimbM,
    double DescentM,
    double EFlatKwh,
    double EUpKwh,
    double EReKwh,
    double ETotalKwh,
    double Co2Kg);

public record RoutesResponse(
    string DataSource,
    string Vehicle,
    int DefaultId,
    int BestId,
    double SavedKwh,
    double SavedCo2Kg,
    IReadOnlyList<RouteResult> Routes);

public static class Json
{
    public static readonly JsonSerializerOptions Options = new() { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower };
}
