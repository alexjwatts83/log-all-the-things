export default function TypeBreakdown({ data }) {
  return (
    <section className="dashboard-section" aria-labelledby="type-heading">
      <div className="section-heading"><div><p className="eyebrow">Composition</p><h2 id="type-heading">Log types</h2></div></div>
      <div className="breakdown-list">
        {data.map(type => (
          <div className="breakdown-row" key={type.name}>
            <div><span className="legend-dot" style={{ backgroundColor: type.color }} /><strong>{type.name}</strong><span>{type.count}</span></div>
            <div className="progress-track" aria-label={`${type.name}: ${type.percentage}%`}><span style={{ width: `${type.percentage}%`, backgroundColor: type.color }} /></div>
            <small>{type.percentage}%</small>
          </div>
        ))}
      </div>
    </section>
  );
}