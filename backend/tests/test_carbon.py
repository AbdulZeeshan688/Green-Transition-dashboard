from pytest import approx

from app.calc.carbon import co2_kg


def test_co2():
    assert co2_kg(3.64, 50) == approx(0.182)
