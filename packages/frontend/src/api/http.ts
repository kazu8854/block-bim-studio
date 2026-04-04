/** ブラウザでは Vite プロキシ経由で同一オリジン */
export function appOrigin(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export async function fetchJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${appOrigin()}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`リクエストが失敗しました (${String(res.status)})`);
  }
  const json = (await res.json()) as T & {
    _stub?: boolean;
    _stubLevel?: number;
  };
  const { _stub: _s, _stubLevel: _l, ...rest } = json;
  return rest as T;
}
