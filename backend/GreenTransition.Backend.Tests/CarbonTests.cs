using GreenTransition.Backend.Calc;

namespace GreenTransition.Backend.Tests;

public class CarbonTests
{
    [Fact]
    public void Co2() => Assert.Equal(0.182, Carbon.Co2Kg(3.64, 50), 1e-9);
}
