import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { AuthController } from '@/controllers/auth.controller';
import { VeterinariaController } from '@/controllers/veterinaria.controller';
import { supabase } from '@/supabase/client';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { Perfil, Veterinaria } from '@/types';

/** Cierra sesión tras este tiempo sin actividad del usuario */
const INACTIVIDAD_MS = 30 * 60 * 1000;

const EVENTOS_ACTIVIDAD = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'] as const;

interface AuthContextType {
  user: Perfil | null;
  veterinaria: Veterinaria | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshVeterinaria: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authCtrl = AuthController.getInstance();
const vetCtrl = VeterinariaController.getInstance();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Perfil | null>(null);
  const [veterinaria, setVeterinaria] = useState<Veterinaria | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loginInProgressRef = useRef(false);

  const loadVeterinaria = useCallback(async (vetId?: string) => {
    if (!vetId) {
      setVeterinaria(null);
      return;
    }
    try {
      const vet = await vetCtrl.getById(vetId);
      setVeterinaria(vet);
    } catch (err) {
      console.error('Error al cargar veterinaria', err);
      setVeterinaria(null);
    }
  }, []);

  const applyUser = useCallback(async (forceRefresh = false) => {
    const current = forceRefresh
      ? await authCtrl.refreshCurrentUser()
      : await authCtrl.getCurrentUser();
    setUser(current);
    if (current?.veterinariaId) {
      await loadVeterinaria(current.veterinariaId);
    } else {
      setVeterinaria(null);
    }
    return current;
  }, [loadVeterinaria]);

  useEffect(() => {
    let mounted = true;
    let initialResolved = false;

    const finishLoading = () => {
      if (mounted) setIsLoading(false);
    };

    const syncSession = async (forceRefresh = false) => {
      try {
        await applyUser(forceRefresh);
      } catch (err) {
        console.error('Error al sincronizar sesión', err);
        if (mounted) {
          authCtrl.clearCache();
          setUser(null);
          setVeterinaria(null);
        }
      } finally {
        initialResolved = true;
        finishLoading();
      }
    };

    const handleAuthEvent = async (event: AuthChangeEvent, _session: Session | null) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        authCtrl.clearCache();
        setUser(null);
        setVeterinaria(null);
        finishLoading();
        return;
      }

      if (event === 'INITIAL_SESSION') {
        await syncSession();
        return;
      }

      if (event === 'SIGNED_IN') {
        if (loginInProgressRef.current) return;
        try {
          await applyUser(true);
        } catch (err) {
          console.error('Error al sincronizar SIGNED_IN', err);
        }
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        try {
          await applyUser(true);
        } catch (err) {
          console.error('Error al refrescar token', err);
        }
      }
    };

    const safetyTimeout = window.setTimeout(() => {
      if (mounted && !initialResolved) {
        console.warn('Timeout de boot de auth; liberando spinner.');
        finishLoading();
      }
    }, 8000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        authCtrl.clearCache();
        if (mounted) {
          setUser(null);
          setVeterinaria(null);
          finishLoading();
        }
        return;
      }

      setTimeout(() => {
        void handleAuthEvent(event, session);
      }, 0);
    });

    return () => {
      mounted = false;
      window.clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [applyUser]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    loginInProgressRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const result = await authCtrl.login(email, password);

      if (result.user) {
        setUser(result.user);
        if (result.user.veterinariaId) {
          await loadVeterinaria(result.user.veterinariaId);
        } else {
          setVeterinaria(null);
        }
        return true;
      }

      setError(result.error);
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
      return false;
    } finally {
      loginInProgressRef.current = false;
      setIsLoading(false);
    }
  }, [loadVeterinaria]);

  const logout = useCallback(async () => {
    await authCtrl.logout();
    setUser(null);
    setVeterinaria(null);
    setError(null);
  }, []);

  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      return;
    }

    const cerrarPorInactividad = () => {
      toast.info('Sesión cerrada por inactividad (30 minutos).');
      void logoutRef.current().then(() => {
        window.location.assign('/login');
      });
    };

    const reiniciarTemporizador = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(cerrarPorInactividad, INACTIVIDAD_MS);
    };

    EVENTOS_ACTIVIDAD.forEach(ev => {
      window.addEventListener(ev, reiniciarTemporizador, { passive: true });
    });
    reiniciarTemporizador();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      EVENTOS_ACTIVIDAD.forEach(ev => {
        window.removeEventListener(ev, reiniciarTemporizador);
      });
    };
  }, [user]);

  const refreshUser = useCallback(async () => {
    await applyUser(true);
  }, [applyUser]);

  const refreshVeterinaria = useCallback(async () => {
    if (user?.veterinariaId) {
      await loadVeterinaria(user.veterinariaId);
    }
  }, [user?.veterinariaId, loadVeterinaria]);

  return (
    <AuthContext.Provider value={{ user, veterinaria, login, logout, refreshUser, refreshVeterinaria, isLoading, error }}>
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
