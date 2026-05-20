import type { Mascota, Propietario, Expediente, RegistrarExpedienteDTO } from '@/types'
import { mascotas as mockMascotas, expedientes as mockExpedientes, propietarios as mockPropietarios } from '@/data/mockData'

let instance: MascotaController | null = null

export class MascotaController {
  private mascotas: Mascota[]
  private expedientes: Expediente[]
  private propietarios: Propietario[]

  private constructor() {
    this.mascotas = [...mockMascotas]
    this.expedientes = [...mockExpedientes]
    this.propietarios = [...mockPropietarios]
  }

  static getInstance(): MascotaController {
    if (!instance) instance = new MascotaController()
    return instance
  }

  getAll(): Mascota[] {
    return this.mascotas
  }

  getById(id: string): Mascota | undefined {
    return this.mascotas.find(m => m.id === id)
  }

  buscar(query: string): Mascota[] {
    const lower = query.toLowerCase()
    return this.mascotas.filter(
      m =>
        m.nombre.toLowerCase().includes(lower) ||
        m.propietario.nombre.toLowerCase().includes(lower)
    )
  }

  getExpedienteById(id: string): Expediente | undefined {
    return this.expedientes.find(exp => exp.id === id || exp.mascotaId === id)
  }

  buscarExpedientes(query: string): Expediente[] {
    const lower = query.toLowerCase()
    return this.expedientes.filter(
      exp =>
        exp.mascota.nombre.toLowerCase().includes(lower) ||
        exp.mascota.propietario.nombre.toLowerCase().includes(lower) ||
        exp.mascota.propietario.telefono.includes(lower) ||
        exp.mascota.raza.toLowerCase().includes(lower)
    )
  }

  actualizar(id: string, data: {
    mascota?: Partial<Pick<Mascota, 'nombre' | 'especie' | 'raza' | 'fechaNacimiento' | 'sexo' | 'color' | 'peso' | 'foto' | 'alergias' | 'notasEspeciales'>>;
    propietario?: Partial<Pick<Propietario, 'nombre' | 'telefono' | 'email' | 'direccion'>>;
  }): Mascota | undefined {
    const idx = this.mascotas.findIndex(m => m.id === id)
    if (idx === -1) return undefined

    const mascota = { ...this.mascotas[idx] }
    if (data.propietario) {
      mascota.propietario = { ...mascota.propietario, ...data.propietario }
    }
    if (data.mascota) {
      Object.assign(mascota, data.mascota)
    }
    this.mascotas[idx] = mascota

    const expIdx = this.expedientes.findIndex(e => e.mascotaId === id)
    if (expIdx !== -1) this.expedientes[expIdx] = { ...this.expedientes[expIdx], mascota }

    return mascota
  }

  eliminar(id: string): boolean {
    const mIdx = this.mascotas.findIndex(m => m.id === id)
    if (mIdx === -1) return false
    this.mascotas.splice(mIdx, 1)
    const eIdx = this.expedientes.findIndex(e => e.mascotaId === id)
    if (eIdx !== -1) this.expedientes.splice(eIdx, 1)
    return true
  }

  registrar(data: RegistrarExpedienteDTO): Expediente {
    const propietario: Propietario = {
      id: `p${Date.now()}`,
      nombre: data.propietario.nombre,
      telefono: data.propietario.telefono,
      email: data.propietario.email,
      direccion: data.propietario.direccion,
    }
    this.propietarios.push(propietario)

    const mascota: Mascota = {
      id: `m${Date.now()}`,
      nombre: data.mascota.nombre,
      especie: data.mascota.especie,
      raza: data.mascota.raza,
      fechaNacimiento: data.mascota.fechaNacimiento,
      sexo: data.mascota.sexo,
      color: data.mascota.color || '',
      peso: data.mascota.peso || 0,
      foto: data.mascota.foto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.mascota.nombre}`,
      propietario,
      alergias: data.mascota.alergias || [],
      notasEspeciales: data.mascota.notasEspeciales,
      fechaRegistro: new Date().toISOString().split('T')[0],
    }
    this.mascotas.push(mascota)

    const expediente: Expediente = {
      id: `exp-${mascota.id}`,
      mascotaId: mascota.id,
      mascota,
      consultas: [],
      fotosEvolucion: [],
      vacunas: [],
    }
    this.expedientes.push(expediente)

    return expediente
  }
}
