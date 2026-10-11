def co2_kg(energy_kwh: float, carbon_g_per_kwh: float) -> float:
    return energy_kwh * carbon_g_per_kwh / 1000
