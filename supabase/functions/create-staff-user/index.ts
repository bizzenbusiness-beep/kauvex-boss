import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const KAUVEX_ROLES = ["platform_owner", "platform_dev", "platform_support", "platform_bom", "platform_investor"]
const COMPANY_ADMIN_ROLES = ["bdd", "bgm", "cbo", "bom", "bdm", "cgo", "bso", "hr_manager"]
function hasFullVisibility(role: string) {
  return KAUVEX_ROLES.includes(role) || COMPANY_ADMIN_ROLES.includes(role)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Client scoped to the CALLER's own JWT — used only to verify who is calling
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: caller }, error: callerErr } = await callerClient.auth.getUser()
    if (callerErr || !caller) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Admin client (service role) — used only after the caller is verified as admin
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: callerProfile, error: profErr } = await adminClient
      .from('profiles').select('role').eq('id', caller.id).single()
    if (profErr || !callerProfile || !hasFullVisibility(callerProfile.role)) {
      return new Response(JSON.stringify({ error: 'Not authorized to add team members' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { email, password, full_name, role, company_id } = await req.json()
    if (!email || !password || !full_name || !role || !company_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email, password, email_confirm: true,
    })
    if (createErr || !newUser?.user) {
      return new Response(JSON.stringify({ error: createErr?.message || 'Could not create user' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { error: insertErr } = await adminClient.from('profiles').upsert({
      id: newUser.user.id, email, full_name, role, company_id,
    })
    if (insertErr) {
      // rollback: remove the auth user so we don't leave an orphaned login
      await adminClient.auth.admin.deleteUser(newUser.user.id)
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, user_id: newUser.user.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
