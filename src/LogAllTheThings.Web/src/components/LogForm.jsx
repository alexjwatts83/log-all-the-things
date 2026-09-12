import { useEffect, useMemo, useState } from 'react';
import { formatDateTimeLocal } from '../dashboardMetrics';
import { medicineTypes } from '../medicineTypes';

export default function LogForm({ type, onSubmit }) {
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState('');
  const [category, setCategory] = useState('');
  const [customName, setCustomName] = useState('');
  const [medicineName, setMedicineName] = useState(medicineTypes[0]);
  const [medicineQuantity, setMedicineQuantity] = useState('2');
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [timestamp, setTimestamp] = useState('');

  const isCustom = type === 'Custom';
  const isMedicine = type === 'Medicine';

  useEffect(() => {
    setMedicineName(medicineTypes[0]);
    setMedicineQuantity('2');
    setShowCustomDate(false);
    setTimestamp('');
  }, [type]);

  const payload = useMemo(() => ({
    type,
    description,
    details: details || undefined,
    category: category || undefined,
    customName: customName || undefined,
    medicineName: isMedicine ? medicineName : undefined,
    medicineQuantity: isMedicine ? Number(medicineQuantity) : undefined,
    timestamp: showCustomDate && timestamp ? new Date(timestamp).toISOString() : undefined,
  }), [type, description, details, category, customName, isMedicine, medicineName, medicineQuantity, showCustomDate, timestamp]);

  async function handleSubmit(e) {
    e.preventDefault();
    const quantity = Number(medicineQuantity);
    if ((!isMedicine && !description.trim()) || (isMedicine && (!medicineName || !Number.isInteger(quantity) || quantity < 1))) {
      return;
    }

    const saved = await onSubmit(payload);
    if (!saved) {
      return;
    }

    setDescription('');
    setDetails('');
    setCategory('');
    setCustomName('');
    setMedicineName(medicineTypes[0]);
    setMedicineQuantity('2');
    setShowCustomDate(false);
    setTimestamp('');
  }

  function handleDateModeChange(mode) {
    if (mode === 'now') {
      setShowCustomDate(false);
      setTimestamp('');
    } else {
      setShowCustomDate(true);
      setTimestamp(formatDateTimeLocal());
    }
  }

  return (
    <form className="log-form" onSubmit={handleSubmit}>
      <h2>Log {type}</h2>
      {isCustom && (
        <label>
          Event name
          <input
            type="text"
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            placeholder="Describe the custom event"
          />
        </label>
      )}
      {isMedicine && (
        <div className="medicine-fields">
          <label>
            Medicine type
            <select value={medicineName} onChange={e => setMedicineName(e.target.value)} required>
              {medicineTypes.map(medicine => (
                <option key={medicine} value={medicine}>{medicine}</option>
              ))}
            </select>
          </label>
          <label>
            Quantity
            <input
              type="number"
              min="1"
              step="1"
              value={medicineQuantity}
              onChange={e => setMedicineQuantity(e.target.value)}
              required
            />
          </label>
        </div>
      )}
      {!isMedicine && (
        <label>
          Description
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What happened?"
            required
          />
        </label>
      )}
      <label>
        Details
        <textarea
          value={details}
          onChange={e => setDetails(e.target.value)}
          placeholder="Optional notes or dosage, food details, timing, etc."
          rows="3"
        />
      </label>
      <label>
        Category
        <input
          type="text"
          value={category}
          onChange={e => setCategory(e.target.value)}
          placeholder="Optional category or tag"
        />
      </label>
      <div className="date-mode-toggle">
        <label>Time</label>
        <div className="segmented-control" role="group" aria-label="Log timestamp mode">
          <button
            type="button"
            aria-pressed={!showCustomDate}
            onClick={() => handleDateModeChange('now')}
          >
            Now
          </button>
          <button
            type="button"
            aria-pressed={showCustomDate}
            onClick={() => handleDateModeChange('custom')}
          >
            Custom
          </button>
        </div>
      </div>
      {showCustomDate && (
        <div className="custom-date-field">
          <label>
            Date and time
            <input
              type="datetime-local"
              value={timestamp}
              onChange={e => setTimestamp(e.target.value)}
              required
            />
          </label>
        </div>
      )}
      <button type="submit">Save {type} log</button>
    </form>
  );
}
