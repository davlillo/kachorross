import type { Perfil } from '@/types'
import { perfiles } from '@/data/mockData'

let instance: AuthController | null = null

export class AuthController {
  private currentUser: Perfil | null = null
  private usuarios: Perfil[] = perfiles

  static getInstance(): AuthController {
    if (!instance) instance = new AuthController()
    return instance
  }

  async login(email: string, password: string): Promise<{ user: Perfil | null; error: string | null }> {
    await new Promise(resolve => setTimeout(resolve, 800))
    const found = this.usuarios.find(u => u.email === email)
    if (!found || password !== '123456') {
      return { user: null, error: 'Credenciales incorrectas.' }
    }
    this.currentUser = found
    return { user: found, error: null }
  }

  logout(): void {
    this.currentUser = null
  }

  getCurrentUser(): Perfil | null {
    return this.currentUser
  }

  // ── Gestión de cuentas ─────────────────────────────────────

  listarUsuarios(): Perfil[] {
    return [...this.usuarios]
  }

  crearUsuario(data: Omit<Perfil, 'id'>): Perfil {
    const nuevo: Perfil = {
      ...data,
      id: String(Date.now()),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.nombre)}`,
    }
    this.usuarios.push(nuevo)
    return nuevo
  }

  actualizarUsuario(id: string, data: Partial<Omit<Perfil, 'id'>>): Perfil | null {
    const idx = this.usuarios.findIndex(u => u.id === id)
    if (idx === -1) return null
    this.usuarios[idx] = { ...this.usuarios[idx], ...data }
    // Si el usuario logueado fue editado, sincronizar
    if (this.currentUser?.id === id) {
      this.currentUser = this.usuarios[idx]
    }
    return this.usuarios[idx]
  }

  eliminarUsuario(id: string): boolean {
    const idx = this.usuarios.findIndex(u => u.id === id)
    if (idx === -1) return false
    this.usuarios.splice(idx, 1)
    return true
  }
}
