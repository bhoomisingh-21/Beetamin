import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { RecoveryReportPDF } from '@/components/report/RecoveryReport'
import type { RecoveryReportV2Data } from '@/lib/recovery-report-v2-types'

export async function renderRecoveryReportV2PdfBuffer(reportData: RecoveryReportV2Data): Promise<Buffer> {
  return renderToBuffer(<RecoveryReportPDF reportData={reportData} /> as never)
}
