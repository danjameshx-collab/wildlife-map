import { formatMonthRange } from '../utils/months';
import { canonicalCountry } from '../utils/countryGroups';
import { countryCountFor, isRareSighting } from '../utils/speciesRarity';

function CountryLink({ location, onSelectCountry }) {
  return (
    <button
      type="button"
      className="popup-country-link"
      onClick={() => onSelectCountry(canonicalCountry(location.country))}
    >
      {location.country}
    </button>
  );
}

function LandmarkPopup({ location, onSelectCountry }) {
  return (
    <div className="popup-content">
      <div className="popup-header">
        <h3>{location.name}</h3>
        <p className="popup-region">
          {location.region ? `${location.region}, ` : ''}
          <CountryLink location={location} onSelectCountry={onSelectCountry} />
        </p>
      </div>
      {location.image_url && (
        <img
          className="landmark-photo"
          src={location.image_url}
          alt={location.name}
          loading="lazy"
        />
      )}
      <div className="landmark-body">
        {location.description && <p className="popup-desc">{location.description}</p>}
        {location.highlights && location.highlights.length > 0 && (
          <>
            <h4 className="landmark-why-title">Why people love it</h4>
            <ul className="landmark-highlights">
              {location.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function FoodPopup({ location, onSelectCountry }) {
  return (
    <div className="popup-content">
      <div className="popup-header">
        <h3>{location.name}</h3>
        <p className="popup-region">
          {location.region ? `${location.region}, ` : ''}
          <CountryLink location={location} onSelectCountry={onSelectCountry} />
        </p>
      </div>
      <ul className="popup-sightings">
        {location.dishes.map((d, i) => (
          <li key={i} className="sighting-card">
            {d.image_url && (
              <img className="sighting-photo" src={d.image_url} alt={d.name} loading="lazy" />
            )}
            <div className="sighting-body">
              <div className="sighting-header">
                <strong>{d.name}</strong>
                <span className={`food-scope-badge food-scope-${d.scope}`}>
                  {d.scope === 'national' ? 'National' : 'Regional'}
                </span>
                <span className="sighting-category">{d.category}</span>
              </div>
              {d.description && <p className="popup-notes">{d.description}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function LocationPopup({ location, onSelectCountry }) {
  if (location.type === 'landmark') {
    return <LandmarkPopup location={location} onSelectCountry={onSelectCountry} />;
  }
  if (location.type === 'food') {
    return <FoodPopup location={location} onSelectCountry={onSelectCountry} />;
  }

  return (
    <div className="popup-content">
      <div className="popup-header">
        <h3>{location.name}</h3>
        <p className="popup-region">
          {location.region ? `${location.region}, ` : ''}
          <CountryLink location={location} onSelectCountry={onSelectCountry} />
        </p>
        {location.description && <p className="popup-desc">{location.description}</p>}
      </div>
      <ul className="popup-sightings">
        {[...location.sightings]
          .sort((a, b) => countryCountFor(a.species_id) - countryCountFor(b.species_id))
          .map((s, i) => {
            const rare = isRareSighting(s);
            return (
            <li
              key={i}
              className={`sighting-card${s.endemic ? ' sighting-endemic' : ''}${rare ? ' sighting-rare' : ''}`}
            >
              {s.image_url && (
                <img
                  className="sighting-photo"
                  src={s.image_url}
                  alt={s.common_name}
                  loading="lazy"
                />
              )}
              <div className="sighting-body">
                <div className="sighting-header">
                  <strong>{s.common_name}</strong>
                  {s.endemic && <span className="sighting-endemic-badge">ENDEMIC</span>}
                  {rare && <span className="sighting-rare-badge">RARE</span>}
                  <span className="sighting-category">{s.category}</span>
                </div>
                <div className="sighting-meta">
                  <span className="sighting-months">{formatMonthRange(s.start_month, s.end_month)}</span>
                  {s.likelihood && (
                    <span className={`sighting-likelihood likelihood-${s.likelihood}`}>
                      {s.likelihood}
                    </span>
                  )}
                </div>
                {s.notes && <p className="popup-notes">{s.notes}</p>}
              </div>
            </li>
            );
          })}
      </ul>
    </div>
  );
}
