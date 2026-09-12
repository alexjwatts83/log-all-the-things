const ranges = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: 'all', label: 'All time' },
];

export default function TimeRangeControl({ value, onChange }) {
  return (
    <div className="segmented-control" aria-label="Dashboard time range">
      {ranges.map(range => (
        <button type="button" key={range.value} aria-pressed={value === range.value} onClick={() => onChange(range.value)}>
          {range.label}
        </button>
      ))}
    </div>
  );
}