from pytest import approx

from app.calc.energy import climb_energy_kwh, flat_energy_kwh, regen_energy_kwh, total_energy_kwh


def test_flat():
    assert flat_energy_kwh(21500, 15.5) == approx(3.3325)


def test_climb():
    assert climb_energy_kwh(85, 1860, 9.81, 0.85) == approx(0.50685, abs=1e-5)


def test_regen():
    assert regen_energy_kwh(60, 1860, 9.81, 0.65) == approx(0.19767, abs=1e-5)


def test_total():
    assert total_energy_kwh(3.3325, 0.50685, 0.19767) == approx(3.64168)
