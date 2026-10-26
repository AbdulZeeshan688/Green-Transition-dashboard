import { describe, expect, it, vi } from 'vitest';
import { mapBackendRoutes, projectPaths } from './backendRoutes';
import { createRouteProvider } from '../services/routeService';

// Shape of backend/app/schemas.py RoutesResponse (Tao's backend).
const backendResponse = {
  data_source: 'demo',
  vehicle: 'Polestar 2 Long Range Single Motor',
  default_id: 0,
  best_id: 1,
  saved_kwh: 0.3,
  saved_co2_kg: 0.01,
  routes: [
    {
      id: 0,
      coords: [
        [25.66, 60.98, 100],
        [26.04, 61.2, 120],
      ],
      distance_m: 35000,
      duration_s: 1560,
      climb_m: 40,
      descent_m: 20,
      e_flat_kwh: 5.9,
      e_up_kwh: 0.3,
      e_re_kwh: 0.1,
      e_total_kwh: 6.09,
      co2_kg: 0.195,
    },
  ],
};

describe('mapBackendRoutes', () => {
  it('converts backend fields to the dashboard route shape', () => {
    const { source, routes } = mapBackendRoutes(backendResponse, 'lahti', 'heinola');
    expect(source).toBe('demo');
    expect(routes[0]).toMatchObject({
      id: 'backend-0',
      originId: 'lahti',
      destinationId: 'heinola',
      distanceKm: 35,
      durationMin: 26,
      totalUphill: 40,
      totalDownhill: 20,
      backendEnergyKWh: 6.09,
    });
    expect(routes[0].path).toHaveLength(2);
  });

  it('projects coordinates into the 100 x 60 map with north up', () => {
    const [path] = projectPaths([
      [
        [25, 60],
        [26, 61],
      ],
    ]);
    for (const [x, y] of path) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(100);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(60);
    }
    expect(path[1][1]).toBeLessThan(path[0][1]); // further north = higher on the map
  });
});

describe('route providers', () => {
  const routesData = {
    places: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }],
    routes: [{ id: 'r', originId: 'a', destinationId: 'b', distanceKm: 1, durationMin: 1, totalUphill: 0, totalDownhill: 0, path: [[0, 0], [1, 1]] }],
  };
  const integrations = {
    routes: {
      backend: {
        baseUrl: '',
        path: '/api/routes',
        timeoutMs: 1000,
        places: [
          { id: 'lahti', name: 'Lahti', coords: [25.66, 60.98] },
          { id: 'heinola', name: 'Heinola', coords: [26.04, 61.2] },
        ],
      },
    },
  };

  it('local provider reads routes.json', async () => {
    const provider = createRouteProvider('local', { routesData, integrations });
    expect(provider.places).toBe(routesData.places);
    const { routes, source } = await provider.getRoutes('a', 'b');
    expect(source).toBe('sample');
    expect(routes.map((r) => r.id)).toEqual(['r']);
  });

  it('backend provider POSTs coordinates and maps the answer', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => backendResponse }));
    const provider = createRouteProvider('backend', { routesData, integrations, fetchImpl });
    const { routes } = await provider.getRoutes('lahti', 'heinola');
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toBe('/api/routes');
    expect(JSON.parse(options.body)).toEqual({ start: [25.66, 60.98], end: [26.04, 61.2] });
    expect(routes[0].distanceKm).toBe(35);
  });

  it('backend provider reports HTTP errors', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 500 }));
    const provider = createRouteProvider('backend', { routesData, integrations, fetchImpl });
    await expect(provider.getRoutes('lahti', 'heinola')).rejects.toThrow('HTTP 500');
  });
});
