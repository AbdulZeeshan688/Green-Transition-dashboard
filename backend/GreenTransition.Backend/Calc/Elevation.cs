namespace GreenTransition.Backend.Calc;

public static class Elevation
{
    public static (double ClimbM, double DescentM) ClimbAndDescent(IReadOnlyList<double[]> coords)
    {
        double climbM = 0;
        double descentM = 0;
        for (var i = 1; i < coords.Count; i++)
        {
            // height change = height now - height before
            var heightChange = coords[i][2] - coords[i - 1][2];
            if (heightChange > 0)
                // going up: climb = climb + height change
                climbM += heightChange;
            else
                // going down: descent = descent + size of height change
                descentM -= heightChange;
        }
        return (climbM, descentM);
    }
}
