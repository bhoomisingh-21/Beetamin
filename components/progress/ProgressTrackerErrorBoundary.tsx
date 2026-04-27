'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }

type State = { hasError: boolean }

export class ProgressTrackerErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ProgressTracker]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-white/[0.06] bg-[#0F1623] p-8 text-center shadow-[0_0_0_1px_rgba(16,185,129,0.05),0_4px_24px_rgba(0,0,0,0.4)]">
          <p className="text-sm text-[#8B9AB0]">
            Could not load progress tracker. Please refresh.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
