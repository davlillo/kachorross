import { supabase } from '@/supabase/client'
import {
  formatoFechaLegibleClave,
  horaDesdeIsoEnElSalvador,
  mananaEnElSalvador,
} from '@/lib/fechaAgenda'
import { formatoHoraLegible } from '@/lib/horariosClinica'
import type { EmailConfig } from '@/types'

const GMAIL_HOST = 'smtp.gmail.com'
const GMAIL_PORT = 587

let instance: EmailController | null = null

export class EmailController {
  static getInstance(): EmailController {
    if (!instance) instance = new EmailController()
    return instance
  }

  private mapConfig(row: any): EmailConfig {
    return {
      id: row.id,
      veterinariaId: row.veterinaria_id,
      smtpHost: row.smtp_host,
      smtpPort: row.smtp_port,
      smtpUser: row.smtp_user,
      smtpPass: row.smtp_pass,
      fromName: row.from_name ?? undefined,
      fromEmail: row.from_email ?? undefined,
      activo: row.activo,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  async getConfig(veterinariaId: string): Promise<EmailConfig | null> {
    const { data, error } = await supabase
      .from('config_email')
      .select('*')
      .eq('veterinaria_id', veterinariaId)
      .maybeSingle()

    if (error) throw new Error(`Error al obtener configuración de correo: ${error.message}`)
    if (!data) return null
    return this.mapConfig(data)
  }

  async saveConfig(
    veterinariaId: string,
    data: {
      smtpUser: string
      smtpPass: string
      fromName?: string
    }
  ): Promise<EmailConfig> {
    const existing = await this.getConfig(veterinariaId)
    const payload: any = {
      smtp_host: GMAIL_HOST,
      smtp_port: GMAIL_PORT,
      smtp_user: data.smtpUser,
      from_name: data.fromName || null,
      from_email: data.smtpUser,
      activo: true,
    }

    if (data.smtpPass) {
      payload.smtp_pass = data.smtpPass
    }

    if (existing) {
      const { data: updated, error } = await supabase
        .from('config_email')
        .update(payload)
        .eq('veterinaria_id', veterinariaId)
        .select('*')
        .maybeSingle()

      if (error) throw new Error(`Error al actualizar configuración: ${error.message}`)
      if (!updated) throw new Error('No se pudo actualizar la configuración')
      return this.mapConfig(updated)
    } else {
      const { data: created, error } = await supabase
        .from('config_email')
        .insert({
          veterinaria_id: veterinariaId,
          ...payload,
        })
        .select('*')
        .maybeSingle()

      if (error) throw new Error(`Error al guardar configuración: ${error.message}`)
      if (!created) throw new Error('No se pudo crear la configuración')
      return this.mapConfig(created)
    }
  }

  async enviarTratamientoEmail(params: {
    veterinariaId: string
    veterinariaNombre: string
    veterinariaTelefono?: string
    veterinariaDireccion?: string
    propietarioEmail: string
    propietarioNombre: string
    mascotaNombre: string
    fecha: string
    pdfBase64: string
  }): Promise<{ ok: boolean; error?: string }> {
    try {
      const config = await this.getConfig(params.veterinariaId)
      if (!config) {
        return { ok: false, error: 'No hay configuración SMTP. Configúralo en Ajustes > Correo.' }
      }

      const fechaFormateada = new Date(params.fecha).toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })

      const telefono = params.veterinariaTelefono ? `\n📞 ${params.veterinariaTelefono}` : ''
      const direccion = params.veterinariaDireccion ? `\n📍 ${params.veterinariaDireccion}` : ''

      const text = `\
Estimado/a ${params.propietarioNombre},

Le informamos que el tratamiento recetado para ${params.mascotaNombre}
luego de su consulta del ${fechaFormateada} está listo.

Si tiene cualquier duda o consulta sobre este tratamiento,
no dude en contactarnos. ¡Estamos a su servicio!${telefono}${direccion}

Atentamente,
${params.veterinariaNombre}

---
© ${new Date().getFullYear()} ${params.veterinariaNombre}${telefono ? ` ${params.veterinariaTelefono}` : ''} | Gracias por confiar en nosotros 🐾`

      const { error: fnError } = await supabase.functions.invoke('send-email', {
        body: {
          veterinariaId: params.veterinariaId,
          to: params.propietarioEmail,
          subject: `${params.veterinariaNombre} - Tratamiento para ${params.mascotaNombre}`,
          text,
          attachment: {
            filename: `tratamiento_${params.mascotaNombre.replace(/\s+/g, '_')}.pdf`,
            content: params.pdfBase64,
            contentType: 'application/pdf',
          },
        },
      })

      if (fnError) {
        return { ok: false, error: fnError.message }
      }

      return { ok: true }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Error inesperado al enviar correo' }
    }
  }

  async probarConexion(veterinariaId: string): Promise<{ ok: boolean; error?: string }> {
    const config = await this.getConfig(veterinariaId)
    if (!config) return { ok: false, error: 'No hay configuración de correo guardada' }

    const { error: fnError } = await supabase.functions.invoke('send-email', {
      body: {
        veterinariaId,
        to: config.smtpUser,
        subject: 'Prueba de conexión SMTP',
        html: '<p>Si recibes este correo, la configuración SMTP funciona correctamente.</p>',
      },
    })

    if (fnError) {
      return { ok: false, error: fnError.message }
    }

    return { ok: true }
  }

  /**
   * Recordatorio de un control (usa send-email, la misma función que el tratamiento).
   * Para envío masivo de mañana sigue existiendo send-reminders en Configuración.
   */
  async enviarRecordatorioCita(params: {
    veterinariaId: string
    veterinariaNombre: string
    propietarioEmail: string
    propietarioNombre: string
    mascotaNombre: string
    proximaCitaIso: string
    motivo?: string
  }): Promise<{ ok: boolean; error?: string }> {
    try {
      const config = await this.getConfig(params.veterinariaId)
      if (!config) {
        return { ok: false, error: 'No hay configuración SMTP en Configuración.' }
      }

      const fechaManana = mananaEnElSalvador()
      const fechaLegible = formatoFechaLegibleClave(fechaManana)
      const hhmm = horaDesdeIsoEnElSalvador(params.proximaCitaIso)
      const horaLegible = formatoHoraLegible(hhmm)
      const titulo = params.motivo ? `Control: ${params.motivo}` : 'Control de seguimiento'

      const text = `Estimado/a ${params.propietarioNombre},

Le recordamos que mañana ${fechaLegible} tiene programado en ${params.veterinariaNombre}:

🐾 ${params.mascotaNombre}:
  • Control: ${titulo} (${horaLegible})

Si necesita reprogramar o tiene alguna consulta, no dude en contactarnos.

Atentamente,
${params.veterinariaNombre}

---
© ${new Date().getFullYear()} ${params.veterinariaNombre} | Gracias por confiar en nosotros 🐾`

      const { error: fnError } = await supabase.functions.invoke('send-email', {
        body: {
          veterinariaId: params.veterinariaId,
          to: params.propietarioEmail,
          subject: `${params.veterinariaNombre} — Recordatorio para mañana`,
          text,
          tipoNotificacion: 'recordatorio',
        },
      })

      if (fnError) {
        const msg = fnError.message?.includes('non-2xx')
          ? 'No se pudo enviar el recordatorio. Verifica que send-email esté desplegada en Supabase.'
          : fnError.message
        return { ok: false, error: msg }
      }

      return { ok: true }
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Error al enviar recordatorio',
      }
    }
  }

  async enviarRecordatoriosAgenda(): Promise<{
    ok: boolean
    enviados?: number
    grupos?: number
    omitidos?: number
    fechaManana?: string
    controlesEncontrados?: number
    sinEmailPropietario?: number
    detalle?: string[]
    errores?: string[]
    error?: string
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('send-reminders', { body: {} })

      if (error) {
        const msg = error.message?.includes('Failed to send') || error.message?.includes('non-2xx')
          ? 'La función send-reminders no está desplegada en Supabase. Crea/despliega la Edge Function o usa el recordatorio al terminar la consulta en recepción.'
          : error.message
        return { ok: false, error: msg }
      }

      const result = data as {
        ok?: boolean
        enviados?: number
        grupos?: number
        omitidos?: number
        fechaManana?: string
        controlesEncontrados?: number
        sinEmailPropietario?: number
        detalle?: string[]
        errores?: string[]
        error?: string
      } | null

      if (result?.error) {
        return { ok: false, error: result.error }
      }

      return {
        ok: true,
        enviados: result?.enviados ?? 0,
        grupos: result?.grupos ?? 0,
        omitidos: result?.omitidos ?? 0,
        fechaManana: result?.fechaManana,
        controlesEncontrados: result?.controlesEncontrados,
        sinEmailPropietario: result?.sinEmailPropietario,
        detalle: result?.detalle ?? [],
        errores: result?.errores ?? [],
      }
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'No se pudieron enviar recordatorios',
      }
    }
  }
}
