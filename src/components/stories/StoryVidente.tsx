interface Props {
  titulo: string
  conteudo: string
  dados: Record<string, unknown>
}

export function StoryVidente({ titulo, conteudo, dados }: Props) {
  const melhor = dados?.melhor as { nome: string; acertos: number } | undefined
  const pior   = dados?.pior   as { nome: string; erros: number }   | undefined

  return (
    <div className="relative flex h-[400px] w-[400px] flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-purple-950 via-indigo-900 to-zinc-900 p-6 text-center">
      {/* Stars */}
      {['10%,15%', '85%,20%', '25%,75%', '70%,80%', '50%,40%', '15%,55%'].map((pos, i) => (
        <div key={i}
          className="pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-white/70 animate-pulse"
          style={{ left: pos.split(',')[0], top: pos.split(',')[1], animationDelay: `${i * 0.4}s` }} />
      ))}

      <div className="relative z-10 flex flex-col items-center gap-3">
        <span className="text-6xl">🔮</span>
        <h2 className="font-display text-2xl tracking-wider text-purple-200 uppercase">{titulo}</h2>

        <div className="mt-2 flex w-full gap-3">
          {melhor && (
            <div className="flex-1 rounded-xl border border-purple-700/40 bg-purple-900/30 p-3">
              <p className="text-xs text-purple-300 uppercase tracking-wider">Vidente</p>
              <p className="mt-1 font-bold text-white">{melhor.nome}</p>
              <p className="text-2xl font-display text-brasil-green">{melhor.acertos}✓</p>
            </div>
          )}
          {pior && (
            <div className="flex-1 rounded-xl border border-red-800/40 bg-red-900/20 p-3">
              <p className="text-xs text-red-300 uppercase tracking-wider">Chutômetro</p>
              <p className="mt-1 font-bold text-white">{pior.nome}</p>
              <p className="text-2xl font-display text-red-400">{pior.erros}✗</p>
            </div>
          )}
        </div>

        <div className="mt-2 w-full rounded-xl border border-purple-700/30 bg-black/30 p-4">
          <p className="text-sm leading-relaxed text-zinc-300">{conteudo}</p>
        </div>
        <p className="mt-2 text-xs tracking-widest text-purple-700 uppercase">BolãoCopa 2026</p>
      </div>
    </div>
  )
}
