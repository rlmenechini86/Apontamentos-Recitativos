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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(() => {
    try {
      const savedUser = localStorage.getItem('ccb_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('ccb_token') || null;
  });

  useEffect(() => {
    if (user && token) {
      localStorage.setItem('ccb_user', JSON.stringify(user));
      localStorage.setItem('ccb_token', token);
    } else {
      localStorage.removeItem('ccb_user');
      localStorage.removeItem('ccb_token');
    }
  }, [user, token]);

  // Inactivity timeout logic
  useEffect(() => {
    let timeoutId: number;
    const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

    const logoutDueToInactivity = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('ccb_user');
      localStorage.removeItem('ccb_token');
      localStorage.removeItem('ccb_last_activity');
      // Optional: alert('Sessão expirada por inatividade. Faça login novamente.');
    };

    const resetTimer = () => {
      const now = Date.now();
      const lastActivity = parseInt(localStorage.getItem('ccb_last_activity') || '0', 10);
      
      // Se o usuário voltar e já tiver passado o tempo (ex: navegador suspendeu)
      if (lastActivity && now - lastActivity > TIMEOUT_MS) {
        logoutDueToInactivity();
        return;
      }
      
      // Atualiza o localStorage no máximo a cada 5 segundos para não travar no mobile (ex: scroll contínuo)
      if (!lastActivity || now - lastActivity > 5000) {
        localStorage.setItem('ccb_last_activity', now.toString());
      }
      
      window.clearTimeout(timeoutId);
      if (user && token) {
        timeoutId = window.setTimeout(logoutDueToInactivity, TIMEOUT_MS);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetTimer();
      }
    };

    if (user && token) {
      const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
      
      localStorage.setItem('ccb_last_activity', Date.now().toString());
      timeoutId = window.setTimeout(logoutDueToInactivity, TIMEOUT_MS);
      
      events.forEach(event => window.addEventListener(event, resetTimer, { passive: true }));
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        events.forEach(event => window.removeEventListener(event, resetTimer));
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.clearTimeout(timeoutId);
      };
    }
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
