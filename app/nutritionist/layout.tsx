import type { ReactNode } from 'react'
import { NutritionistPortalNavbar } from '@/components/nutritionist-portal/NutritionistPortalNavbar'

export default function NutritionistPortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#060910]">
      <NutritionistPortalNavbar />
      <div className="mx-auto flex max-w-6xl flex-col px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
        {children}
      </div>
    </div>
  )
}
