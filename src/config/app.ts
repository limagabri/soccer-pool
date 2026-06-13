/** Central app configuration — all values come from environment variables. */
export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME ?? 'BolãoCopa',
  year: import.meta.env.VITE_APP_YEAR ?? '2026',
  baseUrl: (import.meta.env.VITE_BASE_URL ?? import.meta.env.BASE_URL ?? '').replace(/\/$/, ''),
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '',
} as const

export const APP_FULL_NAME = `${APP_CONFIG.name} ${APP_CONFIG.year}`
