import { StoryConteudo } from './StoryConteudo'

interface Props {
  titulo: string
  conteudo: string
  dados: Record<string, unknown>
}

export function StoryTelepata({ titulo, conteudo, dados }: Props) {
  const telepata = dados?.telepata as { nome: string; acertos: number } | undefined

  return (
    <div className="relative flex h-[540px] w-[400px] flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500 via-amber-400 to-yellow-600 p-6 text-center">
      {/* Sparkle dots */}
      {['12%,18%', '88%,12%', '5%,70%', '92%,75%', '50%,10%'].map((pos, i) => (
        <div key={i}
          className="pointer-events-none absolute text-white/60 text-xs animate-ping"
          style={{ left: pos.split(',')[0], top: pos.split(',')[1], animationDelay: `${i * 0.3}s`, animationDuration: '2s' }}
        >✦</div>
      ))}

      <div className="relative z-10 flex flex-col items-center gap-3">
        <span className="text-7xl drop-shadow-lg">🧠</span>
        <h2 className="font-display text-3xl tracking-widest text-yellow-900 uppercase">{titulo}</h2>

        {telepata && (
          <>
            <p className="font-display text-4xl font-black text-yellow-950">{telepata.nome}</p>
            <div className="flex items-center gap-2 rounded-full bg-yellow-900/20 px-5 py-2">
              <span className="text-2xl">🎯</span>
              <span className="font-display text-2xl font-bold text-yellow-900">
                {telepata.acertos} plac. exatos
              </span>
            </div>
          </>
        )}

        <div className="mt-3 w-full rounded-xl border border-yellow-700/30 bg-black/20 p-4">
          <StoryConteudo conteudo={conteudo} className="text-yellow-900" />
        </div>
        <p className="mt-2 text-xs tracking-widest text-yellow-800 uppercase">BolãoCopa 2026</p>
      </div>
    </div>
  )
}
