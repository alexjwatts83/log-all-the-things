import { getLogType, logTypes } from './logTypes.js';

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function validTimestamp(log) {
  const date = new Date(log.timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTimeLocal(dateInput) {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = num => String(num).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function filterLogsByRange(logs, range, now = new Date()) {
  if (range === 'all') {
    return logs.filter(validTimestamp);
  }

  const start = startOfLocalDay(now);
  start.setDate(start.getDate() - Number(range) + 1);
  return logs.filter(log => {
    const timestamp = validTimestamp(log);
    return timestamp && timestamp >= start && timestamp <= now;
  });
}

export function buildSummaryMetrics(logs) {
  const typeCounts = new Map();
  const activeDays = new Set();
  let medicineQuantity = 0;

  for (const log of logs) {
    const timestamp = validTimestamp(log);
    if (timestamp) activeDays.add(dateKey(timestamp));
    typeCounts.set(log.typeId, (typeCounts.get(log.typeId) ?? 0) + 1);
    if (log.typeId === 1) medicineQuantity += Number(log.medicineQuantity) || 0;
  }

  const highestCount = Math.max(0, ...typeCounts.values());
  const winners = [...typeCounts.entries()].filter(([, count]) => count === highestCount);
  const mostLoggedType = winners.length === 0
    ? 'None'
    : winners.length > 1
      ? 'Tied'
      : getLogType(winners[0][0]).name;

  return {
    totalLogs: logs.length,
    medicineQuantity,
    activeDays: activeDays.size,
    mostLoggedType,
  };
}

export function buildDailySeries(logs, range, now = new Date()) {
  const grouped = new Map();
  const addLog = (key, log) => {
    const row = grouped.get(key) ?? { date: key, Medicine: 0, Food: 0, Custom: 0, Car: 0, Other: 0 };
    row[getLogType(log.typeId).name] += 1;
    grouped.set(key, row);
  };

  const timestamps = logs.map(validTimestamp).filter(Boolean);
  const firstTimestamp = timestamps.length
    ? new Date(Math.min(...timestamps.map(timestamp => timestamp.getTime())))
    : null;
  const useWeeklyBuckets = range === 'all' && firstTimestamp &&
    ((now.getTime() - firstTimestamp.getTime()) / 86400000) > 90;
  const bucketKey = timestamp => {
    if (!useWeeklyBuckets) return dateKey(timestamp);
    const week = startOfLocalDay(timestamp);
    week.setDate(week.getDate() - ((week.getDay() + 6) % 7));
    return dateKey(week);
  };

  for (const log of logs) {
    const timestamp = validTimestamp(log);
    if (timestamp) addLog(bucketKey(timestamp), log);
  }

  if (range !== 'all') {
    const days = Number(range);
    const start = startOfLocalDay(now);
    start.setDate(start.getDate() - days + 1);
    for (let index = 0; index < days; index += 1) {
      const day = new Date(start);
      day.setDate(day.getDate() + index);
      const key = dateKey(day);
      if (!grouped.has(key)) {
        grouped.set(key, { date: key, Medicine: 0, Food: 0, Custom: 0, Car: 0, Other: 0 });
      }
    }
  }

  return [...grouped.values()].sort((left, right) => left.date.localeCompare(right.date));
}

export function buildTypeBreakdown(logs) {
  const counts = new Map();
  for (const log of logs) counts.set(log.typeId, (counts.get(log.typeId) ?? 0) + 1);

  const known = logTypes.map(type => ({
    ...type,
    count: counts.get(type.id) ?? 0,
    percentage: logs.length ? Math.round(((counts.get(type.id) ?? 0) / logs.length) * 100) : 0,
  }));
  const otherCount = [...counts.entries()]
    .filter(([typeId]) => !logTypes.some(type => type.id === typeId))
    .reduce((total, [, count]) => total + count, 0);

  return otherCount
    ? [...known, { ...getLogType(null), count: otherCount, percentage: Math.round((otherCount / logs.length) * 100) }]
    : known;
}

export function buildMedicineSummary(logs) {
  const medicines = new Map();
  let eventCount = 0;

  for (const log of logs) {
    if (log.typeId !== 1) continue;
    eventCount += 1;
    const name = log.medicineName || 'Unknown medicine';
    medicines.set(name, (medicines.get(name) ?? 0) + (Number(log.medicineQuantity) || 0));
  }

  return {
    eventCount,
    medicines: [...medicines.entries()]
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((left, right) => right.quantity - left.quantity || left.name.localeCompare(right.name)),
  };
}