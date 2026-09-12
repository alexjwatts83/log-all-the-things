export const logTypes = [
  { id: 1, name: 'Medicine', color: '#2563eb' },
  { id: 2, name: 'Food', color: '#15803d' },
  { id: 3, name: 'Custom', color: '#b45309' },
  { id: 4, name: 'Car', color: '#be123c' },
  { id: 5, name: 'Life', color: '#7c3aed' },
];

export function getLogType(typeId) {
  return logTypes.find(type => type.id === typeId) ?? {
    id: typeId,
    name: 'Other',
    color: '#64748b',
  };
}