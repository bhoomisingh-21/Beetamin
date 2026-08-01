import { randomUUID } from 'crypto'

import { google } from 'googleapis'

import { paymentAppBaseUrl } from '@/lib/payment-app-base-url'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Google Meet integration — a single shared TheBeetamin Google account is connected once
 * (Admin Panel → Google Calendar) and used to create real Meet-enabled Calendar events for
 * every confirmed / rescheduled session, regardless of which nutritionist is assigned.
 */

const SCOPES = ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/userinfo.email']
const TOKEN_ROW_ID = 'primary'
const MEETING_DURATION_MINUTES = 35
const CALENDAR_TIMEZONE = 'Asia/Kolkata'

/** Thrown (message-only) when no Google account has been connected yet. */
export const GOOGLE_NOT_CONNECTED = 'GOOGLE_NOT_CONNECTED'

type StoredTokens = {
  refresh_token: string
  access_token: string | null
  expiry_date: number | null
}

export function isGoogleCalendarConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim())
}

function redirectUri(): string {
  return `${paymentAppBaseUrl()}/api/admin/google-calendar/callback`
}

function getGoogleOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim()
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()
  if (!clientId || !clientSecret) {
    throw new Error('Google Calendar is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.')
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri())
}

export function getGoogleAuthUrl(state: string): string {
  const client = getGoogleOAuthClient()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state,
  })
}

/** Exchanges an OAuth `code` for tokens and persists the refresh token. Returns the connected email. */
export async function saveGoogleTokensFromCode(code: string): Promise<{ email: string | null }> {
  const client = getGoogleOAuthClient()
  const { tokens } = await client.getToken(code)

  if (!tokens.refresh_token) {
    throw new Error(
      'Google did not return a refresh token. Please try connecting again (make sure to approve all permissions).',
    )
  }

  client.setCredentials(tokens)
  let email: string | null = null
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: client })
    const me = await oauth2.userinfo.get()
    email = me.data.email ?? null
  } catch {
    email = null
  }

  const { error } = await supabaseAdmin.from('google_calendar_tokens').upsert(
    {
      id: TOKEN_ROW_ID,
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token ?? null,
      scope: tokens.scope ?? null,
      token_type: tokens.token_type ?? null,
      expiry_date: tokens.expiry_date ?? null,
      connected_email: email,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )
  if (error) throw new Error(error.message)

  return { email }
}

export async function getGoogleCalendarStatus(): Promise<{
  connected: boolean
  email: string | null
  updatedAt: string | null
  configured: boolean
}> {
  const configured = isGoogleCalendarConfigured()
  const { data } = await supabaseAdmin
    .from('google_calendar_tokens')
    .select('connected_email, updated_at')
    .eq('id', TOKEN_ROW_ID)
    .maybeSingle()

  return {
    connected: Boolean(data),
    email: (data?.connected_email as string | null) ?? null,
    updatedAt: (data?.updated_at as string | null) ?? null,
    configured,
  }
}

export async function disconnectGoogleCalendar(): Promise<void> {
  await supabaseAdmin.from('google_calendar_tokens').delete().eq('id', TOKEN_ROW_ID)
}

async function loadStoredTokens(): Promise<StoredTokens | null> {
  const { data, error } = await supabaseAdmin
    .from('google_calendar_tokens')
    .select('refresh_token, access_token, expiry_date')
    .eq('id', TOKEN_ROW_ID)
    .maybeSingle()
  if (error || !data) return null
  return data as StoredTokens
}

async function getAuthorizedClient() {
  const stored = await loadStoredTokens()
  if (!stored?.refresh_token) {
    throw new Error(GOOGLE_NOT_CONNECTED)
  }

  const client = getGoogleOAuthClient()
  client.setCredentials({
    refresh_token: stored.refresh_token,
    access_token: stored.access_token ?? undefined,
    expiry_date: stored.expiry_date ?? undefined,
  })

  // googleapis auto-refreshes the access token using the refresh_token when it's expired.
  // Persist the refreshed access token so we don't hit Google's rate limit on refresh calls.
  client.on('tokens', (tokens) => {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (tokens.access_token) patch.access_token = tokens.access_token
    if (tokens.expiry_date) patch.expiry_date = tokens.expiry_date
    if (tokens.refresh_token) patch.refresh_token = tokens.refresh_token
    void supabaseAdmin
      .from('google_calendar_tokens')
      .update(patch)
      .eq('id', TOKEN_ROW_ID)
      .then(({ error }) => {
        if (error) console.error('[google-calendar] failed to persist refreshed token', error)
      })
  })

  return client
}

function toLocalDateTime(dateStr: string, timeStr: string): string {
  const hhmmss = timeStr.length === 5 ? `${timeStr}:00` : timeStr
  return `${dateStr}T${hhmmss}`
}

/** Wall-clock addition (no timezone conversion needed — Calendar API interprets dateTime via the `timeZone` field). */
function addMinutesLocal(dateStr: string, timeStr: string, minutes: number): string {
  const start = new Date(toLocalDateTime(dateStr, timeStr))
  const end = new Date(start.getTime() + minutes * 60_000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}` +
    `T${pad(end.getHours())}:${pad(end.getMinutes())}:${pad(end.getSeconds())}`
  )
}

function extractMeetLink(event: { hangoutLink?: string | null; conferenceData?: { entryPoints?: { entryPointType?: string | null; uri?: string | null }[] | null } | null }): string {
  const fromConference = event.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri
  return fromConference || event.hangoutLink || ''
}

export type CreateMeetEventInput = {
  appointmentId: string
  scheduledDate: string
  scheduledTime: string
  clientName: string
  clientEmail: string
  nutritionistName: string
  nutritionistEmail: string
  sessionNumber: number
}

/** Creates a real Google Calendar event with a Google Meet link, 35 minutes long. */
export async function createMeetEventForAppointment(
  input: CreateMeetEventInput,
): Promise<{ meetLink: string; eventId: string }> {
  const auth = await getAuthorizedClient()
  const calendar = google.calendar({ version: 'v3', auth })

  const startDateTime = toLocalDateTime(input.scheduledDate, input.scheduledTime)
  const endDateTime = addMinutesLocal(input.scheduledDate, input.scheduledTime, MEETING_DURATION_MINUTES)

  const res = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    sendUpdates: 'all',
    requestBody: {
      summary: `TheBeetamin — Nutrition Session ${input.sessionNumber} with ${input.clientName}`,
      description: `Nutrition consultation session #${input.sessionNumber} between ${input.nutritionistName} and ${input.clientName}, booked via TheBeetamin.`,
      start: { dateTime: startDateTime, timeZone: CALENDAR_TIMEZONE },
      end: { dateTime: endDateTime, timeZone: CALENDAR_TIMEZONE },
      attendees: [
        { email: input.clientEmail, displayName: input.clientName },
        { email: input.nutritionistEmail, displayName: input.nutritionistName },
      ],
      conferenceData: {
        createRequest: {
          requestId: `beetamin-${input.appointmentId}-${randomUUID()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      reminders: { useDefault: true },
    },
  })

  const meetLink = extractMeetLink(res.data)
  const eventId = res.data.id ?? ''
  if (!meetLink || !eventId) {
    throw new Error('Google did not return a Meet link for the created event.')
  }
  return { meetLink, eventId }
}

/** Patches an existing event's time (used on reschedule) and returns the (possibly unchanged) Meet link. */
export async function updateMeetEventTime(input: {
  eventId: string
  scheduledDate: string
  scheduledTime: string
}): Promise<{ meetLink: string }> {
  const auth = await getAuthorizedClient()
  const calendar = google.calendar({ version: 'v3', auth })

  const startDateTime = toLocalDateTime(input.scheduledDate, input.scheduledTime)
  const endDateTime = addMinutesLocal(input.scheduledDate, input.scheduledTime, MEETING_DURATION_MINUTES)

  const res = await calendar.events.patch({
    calendarId: 'primary',
    eventId: input.eventId,
    conferenceDataVersion: 1,
    sendUpdates: 'all',
    requestBody: {
      start: { dateTime: startDateTime, timeZone: CALENDAR_TIMEZONE },
      end: { dateTime: endDateTime, timeZone: CALENDAR_TIMEZONE },
    },
  })

  return { meetLink: extractMeetLink(res.data) }
}

/** Cancels (deletes) the Calendar event. Safe to call even if it's already gone. */
export async function cancelMeetEvent(eventId: string): Promise<void> {
  const auth = await getAuthorizedClient()
  const calendar = google.calendar({ version: 'v3', auth })
  try {
    await calendar.events.delete({ calendarId: 'primary', eventId, sendUpdates: 'all' })
  } catch (e) {
    const code = (e as { code?: number })?.code
    if (code === 404 || code === 410) return
    throw e
  }
}

/** Maps internal Google errors to a friendly, actionable message for nutritionists/admins. */
export function friendlyGoogleCalendarError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e)
  if (msg === GOOGLE_NOT_CONNECTED) {
    return 'Google Calendar is not connected yet. Ask an admin to connect it from Admin Panel → Google Calendar.'
  }
  if (msg.includes('invalid_grant') || msg.includes('invalid_client')) {
    return 'The Google Calendar connection has expired or was revoked. Ask an admin to reconnect it from Admin Panel → Google Calendar.'
  }
  if (msg.includes('not configured')) {
    return msg
  }
  return 'Could not create the Google Meet link right now. The booking was still saved — try again in a moment.'
}
