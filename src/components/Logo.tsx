import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'

export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const icon = size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'
  const text = size === 'lg' ? 'text-3xl' : 'text-2xl'

  return (
    <Link to="/" className="flex items-center gap-2">
      <Trophy className={`${icon} text-brasil-yellow`} />
      <span className={`${text} font-display tracking-wide`}>
        Bolão<span className="text-brasil-green">Copa</span>
      </span>
    </Link>
  )
}
