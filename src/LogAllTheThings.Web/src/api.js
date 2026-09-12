const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const baseUrl = `${apiBaseUrl}/api/logs`;

const typeMap = {
  Medicine: 1,
  Food: 2,
  Custom: 3,
};

function toRequestBody(log) {
  return {
    TypeId: log.typeId ?? typeMap[log.type] ?? 0,
    Description: log.description,
    Details: log.details ?? null,
    Category: log.category ?? null,
    CustomName: log.customName ?? null,
    MedicineName: log.medicineName ?? null,
    MedicineQuantity: log.medicineQuantity ?? null,
    Timestamp: log.timestamp ? new Date(log.timestamp).toISOString() : null,
  };
}

export async function fetchLogs() {
  const response = await fetch(baseUrl);
  if (!response.ok) {
    throw new Error('Unable to fetch logs');
  }
  return response.json();
}

export async function createLog(log) {
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toRequestBody(log)),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Unable to create log');
  }

  return response.json();
}

export async function updateLog(id, log) {
  const response = await fetch(`${baseUrl}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toRequestBody(log)),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Unable to update log');
  }

  return response.json();
}

export async function deleteLog(id) {
  const response = await fetch(`${baseUrl}/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error('Unable to delete log');
  }
}
