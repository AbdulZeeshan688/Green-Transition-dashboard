namespace GreenTransition.Backend.Calc;

public static class Carbon
{
    // CO2 in kg = kWh * grams of CO2 per kWh / 1000
    public static double Co2Kg(double energyKwh, double carbonGPerKwh) => energyKwh * carbonGPerKwh / 1000;
}
