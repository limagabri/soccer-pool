import { Share2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { APP_CONFIG, APP_FULL_NAME } from '../config/app'
import type { Jogo } from '../types'

interface Props {
  jogo: Jogo
  palpite: { gols_casa: number; gols_fora: number }
}

function gerarCanvas(jogo: Jogo, palpite: { gols_casa: number; gols_fora: number }, username: string): HTMLCanvasElement {
  const SIZE = 1080
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')!

  // Fundo
  ctx.fillStyle = '#09090b'
  ctx.fillRect(0, 0, SIZE, SIZE)

  // Brilho verde (topo-esquerdo)
  const g1 = ctx.createRadialGradient(0, 0, 80, 0, 0, 700)
  g1.addColorStop(0, 'rgba(0,200,83,0.30)')
  g1.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g1
  ctx.fillRect(0, 0, SIZE, SIZE)

  // Brilho amarelo (baixo-direito)
  const g2 = ctx.createRadialGradient(SIZE, SIZE, 80, SIZE, SIZE, 700)
  g2.addColorStop(0, 'rgba(255,215,0,0.22)')
  g2.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g2
  ctx.fillRect(0, 0, SIZE, SIZE)

  // Borda
  ctx.strokeStyle = 'rgba(0,200,83,0.25)'
  ctx.lineWidth = 3
  ctx.strokeRect(28, 28, SIZE - 56, SIZE - 56)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Título
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 66px Arial, sans-serif'
  ctx.fillText(APP_FULL_NAME, SIZE / 2, 130)

  // Separador
  const sep = ctx.createLinearGradient(120, 0, SIZE - 120, 0)
  sep.addColorStop(0, 'transparent')
  sep.addColorStop(0.3, '#00c853')
  sep.addColorStop(0.7, '#ffd700')
  sep.addColorStop(1, 'transparent')
  ctx.strokeStyle = sep
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(120, 190)
  ctx.lineTo(SIZE - 120, 190)
  ctx.stroke()

  // Meu palpite:
  ctx.fillStyle = '#a1a1aa'
  ctx.font = '36px Arial, sans-serif'
  ctx.fillText('Meu palpite:', SIZE / 2, 250)

  // Time Casa
  ctx.fillStyle = '#e4e4e7'
  ctx.font = 'bold 50px Arial, sans-serif'
  ctx.fillText(`${jogo.emoji_casa}  ${jogo.time_casa}`, SIZE / 2, 360)

  // vs
  ctx.fillStyle = '#52525b'
  ctx.font = '38px Arial, sans-serif'
  ctx.fillText('vs', SIZE / 2, 440)

  // Time Fora
  ctx.fillStyle = '#e4e4e7'
  ctx.font = 'bold 50px Arial, sans-serif'
  ctx.fillText(`${jogo.time_fora}  ${jogo.emoji_fora}`, SIZE / 2, 530)

  // Placar grande
  ctx.fillStyle = '#ffd700'
  ctx.font = `bold 210px Impact, "Arial Black", sans-serif`
  ctx.fillText(`${palpite.gols_casa}  ×  ${palpite.gols_fora}`, SIZE / 2, 720)

  // Separador inferior
  ctx.strokeStyle = sep
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(120, 840)
  ctx.lineTo(SIZE - 120, 840)
  ctx.stroke()

  // Username
  ctx.fillStyle = '#a1a1aa'
  ctx.font = '38px Arial, sans-serif'
  ctx.fillText(`@${username}`, SIZE / 2, 900)

  // URL
  ctx.fillStyle = '#3f3f46'
  ctx.font = '28px Arial, sans-serif'
  ctx.fillText(APP_CONFIG.baseUrl.replace('https://', '') || 'bolao-copa', SIZE / 2, 1010)

  return canvas
}

export function CompartilharCard({ jogo, palpite }: Props) {
  const { profile, user } = useAuth()
  const username = profile?.username ?? user?.email?.split('@')[0] ?? 'participante'

  async function baixarCard() {
    await document.fonts.ready
    const canvas = gerarCanvas(jogo, palpite, username)
    const link = document.createElement('a')
    link.download = `palpite-${jogo.time_casa}-${jogo.time_fora}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  function compartilharWhatsApp() {
    const texto = [
      `⚽ Meu palpite para *${jogo.time_casa} × ${jogo.time_fora}*:`,
      `🎯 *${palpite.gols_casa} × ${palpite.gols_fora}*`,
      '',
      `Participe do ${APP_FULL_NAME}!`,
      APP_CONFIG.baseUrl || window.location.origin,
    ].join('\n')
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={baixarCard}
        title="Baixar card do palpite"
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
      >
        📸 Card
      </button>
      <button
        onClick={compartilharWhatsApp}
        title="Compartilhar no WhatsApp"
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
      >
        <Share2 className="h-3.5 w-3.5" />
        WhatsApp
      </button>
    </div>
  )
}
