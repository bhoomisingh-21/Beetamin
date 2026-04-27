'use client'

import Image from 'next/image'
import { textPrimary, textSecondary } from '@/components/profile/profile-dark-styles'

type Props = {
  src: string
  alt: string
  title: string
  subtitle?: string
}

export function ProfilePageBanner({ src, alt, title, subtitle }: Props) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl md:rounded-2xl">
      <div className="relative h-[140px] w-full md:h-[180px]">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(rgba(6,9,16,0.82),rgba(6,9,16,0.88))]"
          aria-hidden
        />
        <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-8">
          <h1 className={`text-2xl font-black tracking-tight ${textPrimary}`}>{title}</h1>
          {subtitle ? <p className={`mt-1 max-w-xl text-sm ${textSecondary}`}>{subtitle}</p> : null}
          <div className="mt-3 h-[3px] w-10 rounded-full bg-emerald-500" aria-hidden />
        </div>
      </div>
    </div>
  )
}
