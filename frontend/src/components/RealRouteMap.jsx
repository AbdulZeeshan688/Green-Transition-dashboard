import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Street map (Leaflet + tiles from map.json) for routes with real coordinates.
// Each route needs `latLngs`: [[lat, lon], ...]. The selected route is drawn on
// top in green; clicking any route selects it.
export default function RealRouteMap({ routes, selectedId, onSelect, config }) {
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
    if (drawable.length === 0) return;

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
    L.circleMarker(sel.latLngs[0], { radius: 8, className: 'real-start' }).bindTooltip('Start').addTo(group);
    L.circleMarker(sel.latLngs[sel.latLngs.length - 1], { radius: 8, className: 'real-end' })
      .bindTooltip('Destination')
      .addTo(group);

    // Zoom to the routes only when a new set of routes arrives, not on every click.
    // Backend ids repeat for every city pair, so the key also uses each route's end points.
    const key = drawable.map((r) => `${r.id}:${r.latLngs[0]}:${r.latLngs[r.latLngs.length - 1]}`).join('|');
    if (fittedFor.current !== key) {
      fittedFor.current = key;
      map.current.fitBounds(L.latLngBounds(drawable.flatMap((r) => r.latLngs)), {
        padding: [config.fitPaddingPx, config.fitPaddingPx],
      });
    }
  }, [routes, selectedId, onSelect, config.fitPaddingPx]);

  return (
    <div className="route-map real">
      <div ref={el} className="real-map-canvas" />
      {routes.length > 0 && (
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
