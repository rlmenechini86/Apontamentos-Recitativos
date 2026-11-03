const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutos

/**
 * Retorna o token JWT armazenado no localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('app_token');
}

/**
 * Retorna os headers padrao com Authorization Bearer JWT
 */
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  return headers;
}

/**
 * Trata respostas 401 (token expirado/invalido) fazendo logout automatico
 */
function handleUnauthorized(response: Response): Response {
  if (response.status === 401) {
    const currentPath = window.location.pathname;
    // Evita loop se ja esta na tela de login
    if (currentPath !== '/' && currentPath !== '/login') {
      localStorage.removeItem('app_user');
      localStorage.removeItem('app_token');
      localStorage.removeItem('app_last_activity');
      window.location.reload();
    }
  }
  return response;
}

export const apiGet = async (url: string, forceRefresh = false) => {
  if (!forceRefresh && cache.has(url)) {
    const cached = cache.get(url)!;
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return { ok: true, json: async () => cached.data };
    }
  }
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  handleUnauthorized(response);
  if (response.ok) {
    const clone = response.clone();
    const data = await clone.json();
    cache.set(url, { data, timestamp: Date.now() });
  }
  return response;
};

export const apiPost = async (url: string, body: any) => {
  clearApiCache(url);
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  handleUnauthorized(response);
  return response;
};

export const apiPut = async (url: string, body: any) => {
  clearApiCache();
  const response = await fetch(url, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  handleUnauthorized(response);
  return response;
};

export const apiDelete = async (url: string) => {
  clearApiCache();
  const response = await fetch(url, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  handleUnauthorized(response);
  return response;
};

export const clearApiCache = (url?: string) => {
  if (url) cache.delete(url);
  else cache.clear();
};
