import { StoryHallVergonha } from '../components/stories/StoryHallVergonha'
import { StoryZebraDia } from '../components/stories/StoryZebraDia'
import { StoryVidente } from '../components/stories/StoryVidente'
import { StorySubiuAfundou } from '../components/stories/StorySubiuAfundou'
import { StoryCovarde } from '../components/stories/StoryCovarde'
import { StoryTelepata } from '../components/stories/StoryTelepata'

const PREVIEWS = [
  {
    label: 'Hall da Vergonha',
    component: StoryHallVergonha,
    titulo: 'Hall da Vergonha',
    conteudo: 'Pedro palpitou 4x0 mas o resultado foi 0x3. Uma tragédia em campo, e outra no bolão.',
    dados: { homenageado: 'Pedro', detalhes: 'Palpite: 4×0 | Resultado: 0×3' },
  },
  {
    label: 'Zebra do Dia',
    component: StoryZebraDia,
    titulo: 'Zebra do Dia',
    conteudo: 'João foi o único que acreditou na zebra. Japão 2×1 Alemanha e o bolão foi à lona.',
    dados: { vencedor: 'João', detalhes: '🇯🇵 Japão 2×1 Alemanha 🇩🇪' },
  },
  {
    label: 'Vidente vs Chutômetro',
    component: StoryVidente,
    titulo: 'Vidente vs Chutômetro',
    conteudo: 'O grupo acertou apenas 3 de 8 jogos (37%). Tem que melhorar!',
    dados: {
      melhor: { nome: 'Grupo', acertos: 3 },
      pior:   { nome: 'Todos', erros: 5 },
    },
  },
  {
    label: 'Subiu & Afundou',
    component: StorySubiuAfundou,
    titulo: 'Subiu & Afundou',
    conteudo: 'Maria voou de 5º para 1º. Carlos despencou de 1º para 6º. O bolão não perdoa.',
    dados: {
      subiu:   { nome: 'Maria',  posicoes: 4 },
      afundou: { nome: 'Carlos', posicoes: 5 },
    },
  },
  {
    label: 'Palpite Covarde',
    component: StoryCovarde,
    titulo: 'Palpite Covarde',
    conteudo: 'Ana chutou 0×0 em 5 jogos seguidos. Coragem zero, placar zero.',
    dados: { covarde: { nome: 'Ana', count: 5 } },
  },
  {
    label: 'Telepata da Rodada',
    component: StoryTelepata,
    titulo: 'Telepata da Rodada',
    conteudo: 'Lucas acertou 4 placares exatos na rodada. Isso não é sorte, é clarividência.',
    dados: { telepata: { nome: 'Lucas', acertos: 4 } },
  },
]

export function StoriesPreview() {
  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-100">Preview dos Templates de Stories</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Página temporária — dados fictícios para validar o visual dos 6 templates.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {PREVIEWS.map(({ label, component: Story, titulo, conteudo, dados }) => (
            <div key={label} className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
              <div
                className="overflow-hidden rounded-2xl"
                style={{ width: 300, height: 300 }}
              >
                <div style={{ transform: 'scale(0.75)', transformOrigin: 'top left', width: 400, height: 400 }}>
                  <Story titulo={titulo} conteudo={conteudo} dados={dados} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
