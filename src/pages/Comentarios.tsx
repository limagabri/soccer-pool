import { useEffect, useState } from 'react'
import { Navbar } from '../components/Navbar'
import { ComentaristaCard } from '../components/ComentaristaCard'
import { supabase } from '../lib/supabase'
import { Loader2 } from 'lucide-react'

interface ComentarioIA {
  id: string
  tipo: string
  numero_rodada: number | null
  conteudo: string
  publicado_em: string | null
}

const TIPO_LABEL: Record<string, string> = {
  'rodada_grupos': 'Fase de Grupos',
  'rodada_32avos': '32-avos de Final',
  'rodada_oitavas': 'Oitavas de Final',
  'rodada_quartas': 'Quartas de Final',
  'rodada_semis': 'Semifinais',
  'rodada_final': 'Final',
}

export function Comentarios() {
  const [comentarios, setComentarios] = useState<ComentarioIA[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('comentarios_ia')
      .select('id, tipo, numero_rodada, conteudo, publicado_em')
      .eq('publicado', true)
      .order('publicado_em', { ascending: false })
      .then(({ data }) => {
        setComentarios((data as ComentarioIA[]) ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-5xl tracking-wide">
          Comentários do <span className="text-brasil-green">Seu Zé</span>
        </h1>
        <p className="mt-3 text-zinc-400">
          O nosso comentarista oficial dá seu veredito sobre cada rodada do bolão.
        </p>

        <div className="mt-10 space-y-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-7 w-7 animate-spin text-zinc-600" />
            </div>
          ) : comentarios.length === 0 ? (
            <div className="glass p-10 text-center text-zinc-500">
              Nenhum comentário publicado ainda. Volte depois da próxima rodada! ⚽
            </div>
          ) : (
            comentarios.map(c => (
              <div key={c.id}>
                <p className="mb-2 text-xs tracking-widest text-zinc-600 uppercase">
                  {TIPO_LABEL[c.tipo] ?? c.tipo}
                  {c.numero_rodada ? ` — Rodada ${c.numero_rodada}` : ''}
                </p>
                <ComentaristaCard
                  conteudo={c.conteudo}
                  publicado_em={c.publicado_em}
                />
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
