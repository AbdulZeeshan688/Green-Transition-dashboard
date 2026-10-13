def climb_and_descent(coords: list[list[float]]) -> tuple[float, float]:
    climb_m = 0.0
    descent_m = 0.0
    for previous, current in zip(coords, coords[1:]):
        # height change = height now - height before
        height_change = current[2] - previous[2]
        if height_change > 0:
            # going up: climb = climb + height change
            climb_m += height_change
        else:
            # going down: descent = descent + size of height change
            descent_m -= height_change
    return climb_m, descent_m
