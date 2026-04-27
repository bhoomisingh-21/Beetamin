'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }

type State = { hasError: boolean }

export class ProgressSectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ProgressSection]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-3xl border border-white/[0.08] bg-[#111820] p-8 text-center shadow-sm">
          <p className="text-sm text-gray-400">
            Could not load progress tracker. Please refresh.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
