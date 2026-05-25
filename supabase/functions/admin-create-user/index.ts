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
      .select('rol')
      .eq('id', caller.id)
      .maybeSingle()

    if (callerPerfilError || !callerPerfil || (callerPerfil.rol !== 'admin' && callerPerfil.rol !== 'super_admin')) {
      return new Response(JSON.stringify({ error: 'Sin permisos de administrador' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { nombre, email, rol, password, veterinaria_id } = await req.json()
    if (!nombre || !email || !rol || !password) {
      return new Response(JSON.stringify({ error: 'Payload incompleto' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
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

    return new Response(JSON.stringify({ ok: true, perfil }), {
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
