import { StoryConteudo } from './StoryConteudo'

interface Props {
  titulo: string
  conteudo: string
  dados: Record<string, unknown>
}

export function StoryHallVergonha({ titulo, conteudo, dados }: Props) {
  const homenageado = (dados?.homenageado as string) ?? ''
  const detalhes    = (dados?.detalhes as string) ?? ''

  return (
    <div className="relative flex h-[400px] w-[400px] flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-red-950 via-red-900 to-zinc-900 p-6 text-center">
      {/* Decorative noise */}
      <div className="pointer-events-none absolute inset-0 opacity-10"
           style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, #ef4444 0%, transparent 50%), radial-gradient(circle at 70% 80%, #991b1b 0%, transparent 50%)' }} />

      <div className="relative z-10 flex flex-col items-center gap-3">
        <span className="text-6xl">🏆</span>
        <h2 className="font-display text-3xl tracking-widest text-red-300 uppercase">
          {titulo}
        </h2>
        {homenageado && (
          <p className="mt-1 font-display text-4xl font-bold text-white">{homenageado}</p>
        )}
        {detalhes && (
          <p className="text-sm text-red-200 opacity-80">{detalhes}</p>
        )}
        <div className="mt-3 w-full overflow-y-auto rounded-xl border border-red-700/40 bg-black/30 p-4 max-h-28">
          <StoryConteudo conteudo={conteudo} className="text-zinc-300" />
        </div>
        <p className="mt-3 text-xs tracking-widest text-red-600 uppercase">BolãoCopa 2026</p>
      </div>
    </div>
  )
}
