import type { ReactNode } from 'react'
import { NutritionistPortalSidebar } from '@/components/nutritionist-portal/NutritionistPortalSidebar'
import { portal } from '@/components/nutritionist-portal/portal-theme'

export default function NutritionistPortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`flex min-h-screen ${portal.pageBg}`}>
      <NutritionistPortalSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-x-hidden px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-6 md:py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
