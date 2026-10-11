from pytest import approx

from app.calc.compare import compare_routes


def test_picks_lowest_energy():
    results = [
        {"id": 0, "e_total_kwh": 5.0, "co2_kg": 0.25},
        {"id": 1, "e_total_kwh": 4.0, "co2_kg": 0.20},
        {"id": 2, "e_total_kwh": 6.0, "co2_kg": 0.30},
    ]
    summary = compare_routes(results)
    assert summary["default_id"] == 0
    assert summary["best_id"] == 1
    assert summary["saved_kwh"] == approx(1.0)
    assert summary["saved_co2_kg"] == approx(0.05)


def test_single_route_saves_nothing():
    summary = compare_routes([{"id": 0, "e_total_kwh": 5.0, "co2_kg": 0.25}])
    assert summary["best_id"] == 0
    assert summary["saved_kwh"] == 0
