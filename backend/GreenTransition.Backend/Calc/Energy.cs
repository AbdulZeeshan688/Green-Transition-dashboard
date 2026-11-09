namespace GreenTransition.Backend.Calc;

public static class Energy
{
    // 1 kWh = 3,600,000 joules
    const double JoulesPerKwh = 3_600_000;

    // energy = km * kWh per 100 km / 100
    public static double FlatEnergyKwh(double distanceM, double consumptionKwh100Km) =>
        distanceM / 1000 * consumptionKwh100Km / 100;

    // energy = weight * gravity * height / motor efficiency
    public static double ClimbEnergyKwh(double climbM, double massKg, double g, double driveEfficiency) =>
        massKg * g * climbM / JoulesPerKwh / driveEfficiency;

    // energy = weight * gravity * height * share we get back
    public static double RegenEnergyKwh(double descentM, double massKg, double g, double regenEfficiency) =>
        massKg * g * descentM * regenEfficiency / JoulesPerKwh;

    // total = flat + uphill - downhill
    public static double TotalEnergyKwh(double flatKwh, double climbKwh, double regenKwh) =>
        flatKwh + climbKwh - regenKwh;
}
