'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Leaf } from 'lucide-react'

const MESSAGES = [
  'Analysing your deficiency patterns...',
  'Building your personalised 7-day meal plan...',
  'Selecting the right supplements for your profile...',
  'Identifying foods affecting your recovery...',
  'Dr. Priya is reviewing your report...',
  'Finalising your personalised recovery plan...',
  'Almost ready — preparing your PDF...',
]

export function ReportGeneratingLoader() {
  const [i, setI] = useState(0)

  useEffect(() => {
    const t = window.setInterval(() => {
      setI((n) => (n + 1) % MESSAGES.length)
    }, 3000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [])

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-50 px-6">
      <div className="mb-10 flex flex-col items-center">
        <Leaf className="h-10 w-10 text-emerald-600" />
        <p className="mt-3 text-sm font-bold tracking-wide text-gray-900">The Beetamin</p>
      </div>

      <div className="relative h-2 w-full max-w-xs overflow-hidden rounded-full bg-emerald-100">
        <motion.div
          className="absolute left-0 top-0 h-full w-2/5 rounded-full bg-emerald-600"
          initial={{ x: '-100%' }}
          animate={{ x: ['0%', '220%'] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <p
        key={i}
        className="mt-10 max-w-md text-center text-base font-medium text-gray-800 animate-in fade-in duration-300"
      >
        {MESSAGES[i]}
      </p>
      <p className="mt-6 max-w-sm text-center text-xs text-gray-500 leading-relaxed">
        This usually takes 20 to 40 seconds. Please don&apos;t close this page.
      </p>
    </div>
  )
}
