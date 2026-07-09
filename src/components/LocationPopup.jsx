import { formatMonthRange } from '../utils/months';

export default function LocationPopup({ location }) {
  return (
    <div className="popup-content">
      <div className="popup-header">
        <h3>{location.name}</h3>
        <p className="popup-region">
          {location.region ? `${location.region}, ` : ''}{location.country}
        </p>
        {location.description && <p className="popup-desc">{location.description}</p>}
      </div>
      <ul className="popup-sightings">
        {[...location.sightings]
          .sort((a, b) => (b.endemic ? 1 : 0) - (a.endemic ? 1 : 0))
          .map((s, i) => (
            <li key={i} className={`sighting-card${s.endemic ? ' sighting-endemic' : ''}`}>
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
          ))}
      </ul>
    </div>
  );
}
