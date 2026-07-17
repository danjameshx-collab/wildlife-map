import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import PlaceLabels from './PlaceLabels';
import LocationPopup from './LocationPopup';

const CENTER = [0, 110];
const MAX_LAT = 85;
// Longitude bounds just need to comfortably cover WORLD_COPY_OFFSETS below so
// the map can be dragged east/west through every rendered copy; only latitude
// is clamped to stop the grey area above the north pole / below the south
// pole from appearing.
const MAX_LNG = 1260;
const MAX_BOUNDS = [
  [-MAX_LAT, -MAX_LNG],
  [MAX_LAT, MAX_LNG],
];
const DIVE_OPTIONS = { color: '#0a6e8c', fillColor: '#1aa6c9', fillOpacity: 0.85, weight: 2 };
const PARK_OPTIONS = { color: '#1a7a3a', fillColor: '#2aaa50', fillOpacity: 0.85, weight: 2 };
const ENDEMIC_OPTIONS = { color: '#7f1d1d', fillColor: '#dc2626', fillOpacity: 0.85, weight: 2 };
const WONDER_OPTIONS = { color: '#6b21a8', fillColor: '#a855f7', fillOpacity: 0.9, weight: 2 };
const LANDMARK_OPTIONS = { color: '#a16207', fillColor: '#eab308', fillOpacity: 0.9, weight: 2 };

const markerOptions = (loc) => {
  if (loc.type === 'landmark') return loc.wonder ? WONDER_OPTIONS : LANDMARK_OPTIONS;
  if (loc.sightings.some((s) => s.endemic)) return ENDEMIC_OPTIONS;
  return loc.type === 'park' ? PARK_OPTIONS : DIVE_OPTIONS;
};

// Leaflet's tile layer wraps horizontally forever, but vector overlays (our
// CircleMarkers) only exist at their literal lng - so panning past the
// original copy of the world would otherwise show repeated (wrapped) tiles
// with no markers on them. Rendering each marker again at +/-360 and +/-720
// (three world-widths either side) keeps markings present through several
// full drags in either direction, matching MAX_BOUNDS below. These are
// static, fixed-position copies (not dynamically recentred) - Leaflet's own
// renderer doesn't reliably repaint vector layers after an instantaneous
// large logical jump, so instead we let its normal incremental pan handling
// (which works correctly no matter how far you organically drag) reveal
// whichever copy is currently in view.
const WORLD_COPY_OFFSETS = [-1080, -720, -360, 0, 360, 720, 1080];

// Leaflet's panes sit inside a transformed ancestor (.leaflet-map-pane),
// which per the CSS spec creates its own stacking context - so no z-index
// on a marker inside it can ever paint above the CountryModal's backdrop,
// which lives outside that subtree entirely. Picks whichever rendered
// world-copy of `lng` sits nearest the current view.
function nearestOffset(map, lng) {
  const centerLng = map.getCenter().lng;
  let best = 0;
  let bestDist = Infinity;
  for (const offset of WORLD_COPY_OFFSETS) {
    const dist = Math.abs(lng + offset - centerLng);
    if (dist < bestDist) {
      bestDist = dist;
      best = offset;
    }
  }
  return best;
}

// Hands the underlying Leaflet map instance up to App so it can flyTo a
// location chosen from the CountryModal.
function MapController({ onMapReady }) {
  const map = useMap();
  useEffect(() => {
    onMapReady?.(map);
  }, [map, onMapReady]);
  return null;
}

// The CountryModal covers most (or all) of the screen, so a highlight
// marker sitting behind it is invisible. When a card is hovered, nudge the
// map (pan only, no zoom change) so that point lands in whichever strip of
// map is actually visible beside the modal - but only if it isn't already
// visible there. Re-centering on every single hover (even when the pin was
// already on screen) is what reads as the map "jumping around" as you move
// between cards; skipping the redundant moves is most of the fix. Debounced
// so sweeping the mouse across a grid of cards doesn't fire a pan per card,
// and uses flyTo (not panTo) so the one that does happen is guaranteed to
// ease smoothly rather than risk Leaflet snapping instantly for long hops.
function HoverRevealController({ hoveredLocation }) {
  const map = useMap();

  useEffect(() => {
    if (!hoveredLocation) return undefined;

    const timer = setTimeout(() => {
      const modalEl = document.querySelector('.country-modal');
      const mapRect = map.getContainer().getBoundingClientRect();
      const margin = 32;
      let targetPoint;
      let visibleMin;
      let visibleMax;

      if (modalEl) {
        const modalRect = modalEl.getBoundingClientRect();
        const freeRight = mapRect.right - modalRect.right;
        const freeLeft = modalRect.left - mapRect.left;
        // Modal is genuinely edge-to-edge (e.g. narrow/mobile viewport) -
        // there's no sliver of map anywhere to reveal a marker in.
        if (freeRight < 8 && freeLeft < 8) return;
        if (freeRight >= freeLeft) {
          targetPoint = L.point(mapRect.width - Math.max(freeRight / 2, margin), mapRect.height * 0.5);
          visibleMin = modalRect.right - mapRect.left;
          visibleMax = mapRect.width;
        } else {
          targetPoint = L.point(Math.max(freeLeft / 2, margin), mapRect.height * 0.5);
          visibleMin = 0;
          visibleMax = modalRect.left - mapRect.left;
        }
      } else {
        targetPoint = L.point(mapRect.width / 2, mapRect.height / 2);
        visibleMin = 0;
        visibleMax = mapRect.width;
      }

      const latlng = L.latLng(hoveredLocation.lat, hoveredLocation.lng + nearestOffset(map, hoveredLocation.lng));
      const currentPoint = map.latLngToContainerPoint(latlng);

      // Already comfortably inside the visible strip (and not too close to
      // the top/bottom edge either) - leave the view exactly where it is.
      const alreadyVisible =
        currentPoint.x > visibleMin + margin &&
        currentPoint.x < visibleMax - margin &&
        currentPoint.y > margin &&
        currentPoint.y < mapRect.height - margin;
      if (alreadyVisible) return;

      const centerPoint = map.latLngToContainerPoint(map.getCenter());
      const newCenterPoint = centerPoint.subtract(targetPoint.subtract(currentPoint));
      map.flyTo(map.containerPointToLatLng(newCenterPoint), map.getZoom(), { duration: 0.6, easeLinearity: 0.25 });
      // 340ms: long enough for the modal's shrink-and-dock CSS transition
      // (320ms) to have essentially finished, so this measures its final
      // size/position rather than a mid-animation frame.
    }, 340);

    return () => clearTimeout(timer);
  }, [hoveredLocation, map]);

  return null;
}

// Renders the pulsing highlight ring as a `position: fixed` element
// portaled to <body>, rather than as a Leaflet marker - Leaflet's panes
// live inside a transformed ancestor, which creates its own stacking
// context and caps every descendant's effective z-index no matter what
// value is set on the marker itself, so it can never paint above the
// modal's backdrop. Recomputed on every map move/zoom to stay in sync.
function HoverHighlightOverlay({ hoveredLocation }) {
  const map = useMap();
  const [screenPos, setScreenPos] = useState(null);

  useEffect(() => {
    if (!hoveredLocation) {
      setScreenPos(null);
      return undefined;
    }

    const update = () => {
      const latlng = L.latLng(hoveredLocation.lat, hoveredLocation.lng + nearestOffset(map, hoveredLocation.lng));
      const point = map.latLngToContainerPoint(latlng);
      const mapRect = map.getContainer().getBoundingClientRect();
      setScreenPos({ x: mapRect.left + point.x, y: mapRect.top + point.y });
    };

    update();
    map.on('move zoom', update);
    return () => map.off('move zoom', update);
  }, [hoveredLocation, map]);

  if (!screenPos) return null;

  return createPortal(
    <div className="map-highlight-overlay" style={{ left: screenPos.x, top: screenPos.y }}>
      <span className="map-highlight-ring" />
      <span className="map-highlight-ring map-highlight-ring-delay" />
      <span className="map-highlight-dot" />
    </div>,
    document.body
  );
}

export default function MapView({ locations, onSelectCountry, onMapReady, hoveredLocation }) {
  return (
    <MapContainer
      className="map-container"
      center={CENTER}
      zoom={3}
      minZoom={3}
      zoomSnap={0}
      zoomDelta={1}
      wheelPxPerZoomLevel={60}
      maxBounds={MAX_BOUNDS}
      maxBoundsViscosity={1.0}
      preferCanvas={true}
      zoomControl={false}
    >
      <MapController onMapReady={onMapReady} />
      <HoverRevealController hoveredLocation={hoveredLocation} />
      <ZoomControl position="topright" />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />
      <PlaceLabels onSelectCountry={onSelectCountry} />
      {locations.map((loc) =>
        WORLD_COPY_OFFSETS.map((offset) => (
          <CircleMarker
            key={`${loc.id}-${offset}`}
            center={[loc.lat, loc.lng + offset]}
            radius={8}
            pathOptions={markerOptions(loc)}
          >
            <Popup maxWidth={420} minWidth={280} maxHeight={580}>
              <LocationPopup location={loc} onSelectCountry={onSelectCountry} />
            </Popup>
          </CircleMarker>
        ))
      )}
      <HoverHighlightOverlay hoveredLocation={hoveredLocation} />
    </MapContainer>
  );
}
