// Place search for the Route Evaluation start/destination boxes.
// Uses Photon (OpenStreetMap search, no key needed). Settings live in
// integrations.json → routes.backend.placeSearch.

export function buildSearchUrl(cfg, query) {
  const params = new URLSearchParams({ q: query, limit: String(cfg.limit) });
  if (cfg.lang) params.set('lang', cfg.lang);
  // Bias results towards an area (e.g. Lahti) without excluding the rest.
  if (cfg.biasLatLon) {
    params.set('lat', String(cfg.biasLatLon[0]));
    params.set('lon', String(cfg.biasLatLon[1]));
  }
  return `${cfg.url}?${params}`;
}

// Photon answers GeoJSON. Converts it to { id, name, detail, coords: [lon, lat] }.
export function photonToPlaces(json) {
  const seen = new Set();
  const places = [];
  for (const [i, f] of (json?.features ?? []).entries()) {
    if (f.geometry?.type !== 'Point') continue;
    const p = f.properties ?? {};
    const street = [p.street, p.housenumber].filter(Boolean).join(' ');
    const name = p.name || street || p.city || 'Unnamed place';
    const detail = [street !== name ? street : '', p.city !== name ? p.city : '', p.country]
      .filter(Boolean)
      .join(', ');
    const key = `${name}|${detail}`;
    if (seen.has(key)) continue; // Photon often returns the same place several times
    seen.add(key);
    places.push({
      id: `${p.osm_type ?? 'place'}${p.osm_id ?? i}`,
      name,
      detail,
      coords: f.geometry.coordinates.slice(0, 2),
    });
  }
  return places;
}

export async function searchPlaces(query, cfg, fetchImpl = globalThis.fetch, signal) {
  const res = await fetchImpl(buildSearchUrl(cfg, query), { signal });
  if (!res.ok) throw new Error(`Place search answered HTTP ${res.status}`);
  return photonToPlaces(await res.json());
}
