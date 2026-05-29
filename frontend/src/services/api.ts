const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) throw new Error('request_failed');
  return response.json() as Promise<T>;
}
