import countries from 'world-countries';

const byAreaDesc = countries
  .filter((c) => c.latlng && c.latlng.length === 2)
  .sort((a, b) => (b.area || 0) - (a.area || 0));

function minZoomForRank(rank) {
  if (rank < 25) return 0;
  if (rank < 75) return 3;
  if (rank < 150) return 4;
  return 5;
}

export const COUNTRY_LABELS = byAreaDesc.map((c, rank) => ({
  name: c.name.common,
  lat: c.latlng[0],
  lng: c.latlng[1],
  minZoom: minZoomForRank(rank),
}));
