export default function FilterPanel({
  categories,
  selectedCategories,
  onToggleCategory,
  resultCount,
  isOpen,
  onClose,
}) {
  return (
    <aside className={`filter-panel${isOpen ? ' filter-panel-open' : ''}`}>
      <div className="panel-header">
        <div className="panel-title-row">
          <span className="panel-icon">🐠</span>
          <h1>Wildlife Map</h1>
          <button
            type="button"
            className="panel-close"
            aria-label="Close filters"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <p className="subtitle">
          <span className="result-count">{resultCount}</span>{' '}
          location{resultCount === 1 ? '' : 's'} found
        </p>
      </div>

      <div className="panel-body">
        <section>
          <h2>Species Type</h2>
          <div className="category-list">
            {categories.map((cat) => (
              <label key={cat} className="category-item">
                <span className={`cat-toggle${selectedCategories.includes(cat) ? ' cat-on' : ''}`} />
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat)}
                  onChange={() => onToggleCategory(cat)}
                />
                {cat}
              </label>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
