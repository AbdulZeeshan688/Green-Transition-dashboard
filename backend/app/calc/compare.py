def compare_routes(results: list[dict]) -> dict:
    default = results[0]
    best = min(results, key=lambda route: route["e_total_kwh"])
    return {
        "default_id": default["id"],
        "best_id": best["id"],
        "saved_kwh": default["e_total_kwh"] - best["e_total_kwh"],
        "saved_co2_kg": default["co2_kg"] - best["co2_kg"],
    }
