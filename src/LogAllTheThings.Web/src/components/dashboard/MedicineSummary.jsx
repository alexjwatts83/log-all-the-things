import { Pill } from 'lucide-react';

export default function MedicineSummary({ summary }) {
  return (
    <section className="dashboard-section" aria-labelledby="medicine-heading">
      <div className="section-heading"><div><p className="eyebrow">Medicine</p><h2 id="medicine-heading">Quantity logged</h2></div><span>{summary.eventCount} events</span></div>
      <div className="medicine-summary-list">
        {summary.medicines.map(medicine => <div key={medicine.name}><Pill size={18} aria-hidden="true" /><span>{medicine.name}</span><strong>{medicine.quantity}</strong></div>)}
      </div>
    </section>
  );
}