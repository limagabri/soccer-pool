import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'

// PWA: quando um novo service worker assume o controle (deploy novo), recarrega
// automaticamente para o usuário sair de versões antigas em cache. Ignora a
// primeira instalação (quando ainda não havia controller) para não recarregar
// à toa na primeira visita.
if ('serviceWorker' in navigator) {
  let hadController = !!navigator.serviceWorker.controller
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) { hadController = true; return }
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
