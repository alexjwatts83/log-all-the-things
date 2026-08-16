import { useEffect, useState } from 'react';
import { fetchLogs, createLog } from './api';
import LogForm from './components/LogForm';
import LogList from './components/LogList';

const defaultTypes = ['Medicine', 'Food', 'Custom'];

export default function App() {
  const [logs, setLogs] = useState([]);
  const [selectedType, setSelectedType] = useState('Medicine');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    try {
      const entries = await fetchLogs();
      setLogs(entries);
    } catch (err) {
      setError('Unable to load logs.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(entry) {
    try {
      const created = await createLog(entry);
      setLogs(prev => [created, ...prev]);
      setError('');
      return true;
    } catch (err) {
      setError('Unable to save log.');
      return false;
    }
  }

  return (
    <div className="app-shell">
      <header>
        <h1>Log All The Things</h1>
        <p>Track medicine, food, and custom events in one place.</p>
      </header>

      <section className="controls">
        <div className="tabs">
          {defaultTypes.map(type => (
            <button
              key={type}
              className={selectedType === type ? 'active' : ''}
              onClick={() => setSelectedType(type)}
            >
              {type}
            </button>
          ))}
        </div>
        <LogForm type={selectedType} onSubmit={handleCreate} />
      </section>

      <section className="history">
        <div className="history-header">
          <h2>Recent logs</h2>
          <span>{loading ? 'Loading…' : `${logs.length} entries`}</span>
        </div>
        {error && <div className="error-message">{error}</div>}
        <LogList logs={logs} />
      </section>
    </div>
  );
}
