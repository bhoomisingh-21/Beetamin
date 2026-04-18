'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Leaf, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function NutritionistUpdatePassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  // Supabase sends the recovery token as a URL hash fragment.
  // The client SDK picks it up automatically via onAuthStateChange.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!password) { setError('Please enter a new password.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }

    setLoading(true)
    setError('')
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/sign-in'), 3000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-2 mb-8">
          <Leaf className="text-emerald-500" size={22} />
          <span className="font-bold text-gray-900 text-xl">TheBeetamin</span>
        </div>

        {done ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-emerald-500" size={28} />
            </div>
            <h2 className="text-gray-900 font-black text-xl">Password Updated!</h2>
            <p className="text-gray-500 text-sm mt-2">Redirecting you to sign in…</p>
          </div>
        ) : !sessionReady ? (
          <div className="text-center py-4">
            <Loader2 className="animate-spin text-emerald-500 mx-auto mb-4" size={28} />
            <h2 className="text-gray-900 font-bold text-lg">Verifying reset link…</h2>
            <p className="text-gray-400 text-sm mt-2">
              If nothing happens, the link may have expired.{' '}
              <a href="/sign-in" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Go back to sign in
              </a>
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-gray-900 font-black text-2xl">Set New Password</h2>
              <p className="text-gray-500 text-sm mt-1">Choose a strong password for your nutritionist account.</p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              {/* New password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                <div className={`flex items-center w-full border rounded-xl px-4 h-11 transition ${
                  error ? 'border-red-400' : 'border-gray-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100'
                }`}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                    placeholder="Min. 6 characters"
                    autoFocus
                    className="flex-1 bg-transparent text-gray-900 text-sm outline-none"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="text-gray-400 hover:text-gray-600 shrink-0">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <div className={`flex items-center w-full border rounded-xl px-4 h-11 transition ${
                  error ? 'border-red-400' : 'border-gray-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100'
                }`}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
                    placeholder="Repeat password"
                    className="flex-1 bg-transparent text-gray-900 text-sm outline-none"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-gray-400 hover:text-gray-600 shrink-0">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2.5">
                  <AlertCircle size={13} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-black font-bold rounded-xl h-11 text-sm transition flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="animate-spin" size={16} /> Updating…</> : 'Update Password →'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
