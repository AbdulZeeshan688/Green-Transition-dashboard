import { findRoutes } from '../lib/routeScoring';
import { mapBackendRoutes } from '../lib/backendRoutes';

// Route providers all expose the same interface, so the Route Evaluation
// screen doesn't care where routes come from:
//   { id, places: [{ id, name }], getRoutes(originId, destinationId) -> Promise<{ routes, source }> }
// The active provider is chosen in Settings (default from integrations.json).

function localProvider(routesData) {
  return {
    id: 'local',
    places: routesData.places,
    async getRoutes(originId, destinationId) {
      return { routes: findRoutes(routesData.routes, originId, destinationId), source: 'sample' };
    },
  };
}

// Tao's backend (backend/ folder): POST /api/routes with { start, end } as
// [longitude, latitude]. In development Vite proxies /api to the backend
// (see vite.config.js), so baseUrl can stay empty.
function backendProvider(config, fetchImpl) {
  const coordsOf = (id) => config.places.find((p) => p.id === id)?.coords;
  return {
    id: 'backend',
    places: config.places,
    async getRoutes(originId, destinationId) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config.timeoutMs);
      try {
        const res = await fetchImpl(`${config.baseUrl}${config.path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ start: coordsOf(originId), end: coordsOf(destinationId) }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Backend answered HTTP ${res.status}`);
        return mapBackendRoutes(await res.json(), originId, destinationId);
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
