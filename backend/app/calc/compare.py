def compare_routes(results: list[dict]) -> dict:
    # normal route = first route from the map service
    default = results[0]
    # best route = route with the lowest energy
    best = min(results, key=lambda route: route["e_total_kwh"])
    # saved = normal route - best route
    return {
        "default_id": default["id"],
        "best_id": best["id"],
        "saved_kwh": round(default["e_total_kwh"] - best["e_total_kwh"], 3),
        "saved_co2_kg": round(default["co2_kg"] - best["co2_kg"], 3),
    }
