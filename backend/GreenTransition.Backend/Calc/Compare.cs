namespace GreenTransition.Backend.Calc;

public static class Compare
{
    public static (int DefaultId, int BestId, double SavedKwh, double SavedCo2Kg) CompareRoutes(IReadOnlyList<RouteResult> results)
    {
        // normal route = first route from the map service
        var normal = results[0];
        // best route = route with the lowest energy
        var best = results.MinBy(route => route.ETotalKwh)!;
        // saved = normal route - best route
        return (
            normal.Id,
            best.Id,
            Math.Round(normal.ETotalKwh - best.ETotalKwh, 3),
            Math.Round(normal.Co2Kg - best.Co2Kg, 3));
    }
}
