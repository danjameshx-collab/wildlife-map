import { useMemo, useState } from 'react';
import FilterPanel from './components/FilterPanel';
import MapView from './components/MapView';
import locationsData from './data/locations.json';
import './App.css';

export default function App() {
  const [showWonders, setShowWonders] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showDiveSites, setShowDiveSites] = useState(true);
  const [showParks, setShowParks] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  const filteredLocations = useMemo(() => {
    return locationsData.filter((loc) => {
      if (loc.type === 'landmark') return loc.wonder ? showWonders : showLandmarks;
      if (loc.type === 'dive') return showDiveSites;
      if (loc.type === 'park') return showParks;
      return true;
    });
  }, [showWonders, showLandmarks, showDiveSites, showParks]);

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
        showWonders={showWonders}
        onToggleWonders={() => setShowWonders((prev) => !prev)}
        showLandmarks={showLandmarks}
        onToggleLandmarks={() => setShowLandmarks((prev) => !prev)}
        showDiveSites={showDiveSites}
        onToggleDiveSites={() => setShowDiveSites((prev) => !prev)}
        showParks={showParks}
        onToggleParks={() => setShowParks((prev) => !prev)}
        resultCount={filteredLocations.length}
        isOpen={isMenuOpen}
      />
      <MapView locations={filteredLocations} />
    </div>
  );
}
