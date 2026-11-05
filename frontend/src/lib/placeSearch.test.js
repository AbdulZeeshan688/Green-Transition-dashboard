import { describe, expect, it, vi } from 'vitest';
import { buildSearchUrl, photonToPlaces, searchPlaces } from './placeSearch';

const cfg = { url: 'https://photon.test/api/', limit: 4, lang: 'en', biasLatLon: [60.98, 25.66] };

const feature = (properties, coordinates = [25.66, 60.98]) => ({
  type: 'Feature',
  properties,
  geometry: { type: 'Point', coordinates },
});

describe('place search', () => {
  it('builds the search URL with limit, language and location bias', () => {
    expect(buildSearchUrl(cfg, 'LUT Lahti')).toBe(
      'https://photon.test/api/?q=LUT+Lahti&limit=4&lang=en&lat=60.98&lon=25.66',
    );
  });

  it('turns Photon results into places with [lon, lat] coordinates', () => {
    const places = photonToPlaces({
      features: [
        feature({ osm_type: 'N', osm_id: 1, name: 'LUT-University Lahti campus', city: 'Lahti', country: 'Finland' }, [25.665, 61.006]),
        feature({ osm_type: 'W', osm_id: 2, street: 'Aleksanterinkatu', housenumber: '1', city: 'Lahti', country: 'Finland' }),
        feature({ osm_type: 'R', osm_id: 3, name: 'Lahti', country: 'Finland' }),
      ],
    });
    expect(places).toEqual([
      { id: 'N1', name: 'LUT-University Lahti campus', detail: 'Lahti, Finland', coords: [25.665, 61.006] },
      { id: 'W2', name: 'Aleksanterinkatu 1', detail: 'Lahti, Finland', coords: [25.66, 60.98] },
      { id: 'R3', name: 'Lahti', detail: 'Finland', coords: [25.66, 60.98] },
    ]);
  });

  it('drops duplicates and non-point results', () => {
    const lahti = { name: 'Lahti', city: 'Lahti', country: 'Finland' };
    const places = photonToPlaces({
      features: [
        feature({ ...lahti, osm_id: 1 }),
        feature({ ...lahti, osm_id: 2 }),
        { properties: { name: 'Area' }, geometry: { type: 'Polygon', coordinates: [] } },
      ],
    });
    expect(places).toHaveLength(1);
    expect(photonToPlaces(null)).toEqual([]);
  });

  it('reports HTTP errors', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 429 }));
    await expect(searchPlaces('x', cfg, fetchImpl)).rejects.toThrow('HTTP 429');
  });
});
