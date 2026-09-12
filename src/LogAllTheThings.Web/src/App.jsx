import { useEffect, useState } from 'react';
import { LayoutDashboard, Plus } from 'lucide-react';
import { fetchLogs, createLog, deleteLog, updateLog } from './api';
import Dashboard from './components/dashboard/Dashboard';
import LogForm from './components/LogForm';

const defaultTypes = ['Medicine', 'Food', 'Custom'];

function sortLogsByTimestamp(logList) {
  return [...logList].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export default function App() {
  const [logs, setLogs] = useState([]);
  const [selectedType, setSelectedType] = useState('Medicine');
  const [activeView, setActiveView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    try {
      const entries = await fetchLogs();
      setLogs(sortLogsByTimestamp(entries));
      if (!entries.length) setActiveView('add');
      setError('');
    } catch (err) {
      setError('Unable to load logs.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(entry) {
    try {
      const created = await createLog(entry);
      setLogs(prev => sortLogsByTimestamp([created, ...prev]));
      setError('');
      return true;
    } catch (err) {
      setError('Unable to save log.');
      return false;
    }
  }

  async function handleUpdate(id, entry) {
    try {
      const updated = await updateLog(id, entry);
      setLogs(current => sortLogsByTimestamp(current.map(log => log.id === id ? updated : log)));
      setError('');
      return true;
    } catch (err) {
      setError('Unable to update log.');
      return false;
    }
  }

  async function handleDelete(id) {
    try {
      await deleteLog(id);
      setLogs(current => current.filter(log => log.id !== id));
      setError('');
      return true;
    } catch (err) {
      setError('Unable to delete log.');
      return false;
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-mark" aria-hidden="true">LT</div>
        <div><h1>Log All The Things</h1><p>Track medicine, food, and everyday events.</p></div>
      </header>
      <nav className="view-switcher" aria-label="Application views">
        <button type="button" aria-pressed={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')}><LayoutDashboard size={18} /> Dashboard</button>
        <button type="button" aria-pressed={activeView === 'add'} onClick={() => setActiveView('add')}><Plus size={18} /> Add log</button>
      </nav>
      {activeView === 'dashboard' ? (
        <Dashboard logs={logs} loading={loading} error={error} onRetry={loadLogs} onAddLog={() => setActiveView('add')} onUpdate={handleUpdate} onDelete={handleDelete} />
      ) : (
        <main className="add-log-view">
          {error && <div className="error-message" role="alert">{error}</div>}
          <section className="controls">
            <div className="tabs" aria-label="Log type">
              {defaultTypes.map(type => <button type="button" key={type} aria-pressed={selectedType === type} onClick={() => setSelectedType(type)}>{type}</button>)}
            </div>
            <LogForm type={selectedType} onSubmit={handleCreate} />
          </section>
        </main>
      )}
    </div>
  );
}
