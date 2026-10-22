import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario } from '../types';

interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, senha: string) => Promise<void>;
  register: (data: {
    nome_completo: string;
    email: string;
    celular: string;
    senha: string;
    perfil_id?: string;
    comum_congregacao_id?: string | null;
  }) => Promise<void>;
  setPassword: (email: string, novaSenha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  setPassword: async () => {},
  logout: () => {},
});

const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos de inatividade

const getInitialAuth = (): { user: Usuario | null; token: string | null } => {
  try {
    const savedUser = localStorage.getItem('ccb_user');
    const savedToken = localStorage.getItem('ccb_token');
    const lastActivityStr = localStorage.getItem('ccb_last_activity');

    if (!savedUser || !savedToken) {
      return { user: null, token: null };
    }

    const now = Date.now();
    if (lastActivityStr) {
      const lastActivity = parseInt(lastActivityStr, 10);
      if (isNaN(lastActivity) || now - lastActivity > TIMEOUT_MS) {
        // Expirou por inatividade
        localStorage.removeItem('ccb_user');
        localStorage.removeItem('ccb_token');
        localStorage.removeItem('ccb_last_activity');
        return { user: null, token: null };
      }
    } else {
      // Sem carimbo de atividade anterior, requer novo login
      localStorage.removeItem('ccb_user');
      localStorage.removeItem('ccb_token');
      return { user: null, token: null };
    }

    return {
      user: JSON.parse(savedUser),
      token: savedToken,
    };
  } catch {
    return { user: null, token: null };
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialAuth = getInitialAuth();
  const [user, setUser] = useState<Usuario | null>(initialAuth.user);
  const [token, setToken] = useState<string | null>(initialAuth.token);

  useEffect(() => {
    if (user && token) {
      localStorage.setItem('ccb_user', JSON.stringify(user));
      localStorage.setItem('ccb_token', token);
    } else {
      localStorage.removeItem('ccb_user');
      localStorage.removeItem('ccb_token');
      localStorage.removeItem('ccb_last_activity');
    }
  }, [user, token]);

  // Lógica de expiração por inatividade (compatível com mobile e desktop)
  useEffect(() => {
    if (!user || !token) return;

    let timeoutId: number;

    const logoutDueToInactivity = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('ccb_user');
      localStorage.removeItem('ccb_token');
      localStorage.removeItem('ccb_last_activity');
    };

    const checkExpiration = (): boolean => {
      const now = Date.now();
      const lastActivityStr = localStorage.getItem('ccb_last_activity');
      if (lastActivityStr) {
        const lastActivity = parseInt(lastActivityStr, 10);
        if (isNaN(lastActivity) || now - lastActivity > TIMEOUT_MS) {
          logoutDueToInactivity();
          return true;
        }
      } else {
        logoutDueToInactivity();
        return true;
      }
      return false;
    };

    // Validação imediata: se já expirou antes do timer iniciar
    if (checkExpiration()) {
      return;
    }

    // Agenda o timeout para o tempo restante real da sessão
    const lastActivity = parseInt(localStorage.getItem('ccb_last_activity') || '0', 10);
    const initialRemaining = Math.max(1000, TIMEOUT_MS - (Date.now() - lastActivity));
    timeoutId = window.setTimeout(logoutDueToInactivity, initialRemaining);

    const handleUserActivity = () => {
      const now = Date.now();
      const lastActivityStr = localStorage.getItem('ccb_last_activity');
      const currentLastActivity = lastActivityStr ? parseInt(lastActivityStr, 10) : 0;

      // Se já expirou antes da interação
      if (!currentLastActivity || now - currentLastActivity > TIMEOUT_MS) {
        logoutDueToInactivity();
        return;
      }

      // Atualiza o storage com moderação (máx a cada 5s)
      if (now - currentLastActivity > 5000) {
        localStorage.setItem('ccb_last_activity', now.toString());
      }

      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(logoutDueToInactivity, TIMEOUT_MS);
    };

    const handleWakeOrFocus = () => {
      // Ao voltar à visibilidade (ex: celular desbloqueado ou aba reaberta)
      if (document.visibilityState === 'visible') {
        if (!checkExpiration()) {
          const currentLast = parseInt(localStorage.getItem('ccb_last_activity') || '0', 10);
          const remaining = Math.max(1000, TIMEOUT_MS - (Date.now() - currentLast));
          window.clearTimeout(timeoutId);
          timeoutId = window.setTimeout(logoutDueToInactivity, remaining);
        }
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(event => window.addEventListener(event, handleUserActivity, { passive: true }));
    document.addEventListener('visibilitychange', handleWakeOrFocus);
    window.addEventListener('pageshow', handleWakeOrFocus);
    window.addEventListener('focus', handleWakeOrFocus);

    return () => {
      events.forEach(event => window.removeEventListener(event, handleUserActivity));
      document.removeEventListener('visibilitychange', handleWakeOrFocus);
      window.removeEventListener('pageshow', handleWakeOrFocus);
      window.removeEventListener('focus', handleWakeOrFocus);
      window.clearTimeout(timeoutId);
    };
  }, [user, token]);

  const login = async (email: string, senha: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Falha ao autenticar.');
    }

    setUser(json.data.user);
    setToken(json.data.token);
    localStorage.setItem('ccb_last_activity', Date.now().toString());
  };

  const register = async (data: {
    nome_completo: string;
    email: string;
    celular: string;
    senha: string;
    perfil_id?: string;
    comum_congregacao_id?: string | null;
  }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Falha ao cadastrar usuário com senha criptografada.');
    }

    setUser(json.data.user);
    setToken(json.data.token);
    localStorage.setItem('ccb_last_activity', Date.now().toString());
  };

  const setPassword = async (email: string, novaSenha: string) => {
    const res = await fetch('/api/auth/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, nova_senha: novaSenha }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Falha ao cadastrar senha.');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ccb_user');
    localStorage.removeItem('ccb_token');
    localStorage.removeItem('ccb_last_activity');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        login,
        register,
        setPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
