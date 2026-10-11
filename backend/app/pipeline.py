from app.calc import carbon, compare, elevation, energy
from app.inputs import config as config_input
from app.inputs import ors


def plan_routes(start: list[float] | None, end: list[float] | None) -> dict:
    cfg = config_input.load_config()
    start = start or cfg["route"]["default_start"]
    end = end or cfg["route"]["default_end"]

    routes, data_source = ors.get_routes(start, end, cfg["route"], config_input.load_ors_api_key())
    results = [calculate_route(route_id, route, cfg) for route_id, route in enumerate(routes)]
    summary = compare.compare_routes(results)

    return {
        "data_source": data_source,
        "routes": results,
        "default_id": summary["default_id"],
        "best_id": summary["best_id"],
        "saved_kwh": round(summary["saved_kwh"], 3),
        "saved_co2_kg": round(summary["saved_co2_kg"], 3),
    }


def calculate_route(route_id: int, route: dict, cfg: dict) -> dict:
    vehicle = cfg["vehicle"]
    g = cfg["physics"]["g"]

    climb_m, descent_m = elevation.climb_and_descent(route["coords"])
    e_flat = energy.flat_energy_kwh(route["distance_m"], vehicle["consumption_kwh_100km"])
    e_up = energy.climb_energy_kwh(climb_m, vehicle["mass_kg"], g, vehicle["drive_efficiency"])
    e_re = energy.regen_energy_kwh(descent_m, vehicle["mass_kg"], g, vehicle["regen_efficiency"])
    e_total = energy.total_energy_kwh(e_flat, e_up, e_re)
    co2 = carbon.co2_kg(e_total, cfg["grid"]["carbon_g_per_kwh"])

    return {
        "id": route_id,
        "coords": route["coords"],
        "distance_m": route["distance_m"],
        "duration_s": route["duration_s"],
        "climb_m": round(climb_m, 1),
        "descent_m": round(descent_m, 1),
        "e_flat_kwh": round(e_flat, 3),
        "e_up_kwh": round(e_up, 3),
        "e_re_kwh": round(e_re, 3),
        "e_total_kwh": round(e_total, 3),
        "co2_kg": round(co2, 3),
    }
