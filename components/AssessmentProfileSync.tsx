'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useRef } from 'react'
import { markAssessmentAuthReturn, readAssessmentBundle } from '@/lib/assessment-local-storage'
import { syncLocalAssessmentToProfile } from '@/lib/sync-local-assessment-client'

/** When signed in, sync free quiz from localStorage → `clients` (once per page load). */
export function AssessmentProfileSync() {
  const { isLoaded, isSignedIn, user } = useUser()
  const startedRef = useRef(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id || startedRef.current) return
    if (readAssessmentBundle()) markAssessmentAuthReturn()
    startedRef.current = true
    void syncLocalAssessmentToProfile(user.id)
  }, [isLoaded, isSignedIn, user?.id])

  return null
}
