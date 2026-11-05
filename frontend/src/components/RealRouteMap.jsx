import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Street map (Leaflet + tiles from map.json) for routes with real coordinates.
// Each route needs `latLngs`: [[lat, lon], ...]. The selected route is drawn on
// top in green; clicking any route selects it. `start`/`end` ([lat, lon] or
// null) are pinned even before any route has arrived.
export default function RealRouteMap({ routes, selectedId, onSelect, config, start = null, end = null }) {
  const el = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const fittedFor = useRef(null);

  // Create the map once.
  useEffect(() => {
    map.current = L.map(el.current, { zoomControl: true, attributionControl: true });
    L.tileLayer(config.tileUrl, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
    }).addTo(map.current);
    map.current.setView(config.defaultCenter, config.defaultZoom);
    layer.current = L.layerGroup().addTo(map.current);
    fittedFor.current = null; // a new map has no view yet, so it must zoom to the routes again
    return () => {
      map.current.remove();
      map.current = null;
    };
  }, [config]);

  // Redraw the routes whenever they or the selection change.
  useEffect(() => {
    const group = layer.current;
    if (!group) return;
    group.clearLayers();
    const drawable = routes.filter((r) => r.latLngs?.length > 1);
    const pin = (latLng, kind) =>
      L.circleMarker(latLng, { radius: 8, className: `real-${kind}` })
        .bindTooltip(kind === 'start' ? 'Start' : 'Destination')
        .addTo(group);
    const zoomTo = (key, latLngs) => {
      if (fittedFor.current === key) return; // keep the user's own zoom while nothing new arrived
      fittedFor.current = key;
      if (latLngs.length === 1) map.current.setView(latLngs[0], config.placeZoom);
      else map.current.fitBounds(L.latLngBounds(latLngs), { padding: [config.fitPaddingPx, config.fitPaddingPx] });
    };

    if (drawable.length === 0) {
      // No routes yet: just show the chosen place(s).
      if (start) pin(start, 'start');
      if (end) pin(end, 'end');
      const chosen = [start, end].filter(Boolean);
      if (chosen.length) zoomTo(`places:${chosen.join('|')}`, chosen);
      return;
    }

    const ordered = [...drawable.filter((r) => r.id !== selectedId), ...drawable.filter((r) => r.id === selectedId)];
    for (const r of ordered) {
      const selected = r.id === selectedId;
      L.polyline(r.latLngs, {
        className: `real-route ${selected ? 'selected' : 'alt'}`,
        weight: selected ? 7 : 5,
        opacity: selected ? 1 : 0.85,
      })
        .on('click', () => onSelect(r.id))
        .bindTooltip(r.label ?? '', { sticky: true })
        .addTo(group);
    }

    const sel = drawable.find((r) => r.id === selectedId) ?? drawable[0];
    pin(sel.latLngs[0], 'start');
    pin(sel.latLngs[sel.latLngs.length - 1], 'end');

    // Zoom to the routes only when a new set of routes arrives, not on every click.
    // Backend ids repeat for every city pair, so the key also uses each route's end points.
    const key = drawable.map((r) => `${r.id}:${r.latLngs[0]}:${r.latLngs[r.latLngs.length - 1]}`).join('|');
    zoomTo(key, drawable.flatMap((r) => r.latLngs));
  }, [routes, selectedId, onSelect, start, end, config.fitPaddingPx, config.placeZoom]);

  return (
    <div className="route-map real">
      <div ref={el} className="real-map-canvas" />
      {routes.some((r) => r.latLngs?.length > 1) && (
        <div className="map-legend">
          <span>
            <i className="legend-line main" /> Selected route
          </span>
          {routes.length > 1 && (
            <span>
              <i className="legend-line alt" /> Alternative route
            </span>
          )}
        </div>
      )}
    </div>
  );
}
