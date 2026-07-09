import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'wildlife.db');
const db = new Database(dbPath);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchThumbnail(title) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=800&format=json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'wildlife-map-hobby-project/1.0 (personal dive-trip-planning app)' },
  });
  if (!res.ok) {
    if (res.status === 429) {
      await sleep(2000);
      return fetchThumbnail(title);
    }
    return null;
  }
  const data = await res.json();
  const pages = data?.query?.pages;
  if (!pages) return null;
  const page = Object.values(pages)[0];
  return page?.thumbnail?.source ?? null;
}

function cleanCommonName(name) {
  // Strip parenthetical alt-names, e.g. "Raggedtooth Shark (Sand Tiger)" -> "Raggedtooth Shark"
  return name.replace(/\s*\([^)]*\)\s*/g, '').trim();
}

const species = db.prepare('SELECT id, common_name, scientific_name FROM species').all();
const update = db.prepare('UPDATE species SET image_url = ? WHERE id = ?');

let success = 0;
let failed = [];

for (const s of species) {
  let image = null;
  try {
    if (s.scientific_name) {
      image = await fetchThumbnail(s.scientific_name);
    }
    if (!image) {
      image = await fetchThumbnail(cleanCommonName(s.common_name));
    }
  } catch (err) {
    console.error('Error fetching', s.common_name, err.message);
  }

  if (image) {
    update.run(image, s.id);
    success++;
  } else {
    failed.push(s.common_name);
  }
  console.log(image ? 'OK  ' : 'MISS', s.common_name);
  await sleep(200);
}

console.log(`\nDone: ${success}/${species.length} species got images.`);
if (failed.length) {
  console.log('Missing images for:', failed.join(', '));
}

db.close();
