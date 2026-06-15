import { useTranslation } from 'react-i18next'

export function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="border-t border-white/5 px-4 py-6 text-center text-xs text-zinc-500">
      <p>
        {t('footer.madeBy')}{' '}
        <a
          href="https://github.com/limagabri"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-brasil-green transition hover:underline"
        >
          Gabriel Lima
        </a>
      </p>
    </footer>
  )
}
