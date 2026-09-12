import { useState } from 'react';
import { ChevronDown, Plus, RefreshCw } from 'lucide-react';
import { buildDailySeries, buildMedicineSummary, buildSummaryMetrics, buildTypeBreakdown, filterLogsByRange } from '../../dashboardMetrics';
import { logTypes } from '../../logTypes';
import LogList from '../LogList';
import ActivityChart from './ActivityChart';
import MedicineSummary from './MedicineSummary';
import SummaryMetrics from './SummaryMetrics';
import TimeRangeControl from './TimeRangeControl';
import TypeBreakdown from './TypeBreakdown';

export default function Dashboard({ logs, loading, error, onRetry, onAddLog, onUpdate, onDelete }) {
  const [timeRange, setTimeRange] = useState('30');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAll, setShowAll] = useState(false);
  const rangedLogs = filterLogsByRange(logs, timeRange);
  const recentLogs = typeFilter === 'all' ? rangedLogs : rangedLogs.filter(log => log.typeId === Number(typeFilter));
  const visibleLogs = showAll ? recentLogs : recentLogs.slice(0, 20);
  const summary = buildSummaryMetrics(rangedLogs);
  const medicineSummary = buildMedicineSummary(rangedLogs);

  if (loading) return <div className="dashboard-loading" role="status">Loading dashboard...</div>;
  if (error && !logs.length) return <div className="dashboard-empty" role="alert"><h2>Dashboard unavailable</h2><p>{error}</p><button type="button" className="primary-button" onClick={onRetry}><RefreshCw size={17} /> Retry</button></div>;
  if (!logs.length) return <div className="dashboard-empty"><h2>Start with your first log</h2><p>Your activity overview will appear here as soon as something is recorded.</p><button type="button" className="primary-button" onClick={onAddLog}><Plus size={17} /> Add first log</button></div>;

  return (
    <div className="dashboard">
      <div className="dashboard-toolbar"><div><p className="eyebrow">Overview</p><h1>Your activity</h1></div><TimeRangeControl value={timeRange} onChange={value => { setTimeRange(value); setShowAll(false); }} /></div>
      <SummaryMetrics metrics={summary} />
      {!rangedLogs.length ? <div className="dashboard-empty compact"><h2>No activity in this period</h2><p>Choose a longer range or add a new log.</p></div> : (
        <><ActivityChart data={buildDailySeries(rangedLogs, timeRange)} /><div className={`dashboard-split ${medicineSummary.eventCount ? '' : 'single'}`}><TypeBreakdown data={buildTypeBreakdown(rangedLogs)} />{medicineSummary.eventCount > 0 && <MedicineSummary summary={medicineSummary} />}</div></>
      )}
      <section className="dashboard-section" aria-labelledby="recent-heading">
        <div className="section-heading recent-heading"><div><p className="eyebrow">History</p><h2 id="recent-heading">Recent activity</h2></div><div className="type-filter" aria-label="Filter recent activity by type"><button type="button" aria-pressed={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>All</button>{logTypes.map(type => <button type="button" key={type.id} aria-pressed={typeFilter === String(type.id)} onClick={() => setTypeFilter(String(type.id))}>{type.name}</button>)}</div></div>
        <LogList logs={visibleLogs} onUpdate={onUpdate} onDelete={onDelete} emptyMessage="No matching activity in this period." />
        {!showAll && recentLogs.length > 20 && <button type="button" className="show-all-button" onClick={() => setShowAll(true)}><ChevronDown size={17} /> Show all {recentLogs.length} entries</button>}
      </section>
    </div>
  );
}