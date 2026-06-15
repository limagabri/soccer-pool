// Supabase Edge Function — enviar-push
// Envia Web Push Notifications usando a lib `web-push` (criptografia aes128gcm
// correta — payloads sem criptografia são rejeitados pelos navegadores).
//
// Body (POST, JSON):
//   { titulo?, mensagem?, url?, user_ids?: string[] }
//   - user_ids ausente/vazio → envia para TODOS os inscritos
//   - user_ids preenchido    → envia só para esses usuários (ex.: menções @)
//
// Secrets necessários: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
//
// Deploy: supabase functions deploy enviar-push

import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@bolaocopa.app'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Sub {
  id: string
  endpoint: string
  p256dh: string
  auth_key: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  let body: { titulo?: string; mensagem?: string; url?: string; user_ids?: string[] } = {}
  try { body = await req.json() } catch { /* defaults */ }

  // Autorização: identifica o chamador. Não-admin só pode notificar
  // destinatários específicos (ex.: menções), no máximo 10 — não pode disparar
  // para todo mundo (evita spam). Admin pode fazer broadcast.
  const callerClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: { user: caller } } = await callerClient.auth.getUser()
  if (!caller) {
    return Response.json({ error: 'unauthenticated' }, { status: 401, headers: corsHeaders })
  }
  const { data: prof } = await callerClient.from('profiles').select('is_admin').eq('id', caller.id).single()
  if (!prof?.is_admin) {
    if (!body.user_ids?.length) {
      return Response.json({ error: 'forbidden: user_ids required' }, { status: 403, headers: corsHeaders })
    }
    body.user_ids = body.user_ids.slice(0, 10)
  }

  const titulo = body.titulo ?? '⚽ BolãoCopa 2026'
  const mensagem = body.mensagem ?? 'Novo aviso do bolão!'

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  let query = sb.from('push_subscriptions').select('id, endpoint, p256dh, auth_key')
  if (body.user_ids?.length) query = query.in('user_id', body.user_ids)
  const { data: subs } = await query

  if (!subs || subs.length === 0) {
    return Response.json({ sent: 0, total: 0 }, { headers: corsHeaders })
  }

  // Não fixamos base: o service worker resolve ícone/url a partir do seu scope.
  const payload = JSON.stringify({
    title: titulo,
    body: mensagem,
    url: body.url, // relativo ao app (ex.: "palpites") ou undefined
  })

  let sent = 0
  const expirados: string[] = []

  await Promise.allSettled(
    (subs as Sub[]).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } },
          payload
        )
        sent++
      } catch (err) {
        // 404/410 → subscription morta; remove
        const code = (err as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) expirados.push(s.id)
      }
    })
  )

  if (expirados.length) {
    await sb.from('push_subscriptions').delete().in('id', expirados)
  }

  return Response.json({ sent, total: subs.length, removed: expirados.length }, { headers: corsHeaders })
})
