using GreenTransition.Backend.Calc;
using GreenTransition.Backend.Inputs;
using Microsoft.Extensions.Logging;

namespace GreenTransition.Backend;

public static class Pipeline
{
    public static async Task<RoutesResponse> PlanRoutes(double[]? start, double[]? end, string? apiKey, ILogger logger)
    {
        var cfg = Config.App;
        start ??= cfg.Route.DefaultStart;
        end ??= cfg.Route.DefaultEnd;

        var (routes, dataSource) = await Ors.GetRoutes(start, end, cfg.Route, apiKey, logger);
        var results = routes.Select((route, routeId) => CalculateRoute(routeId, route, cfg)).ToList();
        var (defaultId, bestId, savedKwh, savedCo2Kg) = Compare.CompareRoutes(results);

        return new RoutesResponse(dataSource, cfg.Vehicle.Name, defaultId, bestId, savedKwh, savedCo2Kg, results);
    }

    static RouteResult CalculateRoute(int routeId, OrsRoute route, AppConfig cfg)
    {
        var vehicle = cfg.Vehicle;
        var g = cfg.Physics.G;

        var (climbM, descentM) = Elevation.ClimbAndDescent(route.Coords);
        var eFlat = Energy.FlatEnergyKwh(route.DistanceM, vehicle.ConsumptionKwh100Km);
        var eUp = Energy.ClimbEnergyKwh(climbM, vehicle.MassKg, g, vehicle.DriveEfficiency);
        var eRe = Energy.RegenEnergyKwh(descentM, vehicle.MassKg, g, vehicle.RegenEfficiency);
        var eTotal = Energy.TotalEnergyKwh(eFlat, eUp, eRe);
        var co2 = Carbon.Co2Kg(eTotal, cfg.Grid.CarbonGPerKwh);

        return new RouteResult(
            routeId,
            route.Coords,
            route.DistanceM,
            route.DurationS,
            Math.Round(climbM, 1),
            Math.Round(descentM, 1),
            Math.Round(eFlat, 3),
            Math.Round(eUp, 3),
            Math.Round(eRe, 3),
            Math.Round(eTotal, 3),
            Math.Round(co2, 3));
    }
}
