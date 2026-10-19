import { describe, expect, it } from 'vitest';
import { bestRouteId, findRoutes, scoreRoutes } from './routeScoring';

const metrics = [
  { key: 'energyKWh', weight: 0.5, better: 'lower' },
  { key: 'co2SavedKg', weight: 0.5, better: 'higher' },
];

const routes = [
  {
    id: 'a',
    originId: 'x',
    destinationId: 'y',
    energyKWh: 2,
    co2SavedKg: 2,
    totalUphill: 10,
    totalDownhill: 30,
    path: [
      [0, 0],
      [1, 1],
    ],
  },
  {
    id: 'b',
    originId: 'x',
    destinationId: 'y',
    energyKWh: 4,
    co2SavedKg: 1,
    totalUphill: 5,
    totalDownhill: 5,
    path: [
      [0, 0],
      [2, 2],
    ],
  },
];

describe('scoreRoutes', () => {
  it('gives 100 to a route that is best on every metric', () => {
    expect(scoreRoutes(routes, metrics)).toEqual({ a: 100, b: 50 });
  });
  it('normalises weights that do not sum to 1', () => {
    const doubled = metrics.map((m) => ({ ...m, weight: m.weight * 2 }));
    expect(scoreRoutes(routes, doubled)).toEqual({ a: 100, b: 50 });
  });
  it('returns nothing for no routes or zero weights', () => {
    expect(scoreRoutes([], metrics)).toEqual({});
    expect(
      scoreRoutes(
        routes,
        metrics.map((m) => ({ ...m, weight: 0 })),
      ),
    ).toEqual({});
  });
});

describe('findRoutes', () => {
  it('finds forward routes', () => {
    expect(findRoutes(routes, 'x', 'y').map((r) => r.id)).toEqual(['a', 'b']);
  });
  it('reverses stored routes and swaps climb/descent', () => {
    const [rev] = findRoutes(routes, 'y', 'x');
    expect(rev.path).toEqual([
      [1, 1],
      [0, 0],
    ]);
    expect(rev.totalUphill).toBe(30);
    expect(rev.originId).toBe('y');
  });
});

describe('bestRouteId', () => {
  it('picks the highest score', () => {
    expect(bestRouteId({ a: 60, b: 90, c: 70 })).toBe('b');
    expect(bestRouteId({})).toBeNull();
  });
});
