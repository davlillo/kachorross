import type { Perfil } from '@/types';

export function getHomeRouteForRole(rol: Perfil['rol']): string {
  if (rol === 'super_admin') return '/super-admin';
  if (rol === 'recepcion') return '/recepcion';
  return '/dashboard';
}
