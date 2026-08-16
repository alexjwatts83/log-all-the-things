import { useEffect, useMemo, useState } from 'react';
import { medicineTypes } from '../medicineTypes';

export default function LogForm({ type, onSubmit }) {
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState('');
  const [category, setCategory] = useState('');
  const [customName, setCustomName] = useState('');
  const [medicineName, setMedicineName] = useState(medicineTypes[0]);
  const [medicineQuantity, setMedicineQuantity] = useState('2');

  const isCustom = type === 'Custom';
  const isMedicine = type === 'Medicine';

  useEffect(() => {
    setMedicineName(medicineTypes[0]);
    setMedicineQuantity('2');
  }, [type]);

  const payload = useMemo(() => ({
    type,
    description,
    details: details || undefined,
    category: category || undefined,
    customName: customName || undefined,
    medicineName: isMedicine ? medicineName : undefined,
    medicineQuantity: isMedicine ? Number(medicineQuantity) : undefined,
  }), [type, description, details, category, customName, isMedicine, medicineName, medicineQuantity]);

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
      <button type="submit">Save {type} log</button>
    </form>
  );
}
