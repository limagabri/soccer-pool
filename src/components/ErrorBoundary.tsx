import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  label?: string
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? ` — ${this.props.label}` : ''}]`, error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-center">
          <p className="text-4xl">⚽</p>
          <h1 className="font-display text-2xl text-red-400">Algo deu errado</h1>
          <pre className="max-w-xl overflow-auto rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-left text-xs text-zinc-400">
            {this.state.error.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-brasil-green px-5 py-2 text-sm font-semibold text-zinc-900 transition hover:opacity-80"
          >
            Recarregar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
