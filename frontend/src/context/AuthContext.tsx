import {
  createContext, useContext, useState,
  useEffect
} from 'react';
import type { ReactNode } from 'react';
import { authAPI } from '../services/api';

export interface User {
  id: string;
  fullName: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if (stored && token) {
      try { setUser(JSON.parse(stored)); } catch { localStorage.clear(); }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authAPI.login(email, password);
    const { accessToken, refreshToken, user: userData } = res.data;
    const mappedUser: User = {
      id: userData.id,
      name: userData.name || userData.fullName || '',
      fullName: userData.fullName || userData.name || '',
      email: userData.email || email,
      role: userData.role
    };
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(mappedUser));
    setUser(mappedUser);
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch { /* ignora */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, login, logout,
      isAuthenticated: !!user,
      isLoading,
      loading: isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
