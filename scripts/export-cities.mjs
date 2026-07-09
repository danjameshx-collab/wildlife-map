import allTheCities from 'all-the-cities';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '..', 'src', 'data', 'cities-generated.json');

const MIN_POPULATION = 100000;

function minZoomForPopulation(population) {
  if (population > 5000000) return 3;
  if (population > 1000000) return 4;
  if (population > 500000) return 5;
  if (population > 200000) return 6;
  return 7;
}

const cities = allTheCities
  .filter((c) => c.population > MIN_POPULATION)
  .sort((a, b) => b.population - a.population)
  .map((c) => ({
    name: c.name,
    lat: c.loc.coordinates[1],
    lng: c.loc.coordinates[0],
    minZoom: minZoomForPopulation(c.population),
  }));

fs.writeFileSync(outPath, JSON.stringify(cities));
console.log('Exported', cities.length, 'cities to', outPath);
