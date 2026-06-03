import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const authHeader = req.headers.get('Authorization') ?? ''
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const admin = createClient(supabaseUrl, serviceRoleKey)

    const {
      data: { user: caller },
      error: callerError,
    } = await client.auth.getUser()

    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: callerPerfil, error: callerPerfilError } = await admin
      .from('perfiles')
      .select('rol, veterinaria_id')
      .eq('id', caller.id)
      .maybeSingle()

    if (callerPerfilError || !callerPerfil || (callerPerfil.rol !== 'admin' && callerPerfil.rol !== 'super_admin')) {
      return new Response(JSON.stringify({ error: 'Sin permisos de administrador' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { action, nombre, email, rol, veterinaria_id, redirectTo, userId } = body

    if (action === 'delete') {
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Falta userId' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId)
      if (deleteAuthError) {
        return new Response(JSON.stringify({ error: deleteAuthError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { error: deletePerfilError } = await admin.from('perfiles').delete().eq('id', userId)
      if (deletePerfilError) {
        return new Response(JSON.stringify({ error: deletePerfilError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'update') {
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Falta userId' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const updatePayload: Record<string, any> = {}
      if (nombre !== undefined) updatePayload.nombre = nombre
      if (email !== undefined) updatePayload.email = email
      if (rol !== undefined) updatePayload.rol = rol
      updatePayload.updated_at = new Date().toISOString()

      const { data: updated, error: updateError } = await admin
        .from('perfiles')
        .update(updatePayload)
        .eq('id', userId)
        .select('id,nombre,email,rol,avatar,veterinaria_id')
        .maybeSingle()

      if (updateError || !updated) {
        return new Response(JSON.stringify({ error: updateError?.message ?? 'No se pudo actualizar perfil' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ ok: true, perfil: updated }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'resend-invite') {
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Falta userId' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: targetPerfil } = await admin
        .from('perfiles')
        .select('id, nombre, email, rol, veterinaria_id')
        .eq('id', userId)
        .maybeSingle()

      if (!targetPerfil) {
        return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const targetVetId = targetPerfil.veterinaria_id || callerPerfil.veterinaria_id
      const redirectUrl = redirectTo || ''

      if (redirectUrl && targetVetId) {
        const { data: vetData } = await admin
          .from('veterinarias')
          .select('nombre, logo_url')
          .eq('id', targetVetId)
          .maybeSingle()

        const vetNombre = vetData?.nombre || 'Veterinaria'
        const vetLogo = vetData?.logo_url || ''

        const { data: linkData } = await admin.auth.admin.generateLink({
          type: 'recovery',
          email: targetPerfil.email,
          options: {
            redirectTo: `${redirectUrl}/establecer-contrasena`,
          },
        })

        if (linkData?.properties?.action_link) {
          const avatarImg = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(targetPerfil.nombre)}`
          const invitationHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
              <div style="text-align: center; margin-bottom: 24px;">
                ${vetLogo ? `<img src="${vetLogo}" alt="${vetNombre}" style="max-height: 60px; margin-bottom: 12px;" />` : ''}
                <h1 style="color: #7c3aed; font-size: 24px; margin: 0;">${vetNombre}</h1>
              </div>
              <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 20px;">
                  <img src="${avatarImg}" alt="${targetPerfil.nombre}" style="width: 64px; height: 64px; border-radius: 50%; border: 3px solid #7c3aed;" />
                </div>
                <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 16px 0; text-align: center;">Invitación reenviada</h2>
                <p style="color: #4b5563; font-size: 14px; line-height: 1.6; text-align: center;">Hola <strong>${targetPerfil.nombre}</strong>,</p>
                <p style="color: #4b5563; font-size: 14px; line-height: 1.6; text-align: center;">
                  Has sido invitado al sistema de <strong>${vetNombre}</strong> con el rol de <strong>${targetPerfil.rol}</strong>.
                </p>
                <p style="color: #4b5563; font-size: 14px; line-height: 1.6; text-align: center;">
                  Para comenzar, haz clic en el botón de abajo y establece tu contraseña:
                </p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${linkData.properties.action_link}"
                     style="display: inline-block; background: #7c3aed; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">
                    Establecer mi contraseña
                  </a>
                </div>
                <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; text-align: center;">
                  ⏰ Este enlace expirará en <strong>24 horas</strong>.
                </p>
              </div>
              <div style="text-align: center; margin-top: 16px;">
                <p style="color: #9ca3af; font-size: 12px;">&copy; 2026 ${vetNombre}. Todos los derechos reservados.</p>
              </div>
            </div>
          `

          const sendEmailUrl = `${supabaseUrl}/functions/v1/send-email`
          await fetch(sendEmailUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
            body: JSON.stringify({
              veterinariaId: targetVetId,
              to: targetPerfil.email,
              subject: `Reenvío de invitación - ${vetNombre}`,
              html: invitationHtml,
            }),
          })
        }
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!nombre || !email || !rol) {
      return new Response(JSON.stringify({ error: 'Payload incompleto' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const randomPassword = crypto.randomUUID()

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: randomPassword,
      email_confirm: true,
      user_metadata: { nombre, rol, veterinaria_id },
    })

    if (createError || !created.user) {
      return new Response(JSON.stringify({ error: createError?.message ?? 'No se pudo crear usuario Auth' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nombre)}`

    const { data: perfil, error: perfilError } = await admin
      .from('perfiles')
      .upsert(
        {
          id: created.user.id,
          nombre,
          email,
          rol,
          avatar,
          veterinaria_id: veterinaria_id || null,
        },
        { onConflict: 'id' }
      )
      .select('id,nombre,email,rol,avatar,veterinaria_id')
      .single()

    if (perfilError) {
      return new Response(JSON.stringify({ error: perfilError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const vetId = veterinaria_id || callerPerfil.veterinaria_id
    let recoveryLink: string | undefined

    if (redirectTo) {
      try {
        const { data: linkData } = await admin.auth.admin.generateLink({
          type: 'recovery',
          email,
          options: {
            redirectTo: `${redirectTo}/establecer-contrasena`,
          },
        })

        if (linkData?.properties?.action_link) {
          recoveryLink = linkData.properties.action_link
          const avatarImg = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nombre)}`
          const sendEmailUrl = `${supabaseUrl}/functions/v1/send-email`

          if (vetId) {
            const { data: vetData } = await admin
              .from('veterinarias')
              .select('nombre, logo_url')
              .eq('id', vetId)
              .maybeSingle()

            const vetNombre = vetData?.nombre || 'Veterinaria'
            const vetLogo = vetData?.logo_url || ''

            const invitationHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  ${vetLogo ? `<img src="${vetLogo}" alt="${vetNombre}" style="max-height: 60px; margin-bottom: 12px;" />` : ''}
                  <h1 style="color: #7c3aed; font-size: 24px; margin: 0;">${vetNombre}</h1>
                </div>
                <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <div style="text-align: center; margin-bottom: 20px;">
                    <img src="${avatarImg}" alt="${nombre}" style="width: 64px; height: 64px; border-radius: 50%; border: 3px solid #7c3aed;" />
                  </div>
                  <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 16px 0; text-align: center;">Has sido invitado</h2>
                  <p style="color: #4b5563; font-size: 14px; line-height: 1.6; text-align: center;">Hola <strong>${nombre}</strong>,</p>
                  <p style="color: #4b5563; font-size: 14px; line-height: 1.6; text-align: center;">
                    Has sido invitado al sistema de <strong>${vetNombre}</strong> con el rol de <strong>${rol}</strong>.
                  </p>
                  <p style="color: #4b5563; font-size: 14px; line-height: 1.6; text-align: center;">
                    Para comenzar, haz clic en el botón de abajo y establece tu contraseña:
                  </p>
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${recoveryLink}"
                       style="display: inline-block; background: #7c3aed; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">
                      Establecer mi contraseña
                    </a>
                  </div>
                  <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; text-align: center;">
                    ⏰ Este enlace expirará en <strong>24 horas</strong>.
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; text-align: center;">
                    Si no esperabas esta invitación, puedes ignorar este correo.
                  </p>
                </div>
                <div style="text-align: center; margin-top: 16px;">
                  <p style="color: #9ca3af; font-size: 12px;">&copy; 2026 ${vetNombre}. Todos los derechos reservados.</p>
                </div>
              </div>
            `

            await fetch(sendEmailUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
              body: JSON.stringify({
                veterinariaId: vetId,
                to: email,
                subject: `Has sido invitado a ${vetNombre}`,
                html: invitationHtml,
              }),
            })
          } else {
            const invitationHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h1 style="color: #7c3aed; font-size: 24px; margin: 0;">Sistema Veterinario</h1>
                </div>
                <div style="background: white; padding: 32px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <div style="text-align: center; margin-bottom: 20px;">
                    <img src="${avatarImg}" alt="${nombre}" style="width: 64px; height: 64px; border-radius: 50%; border: 3px solid #7c3aed;" />
                  </div>
                  <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 16px 0; text-align: center;">Has sido invitado</h2>
                  <p style="color: #4b5563; font-size: 14px; line-height: 1.6; text-align: center;">Hola <strong>${nombre}</strong>,</p>
                  <p style="color: #4b5563; font-size: 14px; line-height: 1.6; text-align: center;">
                    Has sido invitado al sistema con el rol de <strong>${rol}</strong>.
                  </p>
                  <p style="color: #4b5563; font-size: 14px; line-height: 1.6; text-align: center;">
                    Para comenzar, haz clic en el botón de abajo y establece tu contraseña:
                  </p>
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${recoveryLink}"
                       style="display: inline-block; background: #7c3aed; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">
                      Establecer mi contraseña
                    </a>
                  </div>
                  <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; text-align: center;">
                    ⏰ Este enlace expirará en <strong>24 horas</strong>.
                  </p>
                </div>
                <div style="text-align: center; margin-top: 16px;">
                  <p style="color: #9ca3af; font-size: 12px;">&copy; 2026 Sistema Veterinario. Todos los derechos reservados.</p>
                </div>
              </div>
            `

            await fetch(sendEmailUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
              body: JSON.stringify({
                to: email,
                subject: 'Has sido invitado al Sistema Veterinario',
                html: invitationHtml,
                useSystemConfig: true,
              }),
            })
          }
        }
      } catch {
        console.error('Error al enviar email de invitación')
      }
    }

    return new Response(JSON.stringify({ ok: true, perfil, recoveryLink }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Error inesperado' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
