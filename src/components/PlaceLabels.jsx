import { useEffect, useState, useCallback } from 'react';
import { Tooltip, CircleMarker, useMap } from 'react-leaflet';
import { COUNTRY_LABELS } from '../data/countryLabels';
import { REGION_LABELS } from '../data/regionLabels';
import { CITY_LABELS } from '../data/cityLabels';

const MAX_ZOOM_FOR_LABELS = 14;

// Matches MapView's WORLD_COPY_OFFSETS: static copies rather than a
// dynamically recentred offset, since asking Leaflet to reposition an
// already-rendered marker across a large instantaneous lng jump doesn't
// repaint reliably.
const WORLD_COPY_OFFSETS = [-1080, -720, -360, 0, 360, 720, 1080];

// Rendered in priority order: countries claim space first, then dive
// regions, then cities fill whatever room is left. Each tier has its
// own style/class.
const TIERS = [
  { data: COUNTRY_LABELS, className: 'label-country', fontSize: 16 },
  { data: REGION_LABELS, className: 'label-region', fontSize: 14 },
  { data: CITY_LABELS, className: 'label-city', fontSize: 12 },
];

function rectsOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

export default function PlaceLabels() {
  const map = useMap();
  const [visible, setVisible] = useState([]);

  const recompute = useCallback(() => {
    const zoom = map.getZoom();
    if (zoom > MAX_ZOOM_FOR_LABELS) {
      setVisible([]);
      return;
    }

    const bounds = map.getBounds();
    const placedRects = [];
    const result = [];

    for (const tier of TIERS) {
      for (const place of tier.data) {
        if (zoom < place.minZoom) continue;

        for (const offset of WORLD_COPY_OFFSETS) {
          const lng = place.lng + offset;
          if (!bounds.contains([place.lat, lng])) continue;

          const point = map.latLngToContainerPoint([place.lat, lng]);
          const halfWidth = place.name.length * tier.fontSize * 0.32 + 6;
          const halfHeight = tier.fontSize * 0.7 + 6;
          const rect = {
            left: point.x - halfWidth,
            right: point.x + halfWidth,
            top: point.y - halfHeight,
            bottom: point.y + halfHeight,
          };

          if (placedRects.some((r) => rectsOverlap(r, rect))) continue;

          placedRects.push(rect);
          result.push({ ...place, lng, offset, className: tier.className });
        }
      }
    }

    setVisible(result);
  }, [map]);

  useEffect(() => {
    recompute();
    map.on('zoomend moveend', recompute);
    return () => map.off('zoomend moveend', recompute);
  }, [map, recompute]);

  return (
    <>
      {visible.map((p) => (
        <CircleMarker
          key={`${p.className}-${p.name}-${p.offset}`}
          center={[p.lat, p.lng]}
          radius={0}
          pathOptions={{ opacity: 0, fillOpacity: 0 }}
          interactive={false}
        >
          <Tooltip permanent direction="center" className={`place-label ${p.className}`}>
            {p.name}
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  );
}
