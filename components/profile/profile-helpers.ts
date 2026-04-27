export function formatReportHeadingDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function severityBadgeLight(sev: string) {
  if (sev === 'high') return 'bg-red-50 text-red-700 border border-red-200'
  if (sev === 'medium') return 'bg-amber-50 text-amber-800 border border-amber-200'
  return 'bg-emerald-50 text-emerald-800 border border-emerald-200'
}

export function severityBadgeAssessmentStyle(sev: string) {
  if (sev === 'high') return 'bg-red-500/15 text-red-600 border border-red-500/25'
  if (sev === 'medium') return 'bg-amber-500/15 text-amber-700 border border-amber-500/25'
  return 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/25'
}

export function reportStatusBadgeClass(status: string) {
  if (status === 'ready' || status === 'generated')
    return 'bg-emerald-50 text-emerald-800 border border-emerald-200'
  if (status === 'generating')
    return 'bg-amber-50 text-amber-800 border border-amber-200'
  if (status === 'failed') return 'bg-red-50 text-red-800 border border-red-200'
  return 'bg-stone-100 text-stone-600 border border-stone-200'
}

export function displayReportStatus(status: string): string {
  if (status === 'generated' || status === 'ready') return 'ready'
  if (status === 'generating') return 'generating'
  if (status === 'failed') return 'failed'
  return status
}

export function isReportReady(status: string): boolean {
  return status === 'ready' || status === 'generated'
}

export function bmiMeta(bmi: number) {
  if (bmi < 18.5) return { label: 'Underweight', cls: 'text-blue-700', card: 'border-blue-200 bg-blue-50/90' }
  if (bmi < 25) return { label: 'Healthy', cls: 'text-emerald-700', card: 'border-emerald-200 bg-emerald-50/90' }
  if (bmi < 30) return { label: 'Overweight', cls: 'text-orange-700', card: 'border-orange-200 bg-orange-50/90' }
  return { label: 'Obese', cls: 'text-red-700', card: 'border-red-200 bg-red-50/90' }
}
