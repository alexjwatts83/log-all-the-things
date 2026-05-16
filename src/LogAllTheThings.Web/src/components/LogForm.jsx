import { useMemo, useState } from 'react';

export default function LogForm({ type, onSubmit }) {
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState('');
  const [category, setCategory] = useState('');
  const [customName, setCustomName] = useState('');

  const isCustom = type === 'Custom';

  const payload = useMemo(() => ({
    type,
    description,
    details: details || undefined,
    category: category || undefined,
    customName: customName || undefined,
  }), [type, description, details, category, customName]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!description.trim()) {
      return;
    }

    onSubmit(payload);
    setDescription('');
    setDetails('');
    setCategory('');
    setCustomName('');
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
