import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Jogo } from '../types'

export type NotifStatus = 'loading' | 'unsupported' | 'denied' | 'off' | 'on'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i)
  return outputArray.buffer
}

export function useNotificacoes() {
  const { user } = useAuth()
  const [status, setStatus] = useState<NotifStatus>('loading')
  const agendados = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }
    // Verificar se já tem subscription salva
    supabase.from('push_subscriptions').select('id').eq('user_id', user?.id ?? '').maybeSingle()
      .then(({ data }) => setStatus(data ? 'on' : 'off'))
  }, [user?.id])

  const ativar = useCallback(async (): Promise<boolean> => {
    if (!user) return false
    if (!('serviceWorker' in navigator) || !VAPID_PUBLIC_KEY) {
      setStatus('unsupported')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        return false
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const json = subscription.toJSON()
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: json.endpoint!,
        p256dh: json.keys!.p256dh,
        auth_key: json.keys!.auth,
      }, { onConflict: 'user_id,endpoint' })

      if (error) return false
      setStatus('on')
      return true
    } catch {
      return false
    }
  }, [user])

  const desativar = useCallback(async () => {
    if (!user) return
    await supabase.from('push_subscriptions').delete().eq('user_id', user.id)
    setStatus('off')
  }, [user])

  const agendarNotificacaoJogo = useCallback((jogo: Jogo) => {
    if (status !== 'on' || agendados.current.has(jogo.id)) return
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const inicio = new Date(jogo.data_jogo).getTime()
    const umHoraAntes = inicio - 60 * 60 * 1000
    const agora = Date.now()
    const delay = umHoraAntes - agora

    if (delay < 0 || delay > 24 * 60 * 60 * 1000) return

    agendados.current.add(jogo.id)
    setTimeout(() => {
      new Notification('⚽ BolãoCopa 2026', {
        body: `${jogo.emoji_casa} ${jogo.time_casa} × ${jogo.time_fora} ${jogo.emoji_fora} começa em 1 hora! Faça seu palpite.`,
        icon: `${import.meta.env.BASE_URL}pwa-icon.svg`,
        badge: `${import.meta.env.BASE_URL}pwa-icon.svg`,
        tag: `jogo-${jogo.id}`,
      })
    }, delay)
  }, [status])

  return { status, ativar, desativar, agendarNotificacaoJogo }
}
