// Edge Function: admin-upsert-palpites
// Inserts/updates palpites for any user, bypassing RLS (service role).
// Body: { user_id: string, palpites: [{jogo_id, gols_casa, gols_fora}] }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const authHeader = req.headers.get('authorization') ?? ''
  const token      = authHeader.replace('Bearer ', '')

  const supabase = createClient(supabaseUrl, serviceKey)

  // Verify caller is authenticated
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Verify caller is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const body = await req.json() as {
    user_id: string
    palpites: Array<{ jogo_id: string; gols_casa: number; gols_fora: number }>
  }

  const { user_id, palpites } = body

  if (!user_id || !palpites?.length) {
    return new Response(JSON.stringify({ error: 'Missing user_id or palpites' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Upsert palpites — service_role bypasses all RLS policies
  const rows = palpites.map(p => ({
    user_id,
    jogo_id:   p.jogo_id,
    gols_casa: p.gols_casa,
    gols_fora: p.gols_fora,
  }))

  const { error: upsertErr } = await supabase
    .from('palpites')
    .upsert(rows, { onConflict: 'user_id,jogo_id' })

  if (upsertErr) {
    return new Response(JSON.stringify({ error: upsertErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Trigger point recalculation for any encerrado games in the batch.
  // The DB trigger `trigger_pontos_jogo` fires on UPDATE jogos and
  // recalculates pontos for all palpites of that game.
  const jogoIds = palpites.map(p => p.jogo_id)
  const { data: encerrados } = await supabase
    .from('jogos')
    .select('id, gols_casa, gols_fora')
    .in('id', jogoIds)
    .eq('encerrado', true)

  for (const j of encerrados ?? []) {
    await supabase
      .from('jogos')
      .update({ gols_casa: j.gols_casa, gols_fora: j.gols_fora, encerrado: true })
      .eq('id', j.id)
  }

  return new Response(
    JSON.stringify({ success: true, count: rows.length, recalculated: (encerrados ?? []).length }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
