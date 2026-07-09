import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
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

const markerOptions = (loc) => {
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

export default function MapView({ locations }) {
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
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />
      <PlaceLabels />
      {locations.map((loc) =>
        WORLD_COPY_OFFSETS.map((offset) => (
          <CircleMarker
            key={`${loc.id}-${offset}`}
            center={[loc.lat, loc.lng + offset]}
            radius={8}
            pathOptions={markerOptions(loc)}
          >
            <Popup maxWidth={420} minWidth={420} maxHeight={580}>
              <LocationPopup location={loc} />
            </Popup>
          </CircleMarker>
        ))
      )}
    </MapContainer>
  );
}
