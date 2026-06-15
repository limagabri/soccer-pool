// Handlers de Web Push, importados pelo service worker do Workbox
// (vite.config.ts → workbox.importScripts). O SW gerado não trata push sozinho.

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { /* payload vazio */ }

  const title = data.title || 'BolãoCopa 2026'
  const options = {
    body: data.body || '',
    icon: data.icon || '/soccer-pool/pwa-icon-192.png',
    badge: data.badge || '/soccer-pool/pwa-icon-192.png',
    vibrate: [80, 40, 80],
    data: { url: data.url || '/soccer-pool/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/soccer-pool/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
