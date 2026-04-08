import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Perfil } from '@/types';
import { perfiles } from '@/data/mockData';

interface AuthContextType {
  user: Perfil | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Perfil | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    // Simulación de delay de red
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Validación simple (en producción sería contra Supabase Auth)
    const foundUser = perfiles.find(u => u.email === email);
    
    if (foundUser && password === '123456') {
      setUser(foundUser);
      setIsLoading(false);
      return true;
    } else {
      setError('Credenciales incorrectas. Use: doctora@kachorros.com / 123456');
      setIsLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
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
