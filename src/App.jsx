import { useMemo, useState } from 'react';
import FilterPanel from './components/FilterPanel';
import MapView from './components/MapView';
import locationsData from './data/locations.json';
import './App.css';

const ALL_CATEGORIES = [...new Set(locationsData.flatMap((l) => l.sightings.map((s) => s.category)))];

export default function App() {
  const [selectedCategories, setSelectedCategories] = useState(ALL_CATEGORIES);
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const filteredLocations = useMemo(() => {
    return locationsData
      .map((loc) => {
        const matchingSightings = loc.sightings.filter((s) => selectedCategories.includes(s.category));
        return { ...loc, sightings: matchingSightings };
      })
      .filter((loc) => loc.sightings.length > 0);
  }, [selectedCategories]);

  return (
    <div className="app-layout">
      <button
        type="button"
        className="menu-toggle"
        aria-label={isMenuOpen ? 'Close filters' : 'Open filters'}
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((prev) => !prev)}
      >
        <span className="menu-toggle-icon" />
      </button>
      <FilterPanel
        categories={ALL_CATEGORIES}
        selectedCategories={selectedCategories}
        onToggleCategory={toggleCategory}
        resultCount={filteredLocations.length}
        isOpen={isMenuOpen}
      />
      <MapView locations={filteredLocations} />
    </div>
  );
}
