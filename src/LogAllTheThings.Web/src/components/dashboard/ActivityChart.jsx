import { logTypes } from '../../logTypes';

const formatDate = value => new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export default function ActivityChart({ data }) {
  const totals = data.map(day => logTypes.reduce((sum, type) => sum + day[type.name], day.Other));
  const total = totals.reduce((sum, value) => sum + value, 0);
  const maximum = Math.max(1, ...totals);
  const labelInterval = Math.max(1, Math.ceil(data.length / 6));

  return (
    <section className="dashboard-section" aria-labelledby="activity-heading">
      <div className="section-heading"><div><p className="eyebrow">Timeline</p><h2 id="activity-heading">Activity trend</h2></div><span>{total} logged events</span></div>
      <div className="activity-chart" role="img" aria-label={`Activity chart showing ${total} events across ${data.length} periods`}>
        <div className="activity-plot">
          {data.map((day, index) => {
            const dayTotal = totals[index];
            return (
              <div className="activity-column" key={day.date} title={`${formatDate(day.date)}: ${dayTotal} events`}>
                <div className="activity-stack" style={{ height: `${(dayTotal / maximum) * 100}%` }}>
                  {logTypes.map(type => day[type.name] > 0 && (
                    <span key={type.id} style={{ backgroundColor: type.color, flexGrow: day[type.name] }} aria-hidden="true" />
                  ))}
                  {day.Other > 0 && <span style={{ backgroundColor: '#64748b', flexGrow: day.Other }} aria-hidden="true" />}
                </div>
                {(index % labelInterval === 0 || index === data.length - 1) && <small>{formatDate(day.date)}</small>}
              </div>
            );
          })}
        </div>
        <div className="chart-legend" aria-hidden="true">
          {logTypes.map(type => <span key={type.id}><i style={{ backgroundColor: type.color }} />{type.name}</span>)}
          <span><i style={{ backgroundColor: '#64748b' }} />Other</span>
        </div>
      </div>
    </section>
  );
}