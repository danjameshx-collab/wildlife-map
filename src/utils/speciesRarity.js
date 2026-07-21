import locationsData from '../data/locations.json';

// A species seen in only a handful of countries is a much bigger deal to spot
// than one seen almost everywhere (e.g. Mandrill in 2 countries vs. African
// Lion in 16) — so sightings are ranked by range breadth, not just a binary
// endemic flag. Computed once from the full (unfiltered) dataset so it stays
// stable regardless of which map layers are toggled on.
const countriesBySpecies = new Map();

for (const loc of locationsData) {
  if (!loc.sightings) continue;
  for (const s of loc.sightings) {
    if (!countriesBySpecies.has(s.species_id)) {
      countriesBySpecies.set(s.species_id, new Set());
    }
    countriesBySpecies.get(s.species_id).add(loc.country);
  }
}

const countryCountBySpecies = new Map(
  [...countriesBySpecies.entries()].map(([id, countries]) => [id, countries.size])
);

export function countryCountFor(speciesId) {
  return countryCountBySpecies.get(speciesId) ?? Infinity;
}

// Restricted-range but not flagged endemic: still worth calling out.
export const RARE_COUNTRY_THRESHOLD = 5;

export function isRareSighting(sighting) {
  if (sighting.endemic) return false;
  return countryCountFor(sighting.species_id) <= RARE_COUNTRY_THRESHOLD;
}
