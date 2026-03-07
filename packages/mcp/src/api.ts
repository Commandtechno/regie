const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, BACKEND_URL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, value);
    }
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Backend API error: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}
