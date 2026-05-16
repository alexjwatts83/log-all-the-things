const baseUrl = '/api/logs';

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
    body: JSON.stringify(log),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Unable to create log');
  }

  return response.json();
}
