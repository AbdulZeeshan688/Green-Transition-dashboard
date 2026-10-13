from app.calc.elevation import climb_and_descent


def test_up_and_down():
    coords = [[0, 0, 100], [0, 0, 130], [0, 0, 110], [0, 0, 150]]
    assert climb_and_descent(coords) == (70, 20)


def test_flat_route():
    coords = [[0, 0, 100], [0, 0, 100]]
    assert climb_and_descent(coords) == (0, 0)
