import { StoryConteudo } from './StoryConteudo'

interface Props {
  titulo: string
  conteudo: string
  dados: Record<string, unknown>
}

export function StorySubiuAfundou({ titulo, conteudo, dados }: Props) {
  const subiu   = dados?.subiu   as { nome: string; posicoes: number } | undefined
  const afundou = dados?.afundou as { nome: string; posicoes: number } | undefined

  return (
    <div className="relative flex h-[400px] w-[400px] flex-col overflow-hidden rounded-2xl">
      {/* Split background */}
      <div className="flex h-[45%]">
        <div className="w-1/2 bg-gradient-to-br from-green-800 to-green-950" />
        <div className="w-1/2 bg-gradient-to-bl from-red-800 to-red-950" />
      </div>
      <div className="flex h-[55%]">
        <div className="w-1/2 bg-gradient-to-tr from-green-800 to-green-950" />
        <div className="w-1/2 bg-gradient-to-tl from-red-800 to-red-950" />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center">
        <p className="font-display text-2xl tracking-wider text-white uppercase">{titulo}</p>

        <div className="mt-4 flex w-full gap-4">
          {/* Subiu */}
          <div className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-green-600/40 bg-green-900/40 p-3">
            <span className="text-3xl">📈</span>
            <p className="text-xs text-green-300 uppercase tracking-wider">Subiu</p>
            <p className="font-bold text-white">{subiu?.nome ?? '—'}</p>
            {subiu?.posicoes ? <p className="text-xl font-display text-brasil-green">+{subiu.posicoes} pos</p> : null}
          </div>

          {/* Afundou */}
          <div className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-red-700/40 bg-red-900/40 p-3">
            <span className="text-3xl">📉</span>
            <p className="text-xs text-red-300 uppercase tracking-wider">Afundou</p>
            <p className="font-bold text-white">{afundou?.nome ?? '—'}</p>
            {afundou?.posicoes ? <p className="text-xl font-display text-red-400">-{afundou.posicoes} pos</p> : null}
          </div>
        </div>

        <div className="mt-4 w-full overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-4 max-h-24">
          <StoryConteudo conteudo={conteudo} className="text-zinc-300" />
        </div>
        <p className="mt-3 text-xs tracking-widest text-zinc-600 uppercase">BolãoCopa 2026</p>
      </div>
    </div>
  )
}
