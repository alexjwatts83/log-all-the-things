const baseUrl = '/api/logs';

const typeMap = {
  Medicine: 1,
  Food: 2,
  Custom: 3,
};

export async function fetchLogs() {
  const response = await fetch(baseUrl);
  if (!response.ok) {
    throw new Error('Unable to fetch logs');
  }
  return response.json();
}

export async function createLog(log) {
  // Accept form payloads that use `type` (string) and map to TypeId expected by the API.
  const requestBody = {
    TypeId: log.typeId ?? typeMap[log.type] ?? 0,
    Description: log.description,
    Details: log.details ?? null,
    Category: log.category ?? null,
    CustomName: log.customName ?? null,
  };

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Unable to create log');
  }

  return response.json();
}
