import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGS } from '../i18n'

// Cicla entre os idiomas suportados (pt-BR → en → es). Mostra a bandeira atual.
export function LangToggle({ className = '' }: { className?: string }) {
  const { i18n } = useTranslation()
  const current =
    SUPPORTED_LANGS.find((l) => l.code === i18n.language || l.code === i18n.language.split('-')[0]) ??
    SUPPORTED_LANGS[0]
  const next =
    SUPPORTED_LANGS[(SUPPORTED_LANGS.findIndex((l) => l.code === current.code) + 1) % SUPPORTED_LANGS.length]
  return (
    <button
      onClick={() => i18n.changeLanguage(next.code)}
      title={next.label}
      aria-label={next.label}
      className={`rounded-lg px-2 py-1.5 text-xs font-medium transition ${className}`}
    >
      {current.flag}
    </button>
  )
}
