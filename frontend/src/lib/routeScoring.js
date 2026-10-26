// Route comparison logic. Metrics, weights and direction ("lower"/"higher" is
// better) come from scoring.json, so the ranking can be retuned without code.

// Routes are stored once per direction; a reversed trip reuses the data with
// the path flipped and climb/descent swapped.
export function findRoutes(routes, originId, destinationId) {
  const forward = routes.filter((r) => r.originId === originId && r.destinationId === destinationId);
  if (forward.length > 0) return forward;
  return routes
    .filter((r) => r.originId === destinationId && r.destinationId === originId)
    .map((r) => ({
      ...r,
      id: `${r.id}--reverse`,
      originId,
      destinationId,
      path: [...r.path].reverse(),
      totalUphill: r.totalDownhill,
      totalDownhill: r.totalUphill,
    }));
}

function ratio(value, best, better) {
  if (better === 'lower') return value === 0 ? 1 : best / value;
  return best === 0 ? 1 : value / best;
}

// Returns { [routeId]: score 0-100 }.
export function scoreRoutes(routes, metrics) {
  const active = metrics.filter((m) => m.weight > 0);
  const totalWeight = active.reduce((sum, m) => sum + m.weight, 0);
  if (routes.length === 0 || totalWeight === 0) return {};

  const best = Object.fromEntries(
    active.map((m) => {
      const values = routes.map((r) => r[m.key]);
      return [m.key, m.better === 'lower' ? Math.min(...values) : Math.max(...values)];
    }),
  );

  return Object.fromEntries(
    routes.map((route) => {
      const weighted = active.reduce((sum, m) => sum + m.weight * ratio(route[m.key], best[m.key], m.better), 0);
      return [route.id, Math.round((weighted / totalWeight) * 100)];
    }),
  );
}

export function bestRouteId(scores) {
  let bestId = null;
  for (const [id, score] of Object.entries(scores)) {
    if (bestId === null || score > scores[bestId]) bestId = id;
  }
  return bestId;
}
