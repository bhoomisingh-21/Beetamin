import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ReportReadyView } from './ReportReadyView'
import Link from 'next/link'

export default async function ReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { userId } = await auth()
  const { reportId } = await params
  const decodedId = decodeURIComponent(reportId)

  if (!userId) {
    redirect('/sign-in?after=' + encodeURIComponent(`/report/${decodedId}`))
  }

  const { data: row, error } = await supabaseAdmin
    .from('paid_reports')
    .select('pdf_url, email, report_id')
    .eq('report_id', decodedId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[report page]', error)
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-lg font-bold text-gray-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-gray-600">Please try again in a moment.</p>
        <Link href="mailto:hi@thebeetamin.com" className="mt-6 text-sm font-semibold text-emerald-700">
          hi@thebeetamin.com
        </Link>
      </div>
    )
  }

  if (!row?.pdf_url) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-lg font-bold text-gray-900">We couldn&apos;t find that report</h1>
        <p className="mt-2 text-sm text-gray-600">
          It may have expired or the link is incorrect. If you paid and expected a file here, email{' '}
          <a href="mailto:hi@thebeetamin.com" className="font-medium text-emerald-700 underline">
            hi@thebeetamin.com
          </a>
          .
        </p>
        <Link href="/assessment/results" className="mt-6 text-sm font-semibold text-emerald-700">
          ← Back to results
        </Link>
      </div>
    )
  }

  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('name')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  const patientName = (client?.name as string | undefined)?.trim() || 'there'

  return <ReportReadyView reportId={row.report_id} patientName={patientName} email={row.email} />
}

export const runtime = 'nodejs'
