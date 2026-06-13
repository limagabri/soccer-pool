import { StoryConteudo } from './StoryConteudo'

interface Props {
  titulo: string
  conteudo: string
  dados: Record<string, unknown>
}

export function StoryCovarde({ titulo, conteudo, dados }: Props) {
  const covarde = dados?.covarde as { nome: string; count: number } | undefined

  return (
    <div className="relative flex h-[400px] w-[400px] flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-700 via-yellow-600 to-amber-800 p-6 text-center">
      <div className="pointer-events-none absolute inset-0 opacity-20"
           style={{ backgroundImage: 'radial-gradient(circle at 50% 30%, #fbbf24 0%, transparent 60%)' }} />

      <div className="relative z-10 flex flex-col items-center gap-3">
        <span className="text-8xl drop-shadow-lg">🐔</span>
        <h2 className="font-display text-3xl tracking-widest text-white uppercase drop-shadow">{titulo}</h2>

        {covarde && (
          <>
            <p className="font-display text-4xl font-bold text-yellow-900">{covarde.nome}</p>
            <p className="rounded-full bg-yellow-900/40 px-4 py-1 text-sm text-yellow-100">
              {covarde.count} placares covardes 😂
            </p>
          </>
        )}

        <div className="mt-3 w-full overflow-y-auto rounded-xl border border-yellow-900/40 bg-black/25 p-4 max-h-28">
          <StoryConteudo conteudo={conteudo} className="text-yellow-50" />
        </div>
        <p className="mt-2 text-xs tracking-widest text-yellow-900 uppercase">BolãoCopa 2026</p>
      </div>
    </div>
  )
}
