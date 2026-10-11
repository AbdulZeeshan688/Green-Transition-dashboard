def climb_and_descent(coords: list[list[float]]) -> tuple[float, float]:
    climb_m = 0.0
    descent_m = 0.0
    for previous, current in zip(coords, coords[1:]):
        height_change = current[2] - previous[2]
        if height_change > 0:
            climb_m += height_change
        else:
            descent_m += -height_change
    return climb_m, descent_m
