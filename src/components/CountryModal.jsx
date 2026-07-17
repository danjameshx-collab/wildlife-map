import { useEffect, useMemo, useRef, useState } from 'react';
import { canonicalCountry } from '../utils/countryGroups';

const SECTION_DEFS = [
  { key: 'wonders', label: 'Wonders of the World', accent: '#a855f7', icon: '✨' },
  { key: 'landmarks', label: 'Landmarks', accent: '#eab308', icon: '🏛️' },
  { key: 'parks', label: 'National Parks', accent: '#2aaa50', icon: '🌳' },
  { key: 'dive', label: 'Dive Sites', accent: '#1aa6c9', icon: '🤿' },
];

function thumbnailFor(loc) {
  if (loc.type === 'landmark') return loc.image_url || null;
  const withPhoto = loc.sightings.find((s) => s.image_url);
  return withPhoto ? withPhoto.image_url : null;
}

function LocationCard({ loc, accent, icon, onSelect, onHover }) {
  const image = thumbnailFor(loc);
  const endemicCount = loc.type !== 'landmark' ? loc.sightings.filter((s) => s.endemic).length : 0;

  return (
    <button
      type="button"
      className="country-card"
      onClick={() => onSelect(loc)}
      onMouseEnter={() => onHover(loc)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(loc)}
      onBlur={() => onHover(null)}
    >
      <div className="country-card-media" style={{ background: image ? undefined : `linear-gradient(155deg, ${accent}55, ${accent}22)` }}>
        {image ? (
          <img src={image} alt={loc.name} loading="lazy" />
        ) : (
          <span className="country-card-fallback-icon">{icon}</span>
        )}
        <div className="country-card-overlay">
          <strong>{loc.name}</strong>
          {loc.region && <span>{loc.region}</span>}
        </div>
        {loc.type !== 'landmark' && (
          <div className="country-card-badges">
            <span className="country-card-badge">{loc.sightings.length} species</span>
            {endemicCount > 0 && (
              <span className="country-card-badge country-card-badge-endemic">{endemicCount} endemic</span>
            )}
          </div>
        )}
        {loc.wonder && <span className="country-card-wonder-tag">Wonder</span>}
      </div>
    </button>
  );
}

export default function CountryModal({
  country,
  locationsData,
  onClose,
  onSelectLocation,
  onHoverLocation,
  hoveredLocation,
  peekOnHover,
  onTogglePeekOnHover,
}) {
  const sectionRefs = useRef({});
  const bodyRef = useRef(null);

  const countryLocations = useMemo(
    () => locationsData.filter((l) => canonicalCountry(l.country) === country),
    [locationsData, country]
  );

  const grouped = useMemo(() => {
    const g = { wonders: [], landmarks: [], parks: [], dive: [] };
    for (const loc of countryLocations) {
      if (loc.type === 'landmark') {
        (loc.wonder ? g.wonders : g.landmarks).push(loc);
      } else if (loc.type === 'park') {
        g.parks.push(loc);
      } else if (loc.type === 'dive') {
        g.dive.push(loc);
      }
    }
    return g;
  }, [countryLocations]);

  const heroImage = useMemo(() => {
    for (const key of ['wonders', 'landmarks', 'parks', 'dive']) {
      const found = grouped[key].map(thumbnailFor).find(Boolean);
      if (found) return found;
    }
    return null;
  }, [grouped]);

  const activeSections = SECTION_DEFS.filter((def) => grouped[def.key].length > 0);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    // Capture phase: Leaflet's own keyboard handler listens for Escape too
    // (to close marker popups) and doesn't bubble reliably, so we intercept
    // it on the way down instead of waiting for it to bubble back up.
    window.addEventListener('keydown', handleKey, true);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKey, true);
    };
    // Deliberately omit `onClose` from deps: it's a fresh closure on every
    // App render (App re-renders whenever hover state changes), and if this
    // effect re-ran on that churn its cleanup would fire mid-hover, wiping
    // the map highlight the instant it appeared. Escape always calls
    // whatever onClose is current via the closure below regardless.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Runs its cleanup only on true unmount (empty deps), so hovering a card
  // doesn't itself clear the highlight via App re-render churn - only
  // actually closing the modal does.
  useEffect(() => {
    return () => onHoverLocation(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToSection = (key) => {
    sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Debounced separately from `hoveredLocation` itself: sweeping the mouse
  // across a grid briefly clears hover as it crosses the gap between two
  // cards, and reacting to that instantly made the modal snap back to full
  // size and immediately shrink again for every card - a "flicker" between
  // hovered cards. Entering peek mode is instant; leaving it waits a beat
  // to see whether another card picks the hover straight back up.
  const [isPeeking, setIsPeeking] = useState(false);
  useEffect(() => {
    if (!peekOnHover) {
      setIsPeeking(false);
      return undefined;
    }
    if (hoveredLocation) {
      setIsPeeking(true);
      return undefined;
    }
    const timer = setTimeout(() => setIsPeeking(false), 260);
    return () => clearTimeout(timer);
  }, [hoveredLocation, peekOnHover]);

  return (
    <div className={`country-modal-backdrop${isPeeking ? ' is-peeking' : ''}`} onClick={onClose}>
      <div className={`country-modal${isPeeking ? ' is-peeking' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div
          className="country-modal-hero"
          style={heroImage ? { backgroundImage: `url(${heroImage})` } : undefined}
        >
          <button type="button" className="country-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
          <div className="country-modal-hero-content">
            <h2>{country}</h2>
            <div className="country-modal-stats">
              {activeSections.map((def) => (
                <span key={def.key} className="country-modal-stat" style={{ '--stat-accent': def.accent }}>
                  <span className="country-modal-stat-dot" />
                  {grouped[def.key].length} {def.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="country-modal-nav">
          {activeSections.length > 1 && (
            <div className="country-modal-nav-chips">
              {activeSections.map((def) => (
                <button
                  key={def.key}
                  type="button"
                  className="country-modal-nav-chip"
                  style={{ '--chip-accent': def.accent }}
                  onClick={() => scrollToSection(def.key)}
                >
                  {def.icon} {def.label} <span>{grouped[def.key].length}</span>
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            className={`country-modal-peek-toggle${peekOnHover ? ' is-on' : ''}`}
            onClick={onTogglePeekOnHover}
            title="When on, hovering a card shrinks the modal and clears the map so you can see the highlighted pin"
          >
            <span className="country-modal-peek-toggle-dot" />
            Peek on hover
          </button>
        </div>

        <div className="country-modal-body" ref={bodyRef}>
          {activeSections.map((def) => (
            <section
              key={def.key}
              className="country-modal-section"
              ref={(el) => {
                sectionRefs.current[def.key] = el;
              }}
            >
              <h3 className="country-modal-section-title" style={{ '--section-accent': def.accent }}>
                <span className="country-modal-section-dot" />
                {def.label}
                <span className="country-modal-section-count">{grouped[def.key].length}</span>
              </h3>
              <div className="country-modal-grid">
                {grouped[def.key].map((loc) => (
                  <LocationCard
                    key={loc.id}
                    loc={loc}
                    accent={def.accent}
                    icon={def.icon}
                    onSelect={onSelectLocation}
                    onHover={onHoverLocation}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
