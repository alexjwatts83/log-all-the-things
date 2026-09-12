import { Activity, CalendarDays, Pill, Trophy } from 'lucide-react';

export default function SummaryMetrics({ metrics }) {
  const items = [
    { label: 'Total logs', value: metrics.totalLogs, icon: Activity },
    { label: 'Medicine quantity', value: metrics.medicineQuantity, icon: Pill },
    { label: 'Active days', value: metrics.activeDays, icon: CalendarDays },
    { label: 'Most logged', value: metrics.mostLoggedType, icon: Trophy },
  ];
  return (
    <div className="summary-grid">
      {items.map(item => {
        const Icon = item.icon;
        return <div className="metric-tile" key={item.label}><Icon aria-hidden="true" size={19} /><span>{item.label}</span><strong>{item.value}</strong></div>;
      })}
    </div>
  );
}