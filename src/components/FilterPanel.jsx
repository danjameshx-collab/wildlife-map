export default function FilterPanel({
  showWonders,
  onToggleWonders,
  showLandmarks,
  onToggleLandmarks,
  showDiveSites,
  onToggleDiveSites,
  showParks,
  onToggleParks,
  showFood,
  onToggleFood,
  resultCount,
  isOpen,
}) {
  return (
    <aside className={`filter-panel${isOpen ? '' : ' filter-panel-collapsed'}`}>
      <div className="panel-header">
        <div className="panel-title-row">
          <h1>Super World Map 🌐</h1>
        </div>
        <p className="subtitle">
          <span className="result-count">{resultCount}</span>{' '}
          location{resultCount === 1 ? '' : 's'} found
        </p>
      </div>

      <div className="panel-body">
        <section>
          <h2>Map Layers</h2>
          <div className="category-list">
            <label className="category-item">
              <span className={`cat-toggle cat-toggle-wonder${showWonders ? ' cat-on' : ''}`} />
              <input type="checkbox" checked={showWonders} onChange={onToggleWonders} />
              Wonders of the World
            </label>
            <label className="category-item">
              <span className={`cat-toggle cat-toggle-landmark${showLandmarks ? ' cat-on' : ''}`} />
              <input type="checkbox" checked={showLandmarks} onChange={onToggleLandmarks} />
              Landmarks
            </label>
            <label className="category-item">
              <span className={`cat-toggle cat-toggle-dive${showDiveSites ? ' cat-on' : ''}`} />
              <input type="checkbox" checked={showDiveSites} onChange={onToggleDiveSites} />
              Dive Sites
            </label>
            <label className="category-item">
              <span className={`cat-toggle cat-toggle-park${showParks ? ' cat-on' : ''}`} />
              <input type="checkbox" checked={showParks} onChange={onToggleParks} />
              National Parks
            </label>
            <label className="category-item">
              <span className={`cat-toggle cat-toggle-food${showFood ? ' cat-on' : ''}`} />
              <input type="checkbox" checked={showFood} onChange={onToggleFood} />
              Food & Dishes
            </label>
          </div>
        </section>
      </div>
    </aside>
  );
}
