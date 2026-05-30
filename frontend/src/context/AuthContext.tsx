import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import type { Role, User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { fullName: string; email: string; password: string; role: Role }) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthState | null>(null);

const STORAGE_KEY = 'academic_auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { user: User; token: string };
        setUser(parsed.user);
        setToken(parsed.token);
        localStorage.setItem('token', parsed.token);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const persist = (u: User, t: string, refresh: string) => {
    setUser(u);
    setToken(t);
    localStorage.setItem('token', t);
    localStorage.setItem('refreshToken', refresh);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: u, token: t }));
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    persist(res.user, res.token, res.refreshToken);
  }, []);

  const register = useCallback(
    async (data: { fullName: string; email: string; password: string; role: Role }) => {
      const created = await api.register(data);
      await login(data.email, data.password);
      if (!created.id) return;
    },
    [login]
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, isAuthenticated: Boolean(user && token) }),
    [user, token, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
