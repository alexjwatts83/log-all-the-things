export default function LogList({ logs }) {
  if (!logs.length) {
    return <p className="empty-state">No logs yet. Add a medicine, food, or custom event log.</p>;
  }

  const typeNameFromId = id => {
    if (id === 1) return 'Medicine';
    if (id === 2) return 'Food';
    if (id === 3) return 'Custom';
    return 'General';
  };

  return (
    <div className="log-list">
      {logs.map(log => {
        const typeName = log.type?.name ?? log.type?.Name ?? log.type ?? typeNameFromId(log.typeId ?? log.typeId);
        const metadata = typeName === 'Medicine'
          ? `${log.medicineName || 'Medicine'}${log.medicineQuantity ? ` x${log.medicineQuantity}` : ''}`
          : log.category || log.customName || 'General';
        return (
          <article key={log.id} className="log-card">
            <header>
              <div>
                <strong>{typeName}</strong>
                <span>{new Date(log.timestamp).toLocaleString()}</span>
              </div>
              <div>{metadata}</div>
            </header>
            <p>{log.description}</p>
            {log.details && <pre>{log.details}</pre>}
          </article>
        );
      })}
    </div>
  );
}
