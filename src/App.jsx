import { useMemo, useRef, useState } from 'react';
import FilterPanel from './components/FilterPanel';
import MapView from './components/MapView';
import CountryModal from './components/CountryModal';
import locationsData from './data/locations.json';
import './App.css';

export default function App() {
  const [showWonders, setShowWonders] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showDiveSites, setShowDiveSites] = useState(true);
  const [showParks, setShowParks] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [peekOnHover, setPeekOnHover] = useState(true);
  const mapRef = useRef(null);

  const filteredLocations = useMemo(() => {
    return locationsData.filter((loc) => {
      if (loc.type === 'landmark') return loc.wonder ? showWonders : showLandmarks;
      if (loc.type === 'dive') return showDiveSites;
      if (loc.type === 'park') return showParks;
      return true;
    });
  }, [showWonders, showLandmarks, showDiveSites, showParks]);

  const handleSelectLocation = (loc) => {
    mapRef.current?.flyTo([loc.lat, loc.lng], 8, { duration: 1.2 });
    setSelectedCountry(null);
  };

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
      <MapView
        locations={filteredLocations}
        onSelectCountry={setSelectedCountry}
        onMapReady={(map) => {
          mapRef.current = map;
        }}
        hoveredLocation={hoveredLocation}
      />
      {selectedCountry && (
        <CountryModal
          country={selectedCountry}
          locationsData={locationsData}
          onClose={() => setSelectedCountry(null)}
          onSelectLocation={handleSelectLocation}
          onHoverLocation={setHoveredLocation}
          peekOnHover={peekOnHover}
          onTogglePeekOnHover={() => setPeekOnHover((prev) => !prev)}
        />
      )}
    </div>
  );
}
