import type { Perfil } from '@/types'
import { supabase } from '@/supabase/client'

let instance: AuthController | null = null

export class AuthController {
  private currentUser: Perfil | null = null

  static getInstance(): AuthController {
    if (!instance) instance = new AuthController()
    return instance
  }

  private mapPerfil(row: any): Perfil {
    return {
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      rol: row.rol as Perfil['rol'],
      avatar: row.avatar ?? undefined,
    }
  }

  async login(email: string, password: string): Promise<{ user: Perfil | null; error: string | null }> {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      return { user: null, error: 'Credenciales incorrectas.' }
    }

    const { data: perfilRow, error: perfilError } = await supabase
      .from('perfiles')
      .select('id,nombre,email,rol,avatar')
      .eq('id', authData.user.id)
      .maybeSingle()

    if (perfilError || !perfilRow) {
      return { user: null, error: 'Tu usuario no tiene perfil configurado.' }
    }

    const found = this.mapPerfil(perfilRow)
    this.currentUser = found
    return { user: found, error: null }
  }

  async registrar(
    nombre: string,
    email: string,
    password: string,
    rol: Perfil['rol']
  ): Promise<{ ok: boolean; error: string | null }> {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre, rol },
      },
    })

    if (authError || !authData.user) {
      return { ok: false, error: authError?.message ?? 'No se pudo registrar usuario.' }
    }

    const { error: perfilError } = await supabase.from('perfiles').upsert(
      {
        id: authData.user.id,
        nombre,
        email,
        rol,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nombre)}`,
      },
      { onConflict: 'id' }
    )

    if (perfilError) {
      return { ok: false, error: `Registro creado, pero faltó perfil: ${perfilError.message}` }
    }

    await supabase.auth.signOut()
    return { ok: true, error: null }
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut()
    this.currentUser = null
  }

  async actualizarContrasena(nuevaContrasena: string): Promise<{ ok: boolean; error: string | null }> {
    const { error } = await supabase.auth.updateUser({ password: nuevaContrasena })
    if (error) {
      return { ok: false, error: error.message }
    }
    return { ok: true, error: null }
  }

  async getCurrentUser(): Promise<Perfil | null> {
    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) return null

    const { data, error } = await supabase
      .from('perfiles')
      .select('id,nombre,email,rol,avatar')
      .eq('id', authData.user.id)
      .maybeSingle()

    if (error || !data) return null
    this.currentUser = this.mapPerfil(data)
    return this.currentUser
  }

  // ── Gestión de cuentas ─────────────────────────────────────

  async listarUsuarios(): Promise<Perfil[]> {
    const { data, error } = await supabase
      .from('perfiles')
      .select('id,nombre,email,rol,avatar')
      .order('created_at', { ascending: false })

    if (error) throw new Error(`No se pudieron listar usuarios: ${error.message}`)
    return (data ?? []).map(row => this.mapPerfil(row))
  }

  async crearUsuario(data: Omit<Perfil, 'id'>): Promise<Perfil> {
    const { data: fnData, error: fnError } = await supabase.functions.invoke('admin-create-user', {
      body: {
        nombre: data.nombre,
        email: data.email,
        rol: data.rol,
        password: '123456',
      },
    })

    if (fnError) {
      const msg = fnError.message?.toLowerCase() ?? ''
      if (msg.includes('not found') || msg.includes('404')) {
        throw new Error('La función admin-create-user no está desplegada en Supabase.')
      }
      throw new Error(fnError.message || 'No se pudo crear usuario desde función admin.')
    }

    if (!fnData || typeof fnData !== 'object' || !('perfil' in fnData)) {
      throw new Error('Respuesta inválida de admin-create-user.')
    }

    const perfil = (fnData as { perfil: any }).perfil
    return this.mapPerfil(perfil)
  }

  async actualizarUsuario(id: string, data: Partial<Omit<Perfil, 'id'>>): Promise<Perfil | null> {
    const payload = {
      nombre: data.nombre,
      email: data.email,
      rol: data.rol,
      avatar: data.avatar,
      updated_at: new Date().toISOString(),
    }

    const { data: updated, error } = await supabase
      .from('perfiles')
      .update(payload)
      .eq('id', id)
      .select('id,nombre,email,rol,avatar')
      .maybeSingle()

    if (error) throw new Error(`No se pudo actualizar usuario: ${error.message}`)
    if (!updated) return null

    const perfil = this.mapPerfil(updated)
    if (this.currentUser?.id === id) this.currentUser = perfil
    return perfil
  }

  async eliminarUsuario(id: string): Promise<boolean> {
    const { error } = await supabase.from('perfiles').delete().eq('id', id)
    if (error) throw new Error(`No se pudo eliminar usuario: ${error.message}`)
    if (this.currentUser?.id === id) this.currentUser = null
    return true
  }
}
