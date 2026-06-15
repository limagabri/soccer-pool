import { StoryConteudo } from './StoryConteudo'

interface Props {
  titulo: string
  conteudo: string
  dados: Record<string, unknown>
}

export function StoryZebraDia({ titulo, conteudo, dados }: Props) {
  const vencedor = (dados?.vencedor as string) ?? ''
  const detalhes = (dados?.detalhes as string) ?? ''

  return (
    <div className="relative flex h-[540px] w-[400px] flex-col items-center justify-center overflow-hidden rounded-2xl p-6 text-center"
         style={{
           background: 'repeating-linear-gradient(45deg, #000 0px, #000 20px, #fff 20px, #fff 40px)',
         }}
    >
      {/* Overlay for readability */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-black/65" />

      <div className="relative z-10 flex flex-col items-center gap-3">
        <span className="text-6xl">🦓</span>
        <h2 className="font-display text-3xl tracking-widest text-white uppercase">{titulo}</h2>
        {vencedor && (
          <p className="font-display text-4xl font-bold text-brasil-yellow">{vencedor}</p>
        )}
        {detalhes && (
          <p className="text-sm text-zinc-300">{detalhes}</p>
        )}
        <div className="mt-3 w-full rounded-xl border border-white/20 bg-black/50 p-4">
          <StoryConteudo conteudo={conteudo} className="text-zinc-200" />
        </div>
        <p className="mt-3 text-xs tracking-widest text-zinc-500 uppercase">BolãoCopa 2026</p>
      </div>
    </div>
  )
}
