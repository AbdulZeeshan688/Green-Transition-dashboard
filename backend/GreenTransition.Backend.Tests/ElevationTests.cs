using GreenTransition.Backend.Calc;

namespace GreenTransition.Backend.Tests;

public class ElevationTests
{
    [Fact]
    public void UpAndDown()
    {
        double[][] coords = [[0, 0, 100], [0, 0, 130], [0, 0, 110], [0, 0, 150]];
        Assert.Equal((70, 20), Elevation.ClimbAndDescent(coords));
    }

    [Fact]
    public void FlatRoute()
    {
        double[][] coords = [[0, 0, 100], [0, 0, 100]];
        Assert.Equal((0, 0), Elevation.ClimbAndDescent(coords));
    }
}
