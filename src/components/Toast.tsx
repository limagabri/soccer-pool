import { motion } from 'framer-motion'
import { CheckCircle, XCircle } from 'lucide-react'

export interface ToastInfo {
  mensagem: string
  tipo: 'sucesso' | 'erro'
}

/* Renderizar dentro de <AnimatePresence> para animar a saída */
export function Toast({ toast }: { toast: ToastInfo }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className="glass fixed inset-x-0 bottom-6 z-50 mx-auto flex w-fit max-w-[90vw] items-center gap-2 px-4 py-3 text-sm font-medium"
    >
      {toast.tipo === 'sucesso' ? (
        <CheckCircle className="h-5 w-5 shrink-0 text-brasil-green" />
      ) : (
        <XCircle className="h-5 w-5 shrink-0 text-red-400" />
      )}
      {toast.mensagem}
    </motion.div>
  )
}
