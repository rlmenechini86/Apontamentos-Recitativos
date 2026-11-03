/**
 * LGPD Security: Interceptor global de fetch
 * Injeta automaticamente o header Authorization: Bearer JWT
 * em todas as requisicoes para /api/* sem precisar alterar cada componente.
 * Tambem trata respostas 401 fazendo logout automatico.
 */
const originalFetch = window.fetch.bind(window);

window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;

  // Apenas injeta auth em rotas /api (exceto login/register/set-password)
  const isApiRoute = url.startsWith('/api') || url.includes('/api/');
  const isPublicAuth = ['/api/auth/login', '/api/auth/register', '/api/auth/set-password', '/api/auth/validate-password'].some(p => url.includes(p));

  if (isApiRoute && !isPublicAuth) {
    const token = localStorage.getItem('ccb_token');
    if (token) {
      const headers = new Headers(init?.headers || {});
      if (!headers.has('Authorization')) {
        headers.set('Authorization', 'Bearer ' + token);
      }
      init = { ...init, headers };
    }
  }

  const response = await originalFetch(input, init);

  // Auto-logout em caso de token expirado/invalido
  if (response.status === 401 && isApiRoute && !isPublicAuth) {
    const currentPath = window.location.pathname;
    if (currentPath !== '/' && currentPath !== '/login') {
      console.warn('[LGPD Auth] Sessao expirada - redirecionando para login');
      localStorage.removeItem('ccb_user');
      localStorage.removeItem('ccb_token');
      localStorage.removeItem('ccb_last_activity');
      window.location.reload();
    }
  }

  return response;
};

export {};
