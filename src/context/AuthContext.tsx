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
