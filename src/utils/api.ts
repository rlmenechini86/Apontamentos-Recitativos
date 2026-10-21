const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutos

export const apiGet = async (url: string, forceRefresh = false) => {
  if (!forceRefresh && cache.has(url)) {
    const cached = cache.get(url)!;
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return { ok: true, json: async () => cached.data };
    }
  }
  const response = await fetch(url);
  if (response.ok) {
    const clone = response.clone();
    const data = await clone.json();
    cache.set(url, { data, timestamp: Date.now() });
  }
  return response;
};

export const apiPost = async (url: string, body: any) => {
  clearApiCache(url);
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
};

export const apiPut = async (url: string, body: any) => {
  clearApiCache();
  return fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
};

export const apiDelete = async (url: string) => {
  clearApiCache();
  return fetch(url, {
    method: 'DELETE',
  });
};

export const clearApiCache = (url?: string) => {
  if (url) cache.delete(url);
  else cache.clear();
};
