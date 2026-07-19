import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const TYPE_META = {
  dive: { label: 'Dive Site', color: '#1aa6c9' },
  park: { label: 'National Park', color: '#2aaa50' },
  landmark: { label: 'Landmark', color: '#eab308' },
  wonder: { label: 'Wonder', color: '#a855f7' },
  food: { label: 'Food & Dishes', color: '#6b7280' },
  dish: { label: 'Signature Dish', color: '#9ca3af' },
  species: { label: 'Wildlife', color: '#dc2626' },
};

function metaFor(loc) {
  if (loc.type === 'landmark') return loc.wonder ? TYPE_META.wonder : TYPE_META.landmark;
  return TYPE_META[loc.type] || TYPE_META.dive;
}

// Country-level food/landmark pins are often named after the place itself
// (e.g. a "Thailand" pin in "Thailand"), so avoid a redundant "X · X".
function subEntryLabel(loc, place) {
  return place && place !== loc.name ? `${loc.name} · ${place}` : loc.name;
}

// Builds a flat, searchable index: one entry per location, plus extra
// entries per food dish / per sighted species so a search for "pad thai"
// or "whale shark" surfaces the place that has it, not just place names.
function buildIndex(locationsData) {
  const entries = [];

  for (const loc of locationsData) {
    const meta = metaFor(loc);
    const place = [loc.region, loc.country].filter(Boolean).join(', ');
    entries.push({
      key: `loc-${loc.id}`,
      loc,
      label: loc.name,
      sublabel: place,
      typeLabel: meta.label,
      color: meta.color,
      image: loc.type === 'landmark' ? loc.image_url : null,
      searchText: `${loc.name} ${place}`.toLowerCase(),
    });

    if (loc.type === 'food' && loc.dishes) {
      for (const dish of loc.dishes) {
        entries.push({
          key: `dish-${loc.id}-${dish.name}`,
          loc,
          label: dish.name,
          sublabel: subEntryLabel(loc, place),
          typeLabel: TYPE_META.dish.label,
          color: TYPE_META.dish.color,
          image: dish.image_url,
          searchText: dish.name.toLowerCase(),
        });
      }
    }

    if (loc.sightings) {
      const seen = new Set();
      for (const s of loc.sightings) {
        if (!s.common_name || seen.has(s.common_name)) continue;
        seen.add(s.common_name);
        entries.push({
          key: `species-${loc.id}-${s.common_name}`,
          loc,
          label: s.common_name,
          sublabel: subEntryLabel(loc, place),
          typeLabel: TYPE_META.species.label,
          color: TYPE_META.species.color,
          image: s.image_url,
          searchText: s.common_name.toLowerCase(),
        });
      }
    }
  }

  return entries;
}

function highlight(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function SearchBar({ locationsData, onSelectLocation }) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropdownRect, setDropdownRect] = useState(null);
  const containerRef = useRef(null);
  const wrapRef = useRef(null);

  const index = useMemo(() => buildIndex(locationsData), [locationsData]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const primary = [];
    const secondary = [];
    for (const entry of index) {
      if (entry.searchText.startsWith(q)) primary.push(entry);
      else if (entry.searchText.includes(q)) secondary.push(entry);
      if (primary.length >= 8) break;
    }
    return [...primary, ...secondary].slice(0, 8);
  }, [index, query]);

  const isOpen = isFocused && query.trim().length > 0;

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        !e.target.closest('.search-results')
      ) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // The dropdown is portaled to <body> (position: fixed) because the
  // sidebar has overflow: hidden for its slide-in/out animation, which
  // would otherwise clip a normally-positioned absolute dropdown.
  useEffect(() => {
    if (!isOpen) return undefined;
    const update = () => {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (rect) setDropdownRect(rect);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [isOpen]);

  const selectEntry = (entry) => {
    if (!entry) return;
    onSelectLocation(entry.loc);
    setQuery('');
    setIsFocused(false);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectEntry(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      e.currentTarget.blur();
    }
  };

  return (
    <div className="search-bar" ref={containerRef}>
      <div ref={wrapRef} className={`search-input-wrap${isFocused ? ' is-focused' : ''}`}>
        <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search places, dishes, wildlife..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            type="button"
            className="search-clear"
            aria-label="Clear search"
            onClick={() => {
              setQuery('');
              setIsFocused(true);
            }}
          >
            ✕
          </button>
        )}
      </div>

      {isOpen &&
        dropdownRect &&
        createPortal(
          <div
            className="search-results"
            role="listbox"
            style={{
              position: 'fixed',
              top: dropdownRect.bottom + 8,
              left: dropdownRect.left,
              width: dropdownRect.width,
            }}
          >
            {results.length === 0 ? (
              <div className="search-empty">No matches for "{query}"</div>
            ) : (
              results.map((entry, i) => (
                <button
                  type="button"
                  key={entry.key}
                  role="option"
                  aria-selected={i === activeIndex}
                  className={`search-result${i === activeIndex ? ' is-active' : ''}`}
                  style={{ '--result-accent': entry.color }}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => selectEntry(entry)}
                >
                  <span className="search-result-media">
                    {entry.image ? (
                      <img src={entry.image} alt="" loading="lazy" />
                    ) : (
                      <span className="search-result-dot" />
                    )}
                  </span>
                  <span className="search-result-text">
                    <span className="search-result-label">{highlight(entry.label, query)}</span>
                    <span className="search-result-sublabel">
                      {entry.sublabel && <>{entry.sublabel} · </>}
                      {entry.typeLabel}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
