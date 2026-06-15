import { motion } from 'framer-motion'

interface Props {
  conteudo: string
  publicado_em: string | null
  compact?: boolean
}

function formatarData(s: string | null): string {
  if (!s) return ''
  return new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
}

export function ComentaristaCard({ conteudo, publicado_em, compact = false }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brasil-green to-brasil-yellow text-2xl shadow-lg">
          👴🏽
        </div>
        <div>
          <p className="text-sm font-bold text-zinc-100">Seu Zé</p>
          <p className="text-xs text-zinc-500">Comentarista Oficial</p>
        </div>
        {publicado_em && (
          <span className="ml-auto text-[10px] text-zinc-600">{formatarData(publicado_em)}</span>
        )}
      </div>

      {/* Body */}
      <div className={`px-4 ${compact ? 'py-3' : 'py-4'}`}>
        <p className={`whitespace-pre-wrap leading-relaxed text-zinc-300 ${compact ? 'line-clamp-4 text-sm' : 'text-sm'}`}>
          {conteudo}
        </p>
      </div>
    </motion.div>
  )
}
