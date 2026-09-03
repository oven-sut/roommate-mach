// change to your deployed API origin, or set NEXT_PUBLIC_API_BASE in .env.local
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:18888';

const TOKEN_KEY = 'sut_admin_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {}

type ApiOptions = Omit<RequestInit, 'body'> & { body?: unknown };

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : null),
      ...(opts.headers as Record<string, string> | undefined),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401) {
    clearToken();
    // This module sits outside the React tree (no access to useRouter), and a
    // full reload is fine here - it guarantees every bit of in-memory admin
    // state is dropped along with the expired session.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new ApiError('Unauthorized');
  }
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}) as { message?: string });
    throw new ApiError(msg.message || `Request failed (${res.status})`);
  }
  return res.status === 204 ? (null as T) : ((await res.json()) as T);
}
