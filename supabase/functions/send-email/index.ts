import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendEmailPayload {
  veterinariaId: string
  to: string
  subject: string
  html: string
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

    // Verificar autenticación
    const { data: { user: caller }, error: callerError } = await client.auth.getUser()
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verificar rol (admin o super_admin)
    const { data: callerPerfil } = await admin
      .from('perfiles')
      .select('rol')
      .eq('id', caller.id)
      .maybeSingle()

    if (!callerPerfil || (callerPerfil.rol !== 'admin' && callerPerfil.rol !== 'super_admin')) {
      return new Response(JSON.stringify({ error: 'Sin permisos de administrador' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { veterinariaId, to, subject, html }: SendEmailPayload = await req.json()
    if (!veterinariaId || !to || !subject || !html) {
      return new Response(JSON.stringify({ error: 'Payload incompleto' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Obtener config SMTP de la veterinaria
    const { data: emailConfig, error: configError } = await admin
      .from('config_email')
      .select('*')
      .eq('veterinaria_id', veterinariaId)
      .maybeSingle()

    if (configError || !emailConfig || !emailConfig.activo) {
      return new Response(JSON.stringify({ error: 'Configuración de correo no encontrada o inactiva' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Enviar email vía Gmail SMTP con nodemailer
    const { createTransport } = await import('npm:nodemailer@6.9.16')

    const transporter = createTransport({
      host: emailConfig.smtp_host,
      port: emailConfig.smtp_port,
      secure: emailConfig.smtp_port === 465,
      auth: {
        user: emailConfig.smtp_user,
        pass: emailConfig.smtp_pass,
      },
    })

    await transporter.sendMail({
      from: `"${emailConfig.from_name || 'Veterinaria Kachorros'}" <${emailConfig.from_email || emailConfig.smtp_user}>`,
      to,
      subject,
      html,
    })

    // Registrar en notificaciones
    await admin.from('notificaciones').insert({
      veterinaria_id: veterinariaId,
      destinatario_email: to,
      tipo_notificacion: 'personalizado',
      estado: 'enviado',
      fecha_envio: new Date().toISOString(),
    })

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error inesperado'

    // Intentar registrar el fallo si es posible
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const fallbackClient = createClient(supabaseUrl, serviceRoleKey)
      await fallbackClient.from('notificaciones').insert({
        veterinaria_id: 'unknown',
        destinatario_email: 'unknown',
        tipo_notificacion: 'personalizado',
        estado: 'fallido',
        codigo_error: errorMessage,
        fecha_envio: new Date().toISOString(),
      })
    } catch {
      // No podemos hacer nada si falla el log
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
