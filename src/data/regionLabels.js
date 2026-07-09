import locations from './locations.json';

const seen = new Set();

export const REGION_LABELS = locations
  .filter((loc) => loc.region && !seen.has(loc.region) && seen.add(loc.region))
  .map((loc) => ({
    name: loc.region,
    lat: loc.lat,
    lng: loc.lng,
    minZoom: 3,
  }));
