using GreenTransition.Backend.Calc;

namespace GreenTransition.Backend.Tests;

public class EnergyTests
{
    [Fact]
    public void Flat() => Assert.Equal(3.3325, Energy.FlatEnergyKwh(21500, 15.5), 1e-9);

    [Fact]
    public void Climb() => Assert.Equal(0.50685, Energy.ClimbEnergyKwh(85, 1860, 9.81, 0.85), 1e-5);

    [Fact]
    public void Regen() => Assert.Equal(0.19767, Energy.RegenEnergyKwh(60, 1860, 9.81, 0.65), 1e-5);

    [Fact]
    public void Total() => Assert.Equal(3.64168, Energy.TotalEnergyKwh(3.3325, 0.50685, 0.19767), 1e-9);
}
