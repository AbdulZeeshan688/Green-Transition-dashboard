// Converts the backend's POST /api/routes response (backend/app/schemas.py,
// RoutesResponse) into the route shape the dashboard already uses for
// routes.json. Energy, battery and CO2 are then calculated by the dashboard's
// own energy model for the selected vehicle, so there is one source of truth.

// Fits all routes into the schematic map's 100 x 60 box (keeping proportions),
// with north up. Backend coordinates are [longitude, latitude, elevation?].
export function projectPaths(coordLists, { width = 100, height = 60, margin = 6 } = {}) {
  const all = coordLists.flat();
  if (all.length === 0) return coordLists.map(() => []);
  const lats = all.map((c) => c[1]);
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const kx = Math.cos((midLat * Math.PI) / 180); // shrink longitude away from the equator
  const xs = all.map((c) => c[0] * kx);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...lats);
  const maxY = Math.max(...lats);
  const spanX = maxX - minX || 1e-9;
  const spanY = maxY - minY || 1e-9;
  const scale = Math.min((width - 2 * margin) / spanX, (height - 2 * margin) / spanY);
  const offX = (width - spanX * scale) / 2;
  const offY = (height - spanY * scale) / 2;
  return coordLists.map((coords) =>
    coords.map(([lon, lat]) => [
      +(offX + (lon * kx - minX) * scale).toFixed(2),
      +(height - (offY + (lat - minY) * scale)).toFixed(2),
    ]),
  );
}

export function mapBackendRoutes(response, originId, destinationId) {
  const routes = response?.routes ?? [];
  const paths = projectPaths(routes.map((r) => r.coords ?? []));
  return {
    source: response?.data_source ?? 'backend',
    routes: routes.map((r, i) => ({
      id: `backend-${r.id}`,
      originId,
      destinationId,
      distanceKm: r.distance_m / 1000,
      durationMin: r.duration_s / 60,
      totalUphill: r.climb_m,
      totalDownhill: r.descent_m,
      path: paths[i],
      // Kept for comparison with the backend's own physics-based estimate.
      backendEnergyKWh: r.e_total_kwh,
      backendCo2Kg: r.co2_kg,
    })),
  };
}
