import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { Resend } from 'resend'
import { RecoveryReportPDF } from '@/components/report/RecoveryReport'
import type { RecoveryReportV2Data } from '@/lib/recovery-report-v2-types'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(req: Request) {
  let userId: string | null = null
  try {
    userId = (await auth()).userId ?? null
  } catch (e) {
    console.error('[api/report/generate-pdf] auth', e)
    return NextResponse.json({ success: false, error: 'Auth unavailable' }, { status: 503 })
  }
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let body: { reportData?: RecoveryReportV2Data; userEmail?: string; userName?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const reportData = body.reportData
  const userEmailRaw = typeof body.userEmail === 'string' ? body.userEmail.trim().toLowerCase() : ''
  const userName = typeof body.userName === 'string' ? body.userName.trim() : ''
  if (!reportData || !userEmailRaw || !userName) {
    return NextResponse.json({ success: false, error: 'Missing reportData, userEmail or userName' }, { status: 400 })
  }

  try {
    const u = await currentUser()
    const primaryLower = u?.primaryEmailAddress?.emailAddress?.trim().toLowerCase()
    const match =
      (!!primaryLower && primaryLower === userEmailRaw) ||
      !!u?.emailAddresses?.some((ea) => ea.emailAddress.trim().toLowerCase() === userEmailRaw)
    if (!match) {
      return NextResponse.json({ success: false, error: 'Email must match signed-in account' }, { status: 403 })
    }
  } catch (e) {
    console.error('[api/report/generate-pdf] currentUser', e)
    return NextResponse.json({ success: false, error: 'Unable to verify user' }, { status: 503 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'Email service not configured' }, { status: 503 })
  }

  const from =
    process.env.RESEND_REPORTS_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'The Beetamin <hi@thebeetamin.com>'
  const firstName = userName.split(/\s+/)[0] || userName

  try {
    const pdfBuffer = await renderToBuffer(
      React.createElement(RecoveryReportPDF, { reportData }) as never,
    )

    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from,
      to: userEmailRaw,
      subject: `Your TheBeetamin Recovery Report is Ready, ${firstName}!`,
      html: `
        <div style="font-family:Inter,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#0A0F14;color:white;padding:40px;border-radius:16px;">
          <div style="background:#10B981;height:6px;border-radius:3px;margin-bottom:32px;"></div>
          <h1 style="color:#10B981;margin:0 0 8px;">Your Recovery Blueprint is Ready</h1>
          <p style="color:#9CA3AF;margin:0 0 24px;">Hi ${firstName}, your personalised deficiency recovery report has been prepared by Dr. Priya Sharma.</p>
          <div style="background:#111820;border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #1a2e1a;">
            <p style="color:white;margin:0 0 8px;font-weight:700;">Your report includes:</p>
            <p style="color:#9CA3AF;margin:4px 0;">Complete deficiency analysis with severity bands</p>
            <p style="color:#9CA3AF;margin:4px 0;">Indian meal map with micronutrient targets</p>
            <p style="color:#9CA3AF;margin:4px 0;">Exact supplement timings and dosing guardrails</p>
            <p style="color:#9CA3AF;margin:4px 0;">90-day repair arc with milestones</p>
            <p style="color:#9CA3AF;margin:4px 0;">Food swaps for common blockers</p>
          </div>
          <p style="color:#9CA3AF;font-size:14px;margin:0;">The full report PDF is attached. Save it to your phone for daily reference.</p>
          <p style="color:#4B5563;font-size:11px;margin-top:24px;text-align:center;">TheBeetamin · Wellness guidance only, not medical advice.</p>
        </div>
      `,
      attachments: [
        {
          filename: `TheBeetamin_Recovery_Report_${userName.replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer.toString('base64'),
          contentType: 'application/pdf',
        },
      ],
    })

    if (error) {
      console.error('[api/report/generate-pdf] resend', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[api/report/generate-pdf]', e)
    return NextResponse.json({ success: false, error: 'PDF or email failed' }, { status: 500 })
  }
}
