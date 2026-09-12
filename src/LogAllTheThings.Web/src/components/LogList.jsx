import { useState } from 'react';
import { carEventTypes } from '../carEventTypes';
import { formatDateTimeLocal } from '../dashboardMetrics';
import { medicineTypes } from '../medicineTypes';

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'AUD',
});

export default function LogList({ logs, onUpdate, onDelete, emptyMessage = 'No logs yet. Add a medicine, food, or custom event log.' }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [showCustomDate, setShowCustomDate] = useState(false);

  if (!logs.length) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  const typeNameFromId = id => {
    if (id === 1) return 'Medicine';
    if (id === 2) return 'Food';
    if (id === 3) return 'Custom';
    if (id === 4) return 'Car';
    return 'General';
  };

  function beginEdit(log) {
    setEditingId(log.id);
    setShowCustomDate(false);
    setDraft({
      typeId: log.typeId,
      description: log.description ?? '',
      details: log.details ?? '',
      category: log.category ?? '',
      customName: log.customName ?? '',
      medicineName: log.medicineName ?? medicineTypes[0],
      medicineQuantity: String(log.medicineQuantity ?? 2),
      carEventName: log.carEventName ?? carEventTypes[0],
      carCost: String(log.carCost ?? ''),
      timestamp: formatDateTimeLocal(log.timestamp),
    });
  }

  async function saveEdit(event, log) {
    event.preventDefault();
    const isMedicine = log.typeId === 1;
    const isCar = log.typeId === 4;
    const quantity = Number(draft.medicineQuantity);
    const cost = Number(draft.carCost);
    const validCost = /^\d+(\.\d{1,2})?$/.test(draft.carCost) && cost > 0;
    if ((!isMedicine && !isCar && !draft.description.trim()) ||
      (isMedicine && (!draft.medicineName || !Number.isInteger(quantity) || quantity < 1)) ||
      (isCar && (!draft.carEventName || !validCost))) {
      return;
    }

    setBusyId(log.id);
    const saved = await onUpdate(log.id, {
      ...draft,
      medicineQuantity: isMedicine ? quantity : undefined,
      carCost: isCar ? cost : undefined,
      timestamp: showCustomDate && draft.timestamp ? new Date(draft.timestamp).toISOString() : log.timestamp,
    });
    setBusyId(null);
    if (saved) {
      setEditingId(null);
      setDraft(null);
      setShowCustomDate(false);
    }
  }

  async function remove(log) {
    if (!globalThis.confirm(`Delete "${log.description}"?`)) {
      return;
    }

    setBusyId(log.id);
    await onDelete(log.id);
    setBusyId(null);
  }

  return (
    <div className="log-list">
      {logs.map(log => {
        const typeName = log.type?.name ?? log.type?.Name ?? log.type ?? typeNameFromId(log.typeId ?? log.typeId);
        const metadata = typeName === 'Medicine'
          ? `${log.medicineName || 'Medicine'}${log.medicineQuantity ? ` x${log.medicineQuantity}` : ''}`
          : typeName === 'Car'
            ? `${log.carEventName || 'Car'} · ${currencyFormatter.format(Number(log.carCost ?? 0))}`
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
            {editingId === log.id ? (
              <form className="edit-log-form" onSubmit={event => saveEdit(event, log)}>
                {log.typeId === 1 ? (
                  <div className="medicine-fields">
                    <label>
                      Medicine type
                      <select value={draft.medicineName}
                              onChange={event => setDraft(current => ({ ...current, medicineName: event.target.value }))}
                              required>
                        {medicineTypes.map(medicine => (
                          <option key={medicine} value={medicine}>{medicine}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Quantity
                      <input type="number" min="1" step="1" value={draft.medicineQuantity}
                             onChange={event => setDraft(current => ({ ...current, medicineQuantity: event.target.value }))}
                             required />
                    </label>
                  </div>
                ) : log.typeId === 4 ? (
                  <div className="medicine-fields">
                    <label>
                      Car activity
                      <select value={draft.carEventName}
                              onChange={event => setDraft(current => ({ ...current, carEventName: event.target.value }))}
                              required>
                        {carEventTypes.map(carEvent => (
                          <option key={carEvent} value={carEvent}>{carEvent}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Cost
                      <input type="number" min="0.01" step="0.01" inputMode="decimal" value={draft.carCost}
                             onChange={event => setDraft(current => ({ ...current, carCost: event.target.value }))}
                             required />
                    </label>
                  </div>
                ) : (
                  <label>
                    Description
                    <input value={draft.description}
                           onChange={event => setDraft(current => ({ ...current, description: event.target.value }))}
                           required />
                  </label>
                )}
                {log.typeId === 3 && (
                  <label>
                    Event name
                    <input value={draft.customName}
                           onChange={event => setDraft(current => ({ ...current, customName: event.target.value }))} />
                  </label>
                )}
                <div className="date-mode-toggle">
                  <label>Time</label>
                  <div className="segmented-control" role="group" aria-label="Log timestamp mode">
                    <button
                      type="button"
                      aria-pressed={!showCustomDate}
                      onClick={() => setShowCustomDate(false)}
                    >
                      Now
                    </button>
                    <button
                      type="button"
                      aria-pressed={showCustomDate}
                      onClick={() => setShowCustomDate(true)}
                    >
                      Custom
                    </button>
                  </div>
                </div>
                {showCustomDate && (
                  <div className="custom-date-field">
                    <label>
                      Date and time
                      <input type="datetime-local"
                             value={draft.timestamp}
                             onChange={event => setDraft(current => ({ ...current, timestamp: event.target.value }))}
                             required />
                    </label>
                  </div>
                )}
                <label>
                  Details
                  <textarea rows="3" value={draft.details}
                            onChange={event => setDraft(current => ({ ...current, details: event.target.value }))} />
                </label>
                <label>
                  Category
                  <input value={draft.category}
                         onChange={event => setDraft(current => ({ ...current, category: event.target.value }))} />
                </label>
                <div className="log-actions">
                  <button type="submit" disabled={busyId === log.id}>Save</button>
                  <button type="button" className="secondary" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </form>
            ) : (
              <div className="log-actions">
                <button type="button" className="secondary" onClick={() => beginEdit(log)}>Edit</button>
                <button type="button" className="danger" disabled={busyId === log.id} onClick={() => remove(log)}>Delete</button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
