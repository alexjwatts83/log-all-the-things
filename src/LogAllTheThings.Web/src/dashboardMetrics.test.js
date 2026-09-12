import { describe, expect, it } from 'vitest';
import {
  buildDailySeries,
  buildMedicineSummary,
  buildSummaryMetrics,
  buildTypeBreakdown,
  filterLogsByRange,
  formatDateTimeLocal,
} from './dashboardMetrics';

const now = new Date(2026, 8, 12, 12);
const logs = [
  { id: 'medicine', typeId: 1, timestamp: new Date(2026, 8, 12, 8).toISOString(), medicineName: 'Panadol Extra', medicineQuantity: 2 },
  { id: 'food', typeId: 2, timestamp: new Date(2026, 8, 11, 18).toISOString() },
  { id: 'old', typeId: 3, timestamp: new Date(2026, 7, 1, 9).toISOString() },
];

describe('dashboard metrics', () => {
  it('filters by local calendar-day range without mutating input', () => {
    expect(filterLogsByRange(logs, '30', now).map(log => log.id)).toEqual(['medicine', 'food']);
    expect(logs).toHaveLength(3);
  });

  it('builds totals and reports ties', () => {
    expect(buildSummaryMetrics(logs.slice(0, 2))).toEqual({
      totalLogs: 2,
      medicineQuantity: 2,
      activeDays: 2,
      mostLoggedType: 'Tied',
    });
  });

  it('counts active days from custom event timestamps instead of the current date', () => {
    const customDatedLogs = [
      { typeId: 1, timestamp: new Date(2026, 7, 3, 9).toISOString(), medicineQuantity: 2 },
      { typeId: 2, timestamp: new Date(2026, 7, 3, 18).toISOString() },
      { typeId: 3, timestamp: new Date(2026, 7, 7, 12).toISOString() },
    ];

    expect(buildSummaryMetrics(customDatedLogs).activeDays).toBe(2);
  });

  it('zero-fills fixed ranges and groups long histories by week', () => {
    expect(buildDailySeries(logs.slice(0, 2), '7', now)).toHaveLength(7);
    expect(buildDailySeries([logs[0], { typeId: 2, timestamp: new Date(2026, 4, 1).toISOString() }], 'all', now)).toHaveLength(2);
  });

  it('includes car logs in dashboard series and type breakdowns', () => {
    const carLog = { typeId: 4, timestamp: new Date(2026, 8, 12, 10).toISOString(), carEventName: 'Petrol', carCost: 75.5 };
    const series = buildDailySeries([carLog], '7', now);
    const breakdown = buildTypeBreakdown([carLog]);

    expect(series.find(day => day.Car === 1)).toBeTruthy();
    expect(breakdown.find(type => type.name === 'Car')).toMatchObject({ count: 1, percentage: 100 });
  });

  it('includes life logs in dashboard series and type breakdowns', () => {
    const lifeLog = { typeId: 5, timestamp: new Date(2026, 8, 12, 11).toISOString(), lifeEventName: 'Haircut' };
    const series = buildDailySeries([lifeLog], '7', now);
    const breakdown = buildTypeBreakdown([lifeLog]);

    expect(series.find(day => day.Life === 1)).toBeTruthy();
    expect(breakdown.find(type => type.name === 'Life')).toMatchObject({ count: 1, percentage: 100 });
  });

  it('builds type percentages and preserves unknown types', () => {
    const result = buildTypeBreakdown([...logs.slice(0, 2), { typeId: 99, timestamp: logs[0].timestamp }]);
    expect(result.find(type => type.name === 'Medicine')).toMatchObject({ count: 1, percentage: 33 });
    expect(result.find(type => type.name === 'Other')).toMatchObject({ count: 1, percentage: 33 });
  });

  it('groups medicine quantities with a historical fallback', () => {
    expect(buildMedicineSummary([logs[0], { typeId: 1, timestamp: logs[0].timestamp, medicineQuantity: 1 }])).toEqual({
      eventCount: 2,
      medicines: [{ name: 'Panadol Extra', quantity: 2 }, { name: 'Unknown medicine', quantity: 1 }],
    });
  });

  it('ignores invalid timestamps for range and active-day calculations', () => {
    const invalid = { typeId: 1, timestamp: 'not-a-date', medicineQuantity: 4 };
    expect(filterLogsByRange([invalid], '30', now)).toEqual([]);
    expect(buildSummaryMetrics([invalid]).activeDays).toBe(0);
  });

  it('formats local datetime string for HTML datetime-local inputs', () => {
    const date = new Date(2026, 8, 12, 14, 30);
    expect(formatDateTimeLocal(date)).toBe('2026-09-12T14:30');
    expect(formatDateTimeLocal('invalid')).toBe('');
  });
});