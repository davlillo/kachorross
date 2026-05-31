import type { Perfil } from '@/types'
import { supabase } from '@/supabase/client'

let instance: AuthController | null = null

export class AuthController {
  private currentUser: Perfil | null = null

  static getInstance(): AuthController {
    if (!instance) instance = new AuthController()
    return instance
  }

  getCachedUser(): Perfil | null {
    return this.currentUser
  }

  clearCache(): void {
    this.currentUser = null
  }

  private mapPerfil(row: any): Perfil {
    return {
      id: row.id,
      veterinariaId: row.veterinaria_id ?? undefined,
      nombre: row.nombre,
      email: row.email,
      rol: row.rol as Perfil['rol'],
      avatar: row.avatar ?? undefined,
    }
  }

  private async getOrCreatePerfil(user: any): Promise<any> {
    const { data: existingPerfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('id,nombre,email,rol,avatar,veterinaria_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!perfilError && existingPerfil) {
      return existingPerfil;
    }

    const nombreParts = user.email?.split('@') ?? ['Usuario'];
    const defaultNombre = user.user_metadata?.nombre || nombreParts[0];
    const defaultRol = user.user_metadata?.rol || 'recepcion';
    const defaultVetId = user.user_metadata?.veterinaria_id || null;

    const { data: newPerfil, error: createError } = await supabase
      .from('perfiles')
      .insert({
        id: user.id,
        nombre: defaultNombre,
        email: user.email,
        rol: defaultRol,
        veterinaria_id: defaultVetId,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(defaultNombre)}`,
      })
      .select('id,nombre,email,rol,avatar,veterinaria_id')
      .maybeSingle()

    if (createError || !newPerfil) {
      return null;
    }

    return newPerfil;
  }

  private async checkVeterinariaSuspendida(veterinariaId: string): Promise<boolean> {
    const { data: vetData } = await supabase
      .from('veterinarias')
      .select('estado')
      .eq('id', veterinariaId)
      .maybeSingle()

    return vetData?.estado === 'suspendido'
  }

  async resolveUser(): Promise<Perfil | null> {
    return this.getCachedUser() ?? this.getCurrentUser()
  }

  async login(email: string, password: string): Promise<{ user: Perfil | null; error: string | null }> {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      return { user: null, error: 'Credenciales incorrectas.' }
    }

    const user = await this.getCurrentUser(true)
    if (!user) {
      return { user: null, error: 'Tu usuario no tiene perfil configurado o la cuenta está suspendida.' }
    }

    return { user, error: null }
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
    this.clearCache()
    return { ok: true, error: null }
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut()
    this.clearCache()
  }

  async actualizarContrasena(nuevaContrasena: string): Promise<{ ok: boolean; error: string | null }> {
    const { error } = await supabase.auth.updateUser({ password: nuevaContrasena })
    if (error) {
      return { ok: false, error: error.message }
    }
    return { ok: true, error: null }
  }

  async refreshCurrentUser(): Promise<Perfil | null> {
    this.clearCache()
    return this.getCurrentUser(true)
  }

  async getCurrentUser(forceRefresh = false): Promise<Perfil | null> {
    if (!forceRefresh && this.currentUser) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id === this.currentUser.id) {
        return this.currentUser
      }
    }

    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) {
      this.clearCache()
      return null
    }

    const perfilRow = await this.getOrCreatePerfil(authData.user)
    if (!perfilRow) {
      this.clearCache()
      return null
    }

    if (perfilRow.veterinaria_id && await this.checkVeterinariaSuspendida(perfilRow.veterinaria_id)) {
      await supabase.auth.signOut()
      this.clearCache()
      return null
    }

    this.currentUser = this.mapPerfil(perfilRow)
    return this.currentUser
  }

  async listarUsuarios(): Promise<Perfil[]> {
    const currentUser = await this.resolveUser()
    let query = supabase
      .from('perfiles')
      .select('id,nombre,email,rol,avatar,veterinaria_id')
      .order('created_at', { ascending: false })

    if (currentUser?.rol !== 'super_admin') {
      query = query.eq('veterinaria_id', currentUser?.veterinariaId)
    }

    const { data, error } = await query

    if (error) throw new Error(`No se pudieron listar usuarios: ${error.message}`)
    return (data ?? []).map(row => this.mapPerfil(row))
  }

  async crearUsuario(data: Omit<Perfil, 'id'>): Promise<Perfil> {
    const currentUser = await this.resolveUser()
    let vetId = data.veterinariaId;
    if (currentUser?.rol === 'admin') {
      vetId = currentUser.veterinariaId;
    }

    const { data: fnData, error: fnError } = await supabase.functions.invoke('admin-create-user', {
      body: {
        nombre: data.nombre,
        email: data.email,
        rol: data.rol,
        password: '123456',
        veterinaria_id: vetId,
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
    const currentUser = await this.resolveUser()
    const payload: any = {
      nombre: data.nombre,
      email: data.email,
      rol: data.rol,
      avatar: data.avatar,
      updated_at: new Date().toISOString(),
    }

    if (currentUser?.rol === 'super_admin' && data.veterinariaId !== undefined) {
      payload.veterinaria_id = data.veterinariaId;
    }

    const { data: updated, error } = await supabase
      .from('perfiles')
      .update(payload)
      .eq('id', id)
      .select('id,nombre,email,rol,avatar,veterinaria_id')
      .maybeSingle()

    if (error) throw new Error(`No se pudo actualizar usuario: ${error.message}`)
    if (!updated) return null

    const perfil = this.mapPerfil(updated)
    if (currentUser?.id === id) this.currentUser = perfil
    return perfil
  }

  async eliminarUsuario(id: string): Promise<boolean> {
    const currentUser = await this.resolveUser()
    const { error } = await supabase.from('perfiles').delete().eq('id', id)
    if (error) throw new Error(`No se pudo eliminar usuario: ${error.message}`)
    if (currentUser?.id === id) this.clearCache()
    return true
  }
}
