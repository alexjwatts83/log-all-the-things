export default function LogList({ logs }) {
  if (!logs.length) {
    return <p className="empty-state">No logs yet. Add a medicine, food, or custom event log.</p>;
  }

  return (
    <div className="log-list">
      {logs.map(log => (
        <article key={log.id} className="log-card">
          <header>
            <div>
              <strong>{log.type}</strong>
              <span>{new Date(log.timestamp).toLocaleString()}</span>
            </div>
            <div>{log.category || log.customName || 'General'}</div>
          </header>
          <p>{log.description}</p>
          {log.details && <pre>{log.details}</pre>}
        </article>
      ))}
    </div>
  );
}
