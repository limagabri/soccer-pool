import { useTranslation } from 'react-i18next'
import { useNotificacoes } from '../hooks/useNotificacoes'

export function ConfigNotificacoes() {
  const { t } = useTranslation()
  const { status, ativar, desativar } = useNotificacoes()

  const label: Record<typeof status, string> = {
    loading: t('profile.notifications.loading'),
    unsupported: t('profile.notifications.unsupported'),
    denied: t('profile.notifications.denied'),
    off: t('profile.notifications.off'),
    on: t('profile.notifications.on'),
  }

  return (
    <div className="glass p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-zinc-100">🔔 {t('profile.notifications.title')}</h3>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-zinc-500">
            {t('profile.notifications.subtitle')}
          </p>
          <p className={`mt-2 text-xs font-medium ${
            status === 'on' ? 'text-brasil-green' :
            status === 'denied' ? 'text-red-400' :
            'text-gray-400 dark:text-zinc-500'
          }`}>
            {label[status]}
          </p>
        </div>

        {(status === 'on' || status === 'off') && (
          <button
            onClick={status === 'on' ? desativar : ativar}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
              status === 'on' ? 'bg-brasil-green' : 'bg-gray-300 dark:bg-zinc-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                status === 'on' ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        )}
      </div>
    </div>
  )
}
