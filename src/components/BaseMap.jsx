import 'maplibre-gl/dist/maplibre-gl.css';
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

// OpenFreeMap's "Liberty" vector style - a free, keyless, Google-Maps-like
// basemap. Its own text/icon layers are stripped so they don't clash with
// the app's PlaceLabels, and 3D buildings are dropped since the map is 2D.
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';

export default function BaseMap() {
  const map = useMap();

  useEffect(() => {
    let layer;
    let cancelled = false;

    fetch(STYLE_URL)
      .then((res) => res.json())
      .then((style) => {
        if (cancelled) return;
        style.layers = style.layers.filter(
          (l) => l.type !== 'symbol' && l.type !== 'fill-extrusion'
        );
        layer = maplibreGL({ style, attribution: ATTRIBUTION }).addTo(map);
      })
      .catch((err) => console.error('Failed to load basemap style', err));

    return () => {
      cancelled = true;
      if (layer) map.removeLayer(layer);
    };
  }, [map]);

  return null;
}
