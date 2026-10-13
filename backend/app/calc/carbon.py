def co2_kg(energy_kwh: float, carbon_g_per_kwh: float) -> float:
    # CO2 in kg = kWh * grams of CO2 per kWh / 1000
    return energy_kwh * carbon_g_per_kwh / 1000
