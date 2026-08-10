import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { MealPlanDocument } from '@/components/pdf/MealPlanDocument'
import type { MealPlanPdfPayload } from '@/lib/meal-plan-pdf-types'

export async function renderMealPlanPdfBuffer(data: MealPlanPdfPayload): Promise<Buffer> {
  return renderToBuffer(<MealPlanDocument data={data} /> as never)
}
