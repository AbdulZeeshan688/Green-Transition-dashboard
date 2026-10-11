JOULES_PER_KWH = 3_600_000


def flat_energy_kwh(distance_m: float, consumption_kwh_100km: float) -> float:
    return distance_m / 1000 * consumption_kwh_100km / 100


def climb_energy_kwh(climb_m: float, mass_kg: float, g: float, drive_efficiency: float) -> float:
    return mass_kg * g * climb_m / JOULES_PER_KWH / drive_efficiency


def regen_energy_kwh(descent_m: float, mass_kg: float, g: float, regen_efficiency: float) -> float:
    return mass_kg * g * descent_m * regen_efficiency / JOULES_PER_KWH


def total_energy_kwh(flat_kwh: float, climb_kwh: float, regen_kwh: float) -> float:
    return flat_kwh + climb_kwh - regen_kwh
