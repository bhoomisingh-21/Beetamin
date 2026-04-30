import type { ReactNode } from 'react'
import { NutritionistPortalNavbar } from '@/components/nutritionist-portal/NutritionistPortalNavbar'

export default function NutritionistPortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#060910]">
      <NutritionistPortalNavbar />
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  )
}
