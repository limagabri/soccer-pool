// Complemento do service worker gerado pelo vite-plugin-pwa
// Suporte a Push Notifications

self.addEventListener('push', (event) => {
  let data = { title: 'BolãoCopa 2026', body: 'Você tem uma nova notificação!', icon: '/bolao-copa/pwa-icon.svg' }
  try {
    data = { ...data, ...event.data.json() }
  } catch (_) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.icon,
      data: { url: '/bolao-copa/palpites' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/bolao-copa/'
  event.waitUntil(clients.openWindow(url))
})
