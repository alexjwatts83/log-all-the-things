import { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
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
  const [toast, setToast] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = globalThis.setTimeout(() => setToast(''), 3000);
    return () => globalThis.clearTimeout(timeoutId);
  }, [toast]);

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
      setToast(`${entry.type} log saved`);
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
      <main className="main-content">
        {error && <div className="error-message" role="alert">{error}</div>}
        <div className="log-card-container">
          <div className="log-type-tabs" role="tablist" aria-label="Main view and log types">
            <button
              type="button"
              role="tab"
              aria-selected={activeView === 'dashboard'}
              onClick={() => setActiveView('dashboard')}
            >
              Dashboard
            </button>
            {defaultTypes.map(type => (
              <button
                type="button"
                key={type}
                role="tab"
                aria-selected={activeView === 'add' && selectedType === type}
                onClick={() => {
                  setSelectedType(type);
                  setActiveView('add');
                }}
              >
                {type}
              </button>
            ))}
          </div>
          {activeView === 'dashboard' ? (
            <div className="tab-content dashboard-tab-content">
              <Dashboard logs={logs} loading={loading} error={error} onRetry={loadLogs} onAddLog={() => { setSelectedType('Medicine'); setActiveView('add'); }} onUpdate={handleUpdate} onDelete={handleDelete} />
            </div>
          ) : (
            <div className="tab-content">
              <LogForm type={selectedType} onSubmit={handleCreate} />
            </div>
          )}
        </div>
      </main>
      {toast && (
        <div className="success-toast" role="status" aria-live="polite">
          <CheckCircle2 size={20} aria-hidden="true" />
          <span>{toast}</span>
          <button type="button" onClick={() => setToast('')} aria-label="Dismiss notification" title="Dismiss">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
