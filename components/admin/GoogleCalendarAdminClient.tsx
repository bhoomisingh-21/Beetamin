'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, ExternalLink, Loader2, Video, XCircle } from 'lucide-react'

type StatusResponse = {
  connected: boolean
  email: string | null
  updatedAt: string | null
  configured: boolean
}

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: 'You need admin access to connect Google Calendar.',
  not_configured: 'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set in your environment yet.',
  invalid_state: 'The connection request expired or was tampered with. Please try again.',
  access_denied: 'Google sign-in was cancelled before permissions were granted.',
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function GoogleCalendarAdminClient() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const loadStatus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/google-calendar')
      const json = (await res.json()) as StatusResponse & { error?: string }
      if (!res.ok) throw new Error(json.error || 'Could not load Google Calendar status.')
      setStatus(json)
    } catch (e) {
      setBanner({ kind: 'error', text: e instanceof Error ? e.message : 'Could not load status.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStatus()
  }, [loadStatus])

  useEffect(() => {
    const connected = searchParams.get('connected')
    const email = searchParams.get('email')
    const error = searchParams.get('error')
    if (connected) {
      setBanner({ kind: 'success', text: `Connected as ${email || 'your Google account'}. Meet links will now be created automatically.` })
    } else if (error) {
      setBanner({ kind: 'error', text: ERROR_MESSAGES[error] || `Connection failed: ${error}` })
    }
  }, [searchParams])

  async function handleDisconnect() {
    if (!window.confirm('Disconnect Google Calendar? New sessions will no longer get automatic Meet links until reconnected.')) {
      return
    }
    setDisconnecting(true)
    try {
      const res = await fetch('/api/admin/google-calendar', { method: 'DELETE' })
      if (!res.ok) throw new Error('Could not disconnect.')
      setBanner({ kind: 'success', text: 'Google Calendar disconnected.' })
      await loadStatus()
    } catch (e) {
      setBanner({ kind: 'error', text: e instanceof Error ? e.message : 'Could not disconnect.' })
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30">
          <Video className="text-emerald-400" size={24} />
        </div>
        <div>
          <h1 className="text-white font-black text-2xl md:text-3xl">Google Calendar</h1>
          <p className="text-gray-500 text-sm mt-1">
            One shared TheBeetamin Google account creates real Google Meet links for every confirmed session.
          </p>
        </div>
      </div>

      {banner ? (
        <p
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            banner.kind === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-red-500/30 bg-red-500/10 text-red-200'
          }`}
        >
          {banner.text}
        </p>
      ) : null}

      <div className="rounded-3xl border border-white/10 bg-[#111820] p-6 md:p-8">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-emerald-400" size={28} />
          </div>
        ) : status?.connected ? (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-emerald-400 shrink-0" size={22} />
              <div>
                <p className="text-white font-bold">Connected</p>
                <p className="text-gray-400 text-sm">
                  {status.email || 'Google account'} · last updated {formatDate(status.updatedAt)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="/api/admin/google-calendar/connect"
                className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/5 transition"
              >
                Reconnect / switch account
              </a>
              <button
                type="button"
                disabled={disconnecting}
                onClick={() => void handleDisconnect()}
                className="rounded-xl border border-red-500/40 px-4 py-2.5 text-sm font-bold text-red-300 hover:bg-red-500/10 transition disabled:opacity-50"
              >
                {disconnecting ? 'Disconnecting…' : 'Disconnect'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <XCircle className="text-amber-400 shrink-0" size={22} />
              <div>
                <p className="text-white font-bold">Not connected</p>
                <p className="text-gray-400 text-sm">
                  Confirmed sessions won&apos;t get an automatic Meet link until this is connected.
                </p>
              </div>
            </div>
            {!status?.configured ? (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                Missing environment variables. Set <code className="font-mono">GOOGLE_CLIENT_ID</code> and{' '}
                <code className="font-mono">GOOGLE_CLIENT_SECRET</code> first (see setup guide below), then redeploy.
              </p>
            ) : (
              <a
                href="/api/admin/google-calendar/connect"
                className="inline-flex w-fit items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-6 py-3.5 text-sm font-black text-black transition"
              >
                <Video size={18} />
                Connect Google Calendar
              </a>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 rounded-3xl border border-white/10 bg-[#111820] p-6 md:p-8">
        <h2 className="text-white font-bold text-lg mb-4">One-time setup</h2>
        <ol className="space-y-3 text-sm text-gray-400 list-decimal list-inside">
          <li>
            Go to{' '}
            <a
              href="https://console.cloud.google.com/"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              Google Cloud Console <ExternalLink size={12} />
            </a>{' '}
            and create a project (or reuse one).
          </li>
          <li>
            Enable the <strong className="text-gray-300">Google Calendar API</strong> for that project (APIs &amp;
            Services → Library).
          </li>
          <li>
            Configure the <strong className="text-gray-300">OAuth consent screen</strong> (External, Testing mode is
            fine) and add the connecting Google account&apos;s email as a test user.
          </li>
          <li>
            Create an <strong className="text-gray-300">OAuth Client ID</strong> (Web application) under Credentials.
            Add this Authorized redirect URI exactly:
            <code className="block mt-1 rounded-lg bg-black/40 px-3 py-2 text-emerald-300 break-all">
              {typeof window !== 'undefined' ? window.location.origin : ''}/api/admin/google-calendar/callback
            </code>
          </li>
          <li>
            Copy the Client ID and Client Secret into your environment as{' '}
            <code className="font-mono text-gray-300">GOOGLE_CLIENT_ID</code> and{' '}
            <code className="font-mono text-gray-300">GOOGLE_CLIENT_SECRET</code>, then redeploy.
          </li>
          <li>Come back here and click &quot;Connect Google Calendar&quot;, signing in with the Google account you want to own all session events.</li>
        </ol>
      </div>
    </div>
  )
}
