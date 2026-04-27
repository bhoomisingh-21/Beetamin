'use client'

import { pageSubtitle, pageTitle } from '@/components/profile/profile-dark-styles'

type Props = {
  title: string
  subtitle?: string
  className?: string
}

export function ProfilePageHeader({ title, subtitle, className = '' }: Props) {
  return (
    <header className={`mb-8 ${className}`}>
      <h1 className={pageTitle}>{title}</h1>
      {subtitle ? <p className={pageSubtitle}>{subtitle}</p> : null}
      <div className="mt-3 h-[3px] w-10 rounded-full bg-emerald-500" aria-hidden />
    </header>
  )
}

/** Inline accent line only (e.g. under banner titles) */
export function ProfileTitleAccent() {
  return <div className="mt-3 h-[3px] w-10 rounded-full bg-emerald-500" aria-hidden />
}
