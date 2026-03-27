const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export async function fetchModule(endpoint, userId = 1) {
  const res = await fetch(`${API_BASE}${endpoint}?userId=${userId}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return await res.json();
}

export function getApiBase() {
  return API_BASE;
}
