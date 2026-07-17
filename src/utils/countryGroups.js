// Maps the free-form `country` strings used in locations.json onto a
// canonical display name, so entries that refer to the same real-world
// country under different spellings (or UK constituent countries) group
// together under one label/modal instead of being split apart.
const COUNTRY_ALIASES = {
  USA: 'United States',
  UAE: 'United Arab Emirates',
  DRC: 'DR Congo',
  'Czech Republic': 'Czechia',
  'Cabo Verde': 'Cape Verde',
  Turkey: 'Türkiye',
  'Turks and Caicos': 'Turks and Caicos Islands',
  'St Kitts and Nevis': 'Saint Kitts and Nevis',
  'St Vincent and the Grenadines': 'Saint Vincent and the Grenadines',
  'St. Vincent and the Grenadines': 'Saint Vincent and the Grenadines',
  'St. Lucia': 'Saint Lucia',
  'US Virgin Islands': 'United States Virgin Islands',
  England: 'United Kingdom',
  Scotland: 'United Kingdom',
  Wales: 'United Kingdom',
  'Northern Ireland': 'United Kingdom',
  'Ascension Island': 'Saint Helena, Ascension and Tristan da Cunha',
  'St Helena': 'Saint Helena, Ascension and Tristan da Cunha',
};

export function canonicalCountry(rawCountry) {
  return COUNTRY_ALIASES[rawCountry] || rawCountry;
}
