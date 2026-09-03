import { google } from 'googleapis'

import { formatLeadSnapshot, type AssessmentLeadSnapshot } from '@/lib/assessment-lead-labels'

const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'

const HEADER_ROW = [
  'Date',
  'Name',
  'Email',
  'Phone',
  'Age',
  'Gender',
  'Height',
  'Weight',
  'Goal',
  'Health Concern',
  'Diet',
  'Energy',
  'Sleep',
] as const

export type AssessmentSheetLead = {
  name: string
  email: string
  phone: string
  age: string
  gender?: string
  height?: string
  weight?: string
  snapshot: AssessmentLeadSnapshot
}

function getSheetsAuth() {
  const jsonRaw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()
  if (jsonRaw) {
    try {
      const parsed = JSON.parse(jsonRaw) as { client_email?: string; private_key?: string }
      if (parsed.client_email && parsed.private_key) {
        return new google.auth.GoogleAuth({
          credentials: { client_email: parsed.client_email, private_key: parsed.private_key },
          scopes: [SHEETS_SCOPE],
        })
      }
    } catch (e) {
      console.error('[assessment-leads-sheet] invalid GOOGLE_SERVICE_ACCOUNT_JSON', e)
      return null
    }
  }

  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL?.trim()
  const key = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n').trim()
  if (!email || !key) return null

  return new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: key },
    scopes: [SHEETS_SCOPE],
  })
}

export function isAssessmentLeadsSheetConfigured(): boolean {
  return Boolean(process.env.ASSESSMENT_LEADS_SHEET_ID?.trim() && getSheetsAuth())
}

function tabRange(range: string): string {
  const tab = (process.env.ASSESSMENT_LEADS_SHEET_TAB?.trim() || 'Leads').replace(/'/g, "''")
  return `'${tab}'!${range}`
}

function emailAlreadyInSheet(values: string[][] | undefined, email: string): boolean {
  if (!values?.length) return false
  const needle = email.trim().toLowerCase()
  return values.some((row) => (row[2] ?? '').trim().toLowerCase() === needle)
}

/**
 * Appends one clean lead row after email OTP verification.
 * Never writes OTP codes, full questionnaires, or reports.
 * Returns false if skipped (not configured / duplicate / error) — callers must not block verification.
 */
export async function appendVerifiedAssessmentLead(lead: AssessmentSheetLead): Promise<boolean> {
  const spreadsheetId = process.env.ASSESSMENT_LEADS_SHEET_ID?.trim()
  const auth = getSheetsAuth()
  if (!spreadsheetId || !auth) {
    console.warn('[assessment-leads-sheet] not configured — set ASSESSMENT_LEADS_SHEET_ID and service-account credentials')
    return false
  }

  const email = lead.email.trim().toLowerCase()
  if (!email || !email.includes('@')) return false

  const sheets = google.sheets({ version: 'v4', auth })
  const formatted = formatLeadSnapshot(lead.snapshot)

  try {
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: tabRange('A1:C'),
    })

    const rows = existing.data.values ?? []
    if (rows.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: tabRange('A1'),
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [Array.from(HEADER_ROW)] },
      })
    } else if (emailAlreadyInSheet(rows.slice(1), email)) {
      return false
    }

    const date = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    const values = [
      [
        date,
        lead.name.trim(),
        email,
        lead.phone.trim(),
        lead.age.trim(),
        formatted.gender,
        formatted.height,
        formatted.weight,
        formatted.goal,
        formatted.healthConcern,
        formatted.diet,
        formatted.energy,
        formatted.sleep,
      ],
    ]

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: tabRange('A1'),
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    })
    return true
  } catch (e) {
    console.error('[assessment-leads-sheet] append failed', e)
    return false
  }
}
