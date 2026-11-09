using GreenTransition.Backend.Calc;

namespace GreenTransition.Backend.Tests;

public class CompareTests
{
    static RouteResult Route(int id, double eTotalKwh, double co2Kg) => new(id, [], 0, 0, 0, 0, 0, 0, 0, eTotalKwh, co2Kg);

    [Fact]
    public void PicksLowestEnergy()
    {
        var summary = Compare.CompareRoutes([Route(0, 5.0, 0.25), Route(1, 4.0, 0.20), Route(2, 6.0, 0.30)]);
        Assert.Equal(0, summary.DefaultId);
        Assert.Equal(1, summary.BestId);
        Assert.Equal(1.0, summary.SavedKwh, 1e-9);
        Assert.Equal(0.05, summary.SavedCo2Kg, 1e-9);
    }

    [Fact]
    public void SingleRouteSavesNothing()
    {
        var summary = Compare.CompareRoutes([Route(0, 5.0, 0.25)]);
        Assert.Equal(0, summary.BestId);
        Assert.Equal(0, summary.SavedKwh);
    }
}
