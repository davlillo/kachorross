import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AuthController } from '@/controllers/auth.controller';
import type { Perfil } from '@/types';

interface AuthContextType {
  user: Perfil | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authCtrl = AuthController.getInstance();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Perfil | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const boot = async () => {
      const current = await authCtrl.getCurrentUser();
      setUser(current);
      setIsLoading(false);
    };
    void boot();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    const result = await authCtrl.login(email, password);

    if (result.user) {
      setUser(result.user);
      setIsLoading(false);
      return true;
    } else {
      setError(result.error);
      setIsLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await authCtrl.logout();
    setUser(null);
    setError(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
