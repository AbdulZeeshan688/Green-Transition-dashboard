import { findRoutes } from '../lib/routeScoring';
import { mapBackendRoutes } from '../lib/backendRoutes';
import { searchPlaces } from '../lib/placeSearch';

// Route providers all expose the same interface, so the Route Evaluation
// screen doesn't care where routes come from:
//   { id, places: [{ id, name }], getRoutes(origin, destination) -> Promise<{ routes, source }> }
// origin/destination are place objects ({ id, name, coords? }). A provider with
// searchPlaces(query, signal) lets the user search any place instead of a fixed list.
// The active provider is chosen in Settings (default from integrations.json).

function localProvider(routesData) {
  return {
    id: 'local',
    places: routesData.places,
    async getRoutes(origin, destination) {
      return { routes: findRoutes(routesData.routes, origin.id, destination.id), source: 'sample' };
    },
  };
}

// Tao's backend (backend/ folder): POST /api/routes with { start, end } as
// [longitude, latitude]. In development Vite proxies /api to the backend
// (see vite.config.js), so baseUrl can stay empty.
function backendProvider(config, fetchImpl) {
  return {
    id: 'backend',
    places: [], // no fixed list: the user searches for any place
    searchPlaces: (query, signal) => searchPlaces(query, config.placeSearch, fetchImpl, signal),
    async getRoutes(origin, destination) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config.timeoutMs);
      try {
        const res = await fetchImpl(`${config.baseUrl}${config.path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ start: origin.coords, end: destination.coords }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Backend answered HTTP ${res.status}`);
        return mapBackendRoutes(await res.json(), origin.id, destination.id);
      } catch (error) {
        if (error.name === 'AbortError') throw new Error(`Backend did not answer within ${config.timeoutMs / 1000} s`);
        throw error;
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

export function createRouteProvider(sourceId, { routesData, integrations, fetchImpl = globalThis.fetch }) {
  if (sourceId === 'backend') return backendProvider(integrations.routes.backend, fetchImpl);
  return localProvider(routesData);
}
