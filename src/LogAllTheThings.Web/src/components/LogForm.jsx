import { useEffect, useMemo, useState } from 'react';
import { carEventTypes, defaultCarEventType } from '../carEventTypes';
import { formatDateTimeLocal } from '../dashboardMetrics';
import { lifeEventTypes } from '../lifeEventTypes';
import { medicineTypes } from '../medicineTypes';

export default function LogForm({ type, onSubmit }) {
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState('');
  const [category, setCategory] = useState('');
  const [customName, setCustomName] = useState('');
  const [medicineName, setMedicineName] = useState(medicineTypes[0]);
  const [medicineQuantity, setMedicineQuantity] = useState('2');
  const [carEventName, setCarEventName] = useState(defaultCarEventType);
  const [carCost, setCarCost] = useState('');
  const [lifeEventName, setLifeEventName] = useState(lifeEventTypes[0]);
  const [lifeCost, setLifeCost] = useState('');
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [timestamp, setTimestamp] = useState('');

  const isCustom = type === 'Custom';
  const isMedicine = type === 'Medicine';
  const isCar = type === 'Car';
  const isLife = type === 'Life';

  useEffect(() => {
    setMedicineName(medicineTypes[0]);
    setMedicineQuantity('2');
    setCarEventName(defaultCarEventType);
    setCarCost('');
    setLifeEventName(lifeEventTypes[0]);
    setLifeCost('');
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
    carEventName: isCar ? carEventName : undefined,
    carCost: isCar ? Number(carCost) : undefined,
    lifeEventName: isLife ? lifeEventName : undefined,
    lifeCost: isLife && lifeCost ? Number(lifeCost) : undefined,
    timestamp: showCustomDate && timestamp ? new Date(timestamp).toISOString() : undefined,
  }), [type, description, details, category, customName, isMedicine, medicineName, medicineQuantity, isCar, carEventName, carCost, isLife, lifeEventName, lifeCost, showCustomDate, timestamp]);

  async function handleSubmit(e) {
    e.preventDefault();
    const quantity = Number(medicineQuantity);
    const cost = Number(carCost);
    const validCost = /^\d+(\.\d{1,2})?$/.test(carCost) && cost > 0;
    const validLifeCost = !lifeCost || (/^\d+(\.\d{1,2})?$/.test(lifeCost) && Number(lifeCost) > 0);
    if ((!isMedicine && !isCar && !isLife && !description.trim()) ||
      (isMedicine && (!medicineName || !Number.isInteger(quantity) || quantity < 1)) ||
      (isCar && (!carEventName || !validCost)) ||
      (isLife && (!lifeEventName || !validLifeCost))) {
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
    setCarEventName(defaultCarEventType);
    setCarCost('');
    setLifeEventName(lifeEventTypes[0]);
    setLifeCost('');
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
      {isCar && (
        <div className="medicine-fields">
          <label>
            Car activity
            <select value={carEventName} onChange={e => setCarEventName(e.target.value)} required>
              {carEventTypes.map(carEvent => (
                <option key={carEvent} value={carEvent}>{carEvent}</option>
              ))}
            </select>
          </label>
          <label>
            Cost
            <input
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={carCost}
              onChange={e => setCarCost(e.target.value)}
              required
            />
          </label>
        </div>
      )}
      {isLife && (
        <div className="medicine-fields">
          <label>
            Life activity
            <select value={lifeEventName} onChange={e => setLifeEventName(e.target.value)} required>
              {lifeEventTypes.map(lifeEvent => (
                <option key={lifeEvent} value={lifeEvent}>{lifeEvent}</option>
              ))}
            </select>
          </label>
          <label>
            Cost (optional)
            <input
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={lifeCost}
              onChange={e => setLifeCost(e.target.value)}
            />
          </label>
        </div>
      )}
      {!isMedicine && !isCar && !isLife && (
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
      <button type="submit" className={`save-log-button save-log-button--${type.toLowerCase()}`}>
        Save {type} log
      </button>
    </form>
  );
}
