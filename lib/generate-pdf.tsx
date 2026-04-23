import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { RecoveryPlanDocument } from '@/lib/pdf/RecoveryPlanDocument'
import type { RecoveryReportSections } from '@/lib/recovery-report-types'

export async function generateRecoveryPlanPdfBuffer(input: {
  patientName: string
  reportId: string
  preparedOn: string
  sections: RecoveryReportSections
}): Promise<Buffer> {
  const doc = (
    <RecoveryPlanDocument
      patientName={input.patientName}
      reportId={input.reportId}
      preparedOn={input.preparedOn}
      sections={input.sections}
    />
  )
  const buf = await renderToBuffer(doc)
  return Buffer.from(buf)
}
