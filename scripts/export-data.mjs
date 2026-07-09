import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'wildlife.db');
const outDir = path.join(__dirname, '..', 'src', 'data');

const db = new Database(dbPath, { readonly: true });

// Species restricted to a single country or a narrow, specific region (an island,
// a single mountain range/park, or a small cluster of adjacent countries) with no
// wild population elsewhere. Curated by hand against actual geographic range —
// text-matching the word "endemic" in the description missed most of these
// (e.g. the Gelada's description never says "endemic" but it only occurs in Ethiopia).
const ENDEMIC_SPECIES = new Set([
  'Zalophus wollebaeki',            // Galápagos Sea Lion
  'Nannopterum harrisi',            // Flightless Cormorant
  'Haploblepharus edwardsii',       // Puffadder Shyshark
  'Poroderma africanum',            // Pyjama Shark
  'Eudyptes pachyrhynchus',         // Fiordland Crested Penguin
  'Paraplesiops bleekeri',          // Eastern Blue Devilfish
  'Neomonachus schauinslandi',      // Hawaiian Monk Seal
  'Cephalorhynchus commersonii',    // Commerson's Dolphin
  'Ailuropoda melanoleuca',         // Giant Panda
  'Nasalis larvatus',               // Proboscis Monkey
  'Varanus komodoensis',            // Komodo Dragon
  'Conolophus subcristatus',        // Galapagos Land Iguana
  'Aepyceros melampus petersi',     // Black-faced Impala
  'Kobus vardonii',                 // Puku
  'Kobus leche kafuensis',          // Kafue Lechwe
  'Trachypithecus geei',            // Golden Langur
  'Rucervus duvaucelii',            // Barasingha
  'Crocodylus intermedius',         // Orinoco Crocodile
  'Canis simensis',                 // Ethiopian Wolf
  'Theropithecus gelada',           // Gelada
  'Tragelaphus buxtoni',            // Mountain Nyala
  'Cercopithecus kandti',           // Golden Monkey
  'Aquila adalberti',               // Spanish Imperial Eagle
  'Pantholops hodgsonii',           // Tibetan Antelope
  'Panthera pardus kotiya',         // Sri Lankan Leopard
  'Hippocamelus bisulcus',          // South Andean Huemul
  'Megadyptes antipodes',           // Yellow-eyed Penguin
  'Cephalorhynchus hectori',        // Hector's Dolphin
  'Amblyrhynchus cristatus',        // Marine Iguana
  'Neophoca cinerea',               // Australian Sea Lion
  'Phyllopteryx taeniolatus',       // Weedy Seadragon
  'Spheniscus mendiculus',          // Galápagos Penguin
  'Phycodurus eques',               // Leafy Seadragon
  'Parapercis colias',              // Blue Cod
  'Gorilla beringei beringei',      // Mountain Gorilla
  'Pongo pygmaeus',                 // Bornean Orangutan
  'Panthera tigris sumatrae',       // Sumatran Tiger
  'Panthera leo persica',           // Asiatic Lion
  'Nestor notabilis',               // Kea
  'Apteryx australis',              // Kiwi
  'Taurotragus derbianus derbianus',// Western Derby Eland
  'Rhinoceros sondaicus',           // Javan Rhinoceros
  'Porcula salvania',               // Pygmy Hog
  'Leopardus jacobita',             // Andean Cat
  'Setonix brachyurus',             // Quokka
  'Dendrolagus lumholtzi',          // Tree Kangaroo
  'Capra walie',                    // Walia Ibex
  'Equus grevyi',                   // Grevy's Zebra
  'Giraffa reticulata',             // Reticulated Giraffe
  'Litocranius walleri',            // Gerenuk
  'Spheniscus demersus',            // African Penguin
  'Ursus arctos marsicanus',        // Marsican Brown Bear
  'Elephas maximus borneensis',     // Bornean Pygmy Elephant
  'Grus americana',                 // Whooping Crane
  'Puma concolor coryi',            // Florida Panther
  'Sarcophilus harrisii',           // Tasmanian Devil
  'Chelonoidis niger',              // Galapagos Giant Tortoise
  'Lynx pardinus',                  // Iberian Lynx
  'Casuarius casuarius',            // Southern Cassowary
  'Lemur catta',                    // Ring-tailed Lemur
  'Indri indri',                    // Indri
  'Cryptoprocta ferox',             // Fossa
  'Propithecus verreauxi',          // Verreaux's Sifaka
  'Daubentonia madagascariensis',   // Aye-aye
  'Dromaius novaehollandiae',       // Emu
  'Macropus rufus',                 // Red Kangaroo
  'Vombatus ursinus',               // Wombat
  'Oryx leucoryx',                  // Arabian Oryx (endemic to the Arabian Peninsula)
  'Pongo abelii',                   // Sumatran Orangutan
  'Budorcas taxicolor whitei',      // Takin (Bhutan's national animal)
  'Panthera tigris jacksoni',       // Malayan Tiger (endemic to Peninsular Malaysia)
  'Bubalus arnee',                  // Wild Water Buffalo (~85% of world's wild population at Kaziranga)

  // China, Central Asia & Middle East (additional)
  'Rhinopithecus roxellana',        // Sichuan Golden Snub-nosed Monkey (China only)
  'Rhinopithecus bieti',            // Yunnan Snub-nosed Monkey (narrow NW Yunnan range only)
  'Budorcas taxicolor tibetana',    // Sichuan Takin (Sichuan/Gansu only)
  'Budorcas taxicolor bedfordi',    // Golden Takin (Qinling Mountains, Shaanxi only)
  'Nipponia nippon',                // Crested Ibis (wild population essentially restricted to China)
  'Andrias davidianus',             // Chinese Giant Salamander (China only)
  'Syrmaticus ellioti',             // Elliot's Pheasant (SE China only)
  'Syrmaticus reevesii',            // Reeves's Pheasant (central China only)
  'Tragopan caboti',                // Cabot's Tragopan (SE China only)
  'Lophophorus lhuysii',            // Chinese Monal (Sichuan/Gansu/Shaanxi only)
  'Muntiacus reevesi',              // Reeves's Muntjac (native range southern/eastern China only)
  'Camelus ferus',                  // Wild Bactrian Camel (Gobi Desert, China-Mongolia border only)
  'Bos mutus',                      // Wild Yak (Tibetan Plateau only)
  'Equus kiang',                    // Kiang (Tibetan Plateau only)
  'Procapra picticaudata',          // Tibetan Gazelle (Tibetan Plateau only)
  'Przewalskium albirostris',       // White-lipped Deer (Tibetan Plateau margins only)
  'Neophocaena asiaeorientalis',    // Yangtze Finless Porpoise (Yangtze river system only)
  'Marmota menzbieri',              // Menzbier's Marmot (Western Tian Shan only)
  'Ovis ammon polii',               // Marco Polo Sheep (Pamir plateau only)
  'Cervus elaphus bactrianus',      // Bukhara Deer (narrow Central Asian river valleys only)
  'Equus ferus przewalskii',        // Przewalski's Horse (reintroduced to a handful of Mongolian reserves only)
  'Ursus arctos gobiensis',         // Gobi Bear (restricted to a single Mongolian reserve)
  'Equus hemionus kulan',           // Kulan (restricted to a handful of Central Asian/Mongolian reserves)
  'Acinonyx jubatus venaticus',     // Asiatic Cheetah (restricted to Iran)
  'Equus hemionus onager',          // Persian Onager (restricted to Iran, reintroduced to Israel)
  'Dama mesopotamica',              // Persian Fallow Deer (restricted to Iran/Israel)
  'Panthera pardus nimr',           // Arabian Leopard (Arabian Peninsula only)
  'Arabitragus jayakari',           // Arabian Tahr (Hajar Mountains, Oman/UAE only)
  'Chalcomitra balfouri',           // Socotra Sunbird (Socotra only)
  'Onychognathus frater',           // Socotra Starling (Socotra only)
  'Incana incana',                  // Socotra Warbler (Socotra only)
  'Chamaeleo monachus',             // Socotra Chameleon (Socotra only)
  'Capra falconeri heptneri',       // Bukhara Markhor (restricted to a few mountain ranges on the Tajikistan-Afghanistan border)

  // Africa (additional)
  'Macaca sylvanus',                // Barbary Macaque (fragmented North Africa range only)
  'Cervus elaphus barbarus',        // Barbary Stag (North Africa only)
  'Acinonyx jubatus hecki',         // Saharan Cheetah (restricted to the central Sahara, ~250 individuals)
  'Gorilla beringei graueri',       // Grauer's Gorilla (eastern DR Congo only)
  'Okapia johnstoni',               // Okapi (DR Congo only)
  'Choeropsis liberiensis',         // Pygmy Hippopotamus (Upper Guinea forest, West Africa only)
  'Cephalophus jentinki',           // Jentink's Duiker (a few Upper Guinea forest fragments only)
  'Nanger dama',                    // Dama Gazelle (a few hundred individuals across fragmented Sahara/Sahel range)
  'Equus zebra hartmannae',         // Hartmann's Mountain Zebra (Namibia/SW Angola only)
  'Kobus kob leucotis',             // White-eared Kob (South Sudan/Ethiopia wetlands only)
  'Kobus megaceros',                // Nile Lechwe (Sudd/Gambella wetlands, South Sudan/Ethiopia only)
]);

const species = db.prepare('SELECT * FROM species').all().map((sp) => ({
  ...sp,
  endemic: ENDEMIC_SPECIES.has(sp.scientific_name),
}));
const locations = db.prepare('SELECT * FROM locations').all();
const sightings = db.prepare('SELECT * FROM sightings').all();

const locationsWithSightings = locations.map((loc) => ({
  ...loc,
  sightings: sightings
    .filter((s) => s.location_id === loc.id)
    .map((s) => {
      const sp = species.find((sp) => sp.id === s.species_id);
      return {
        species_id: s.species_id,
        common_name: sp?.common_name,
        category: sp?.category,
        image_url: sp?.image_url,
        endemic: sp?.endemic ?? false,
        start_month: s.start_month,
        end_month: s.end_month,
        likelihood: s.likelihood,
        notes: s.notes,
      };
    }),
}));

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'species.json'), JSON.stringify(species, null, 2));
fs.writeFileSync(path.join(outDir, 'locations.json'), JSON.stringify(locationsWithSightings, null, 2));

console.log('Exported', species.length, 'species and', locations.length, 'locations to src/data/');
db.close();
