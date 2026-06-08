import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Resend } from 'resend'

export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM_EMAIL || 'The Beetamin <hi@thebeetamin.com>'

type AppointmentReminder = {
  id: string
  session_number: number
  scheduled_date: string
  scheduled_time: string
  reminder_24h_sent: boolean
  reminder_1h_sent: boolean
  clients: { name: string; email: string } | null
  nutritionists: { name: string; email: string } | null
}

function timingSafeEqualString(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}

/**
 * Appointments are stored as an IST (UTC+5:30, no DST) wall-clock date + time.
 * Build the true instant so comparisons against `now` are timezone-correct.
 */
function apptInstant(date: string, time: string): Date {
  const t = time.length === 5 ? `${time}:00` : time
  return new Date(`${date}T${t}+05:30`)
}

function isRealEmail(email?: string | null): email is string {
  return !!email && !email.endsWith('@beetamin.internal')
}

function shell(title: string, bodyHtml: string) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#0A0F14;color:white;padding:40px;border-radius:16px;">
      <h1 style="color:#10B981;margin-top:0;">${title}</h1>
      ${bodyHtml}
      <p style="color:#6B7280;font-size:12px;margin-top:32px;">TheBeetamin · India's #1 Personalized Nutrition System</p>
    </div>`
}

function detailCard(rows: string[]) {
  return `
    <div style="background:#111820;border-radius:12px;padding:24px;margin:24px 0;">
      ${rows.map((r) => `<p style="color:white;margin:6px 0;">${r}</p>`).join('')}
    </div>`
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  if (!authHeader || !secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const provided = authHeader.replace(/^Bearer\s+/i, '')
  if (!timingSafeEqualString(provided, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = Date.now()

  const { data: appointments, error } = await supabaseAdmin
    .from('appointments')
    .select(`
      id, session_number, scheduled_date, scheduled_time,
      reminder_24h_sent, reminder_1h_sent,
      clients(name, email),
      nutritionists(name, email)
    `)
    .eq('status', 'confirmed')

  if (error) {
    console.error('[reminders/cron] query', error)
    return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  }

  const all = (appointments || []) as unknown as AppointmentReminder[]
  let sent24h = 0
  let sent1h = 0
  let failures = 0

  for (const appt of all) {
    const apptDt = apptInstant(appt.scheduled_date, appt.scheduled_time)
    const minutesUntil = Math.round((apptDt.getTime() - now) / 60000)

    // Resilient windows (cron runs every 15 min; window width tolerates a missed run).
    const due24h = !appt.reminder_24h_sent && minutesUntil >= 1380 && minutesUntil <= 1455
    const due1h = !appt.reminder_1h_sent && minutesUntil >= 1 && minutesUntil <= 75
    if (!due24h && !due1h) continue

    const formattedDate = apptDt.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'Asia/Kolkata',
    })
    const [h, m] = appt.scheduled_time.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const formattedTime = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`

    const clientName = appt.clients?.name || 'there'
    const nutritionistName = appt.nutritionists?.name || 'your nutritionist'
    const clientEmail = appt.clients?.email
    const nutritionistEmail = appt.nutritionists?.email

    try {
      const messages: { to: string; subject: string; html: string }[] = []

      if (due24h) {
        if (isRealEmail(clientEmail)) {
          messages.push({
            to: clientEmail,
            subject: `Reminder: Session ${appt.session_number} is Tomorrow 🌿`,
            html: shell(
              'Your session is tomorrow! 📅',
              detailCard([
                `📅 Date: <strong>${formattedDate}</strong>`,
                `⏰ Time: <strong>${formattedTime}</strong>`,
                `👤 Nutritionist: <strong>${nutritionistName}</strong>`,
                `⏱️ Duration: <strong>30 minutes</strong>`,
              ]) +
                `<p style="color:#9CA3AF;">You will receive a Google Meet link before your session.</p>
                 <a href="https://thebeetamin.com/sessions" style="background:#10B981;color:black;padding:16px 32px;border-radius:50px;text-decoration:none;font-weight:bold;display:inline-block;margin-top:16px;">View My Sessions →</a>`,
            ),
          })
        }
        if (isRealEmail(nutritionistEmail)) {
          messages.push({
            to: nutritionistEmail,
            subject: `Reminder: Session ${appt.session_number} with ${clientName} is tomorrow`,
            html: shell(
              'You have a session tomorrow 📅',
              detailCard([
                `👤 Client: <strong>${clientName}</strong>`,
                `📅 Date: <strong>${formattedDate}</strong>`,
                `⏰ Time: <strong>${formattedTime}</strong>`,
                `🔢 Session: <strong>${appt.session_number} of 6</strong>`,
              ]) +
                `<a href="https://thebeetamin.com/nutritionist" style="background:#10B981;color:black;padding:16px 32px;border-radius:50px;text-decoration:none;font-weight:bold;display:inline-block;margin-top:16px;">Open Dashboard →</a>`,
            ),
          })
        }
      }

      if (due1h) {
        if (isRealEmail(clientEmail)) {
          messages.push({
            to: clientEmail,
            subject: `Session ${appt.session_number} starts in 1 hour ⏰`,
            html: shell(
              'Your session starts soon! ⏰',
              detailCard([
                `⏰ Time: <strong>${formattedTime}</strong>`,
                `👤 Nutritionist: <strong>${nutritionistName}</strong>`,
                `⏱️ Duration: <strong>30 minutes</strong>`,
              ]) + `<p style="color:#9CA3AF;">Check your email for the Google Meet link.</p>`,
            ),
          })
        }
        if (isRealEmail(nutritionistEmail)) {
          messages.push({
            to: nutritionistEmail,
            subject: `Session ${appt.session_number} with ${clientName} starts in 1 hour ⏰`,
            html: shell(
              'Your next session starts soon ⏰',
              detailCard([
                `👤 Client: <strong>${clientName}</strong>`,
                `⏰ Time: <strong>${formattedTime}</strong>`,
                `🔢 Session: <strong>${appt.session_number} of 6</strong>`,
              ]) +
                `<a href="https://thebeetamin.com/nutritionist" style="background:#10B981;color:black;padding:16px 32px;border-radius:50px;text-decoration:none;font-weight:bold;display:inline-block;margin-top:16px;">Open Dashboard →</a>`,
            ),
          })
        }
      }

      for (const msg of messages) {
        await resend.emails.send({ from: FROM, to: msg.to, subject: msg.subject, html: msg.html })
      }

      // Only mark sent after the emails for this appointment succeed (so a failure retries next run).
      if (due24h) {
        await supabaseAdmin.from('appointments').update({ reminder_24h_sent: true }).eq('id', appt.id)
        sent24h++
      }
      if (due1h) {
        await supabaseAdmin.from('appointments').update({ reminder_1h_sent: true }).eq('id', appt.id)
        sent1h++
      }
    } catch (e) {
      failures++
      console.error('[reminders/cron] send failed for appt', appt.id, e)
    }
  }

  return NextResponse.json({
    ok: true,
    processed: all.length,
    sent24h,
    sent1h,
    failures,
    timestamp: new Date(now).toISOString(),
  })
}
