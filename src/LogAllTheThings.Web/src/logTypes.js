export const logTypes = [
  { id: 1, name: 'Medicine', color: '#2563eb' },
  { id: 2, name: 'Food', color: '#15803d' },
  { id: 3, name: 'Custom', color: '#b45309' },
];

export function getLogType(typeId) {
  return logTypes.find(type => type.id === typeId) ?? {
    id: typeId,
    name: 'Other',
    color: '#64748b',
  };
}