// Handlers de Web Push, importados pelo service worker do Workbox
// (vite.config.ts → workbox.importScripts). O SW gerado não trata push sozinho.
// Ícone e URL são resolvidos a partir do `scope` do SW, então não dependem do
// nome do repositório / base do deploy.

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { /* payload vazio */ }

  const scope = self.registration.scope
  const icon = new URL('pwa-icon-192.png', scope).href

  event.waitUntil(
    self.registration.showNotification(data.title || 'BolãoCopa 2026', {
      body: data.body || '',
      icon,
      badge: icon,
      vibrate: [80, 40, 80],
      data: { url: data.url ? new URL(data.url, scope).href : scope },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || self.registration.scope
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
