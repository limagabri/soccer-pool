import type { ReactNode } from 'react'

// Converts **bold**, *italic*, and \n from AI text into React elements.
// Cards use this instead of plain <p>{conteudo}</p>.
function renderMd(text: string): ReactNode[] {
  return text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g).map((seg, i) => {
    if (seg.startsWith('**') && seg.endsWith('**'))
      return <strong key={i}>{seg.slice(2, -2)}</strong>
    if (seg.startsWith('*') && seg.endsWith('*'))
      return <em key={i}>{seg.slice(1, -1)}</em>
    return seg
  })
}

function sizeClass(len: number): string {
  if (len < 200) return 'text-sm leading-relaxed'
  if (len < 380) return 'text-xs leading-relaxed'
  return 'text-[11px] leading-snug'
}

interface Props {
  conteudo: string
  className?: string
}

export function StoryConteudo({ conteudo, className = '' }: Props) {
  return (
    <p className={`whitespace-pre-line ${sizeClass(conteudo.length)} ${className}`}>
      {renderMd(conteudo)}
    </p>
  )
}
