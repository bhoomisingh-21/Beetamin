import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

type AppointmentReminder = {
  id: string
  session_number: number
  scheduled_date: string
  scheduled_time: string
  reminder_24h_sent: boolean
  reminder_1h_sent: boolean
  clients: { name: string; email: string }
  nutritionists: { name: string }
}

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000)
  const in1h = new Date(now.getTime() + 60 * 60 * 1000)
  const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000)

  function toDateTimeStr(d: Date) {
    return d.toISOString().slice(0, 16).replace('T', ' ')
  }

  const { data: appointments } = await supabaseAdmin
    .from('appointments')
    .select(`
      id, session_number, scheduled_date, scheduled_time,
      reminder_24h_sent, reminder_1h_sent,
      clients(name, email),
      nutritionists(name)
    `)
    .eq('status', 'confirmed')

  const all = (appointments || []) as unknown as AppointmentReminder[]
  let sent24h = 0
  let sent1h = 0

  for (const appt of all) {
    const apptDt = new Date(`${appt.scheduled_date}T${appt.scheduled_time}`)
    const apptStr = toDateTimeStr(apptDt)
    const in24hStr = toDateTimeStr(in24h)
    const in25hStr = toDateTimeStr(in25h)
    const in1hStr = toDateTimeStr(in1h)
    const in2hStr = toDateTimeStr(in2h)

    const formattedDate = apptDt.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    const [h, m] = appt.scheduled_time.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const formattedTime = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`

    // 24hr reminder
    if (!appt.reminder_24h_sent && apptStr >= in24hStr && apptStr < in25hStr) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: appt.clients.email,
        subject: `Reminder: Session ${appt.session_number} is Tomorrow 🌿`,
        html: `
          <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0A0F14;color:white;padding:40px;border-radius:16px;">
            <h1 style="color:#10B981;">Your session is tomorrow! 📅</h1>
            <div style="background:#111820;border-radius:12px;padding:24px;margin:24px 0;">
              <p style="color:white;margin:0;">📅 Date: <strong>${formattedDate}</strong></p>
              <p style="color:white;margin:8px 0;">⏰ Time: <strong>${formattedTime}</strong></p>
              <p style="color:white;margin:0;">👤 Nutritionist: <strong>${appt.nutritionists.name}</strong></p>
              <p style="color:white;margin:8px 0;">⏱️ Duration: <strong>30 minutes</strong></p>
            </div>
            <p style="color:#9CA3AF;">You will receive a Google Meet link 30 minutes before your session.</p>
            <a href="https://thebeetamin.com/booking/dashboard"
               style="background:#10B981;color:black;padding:16px 32px;border-radius:50px;text-decoration:none;font-weight:bold;display:inline-block;margin-top:16px;">
              View Dashboard →
            </a>
            <p style="color:#6B7280;font-size:12px;margin-top:32px;">TheBeetamin · India's #1 Personalized Nutrition System</p>
          </div>
        `,
      })
      await supabaseAdmin
        .from('appointments')
        .update({ reminder_24h_sent: true })
        .eq('id', appt.id)
      sent24h++
    }

    // 1hr reminder
    if (!appt.reminder_1h_sent && apptStr >= in1hStr && apptStr < in2hStr) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: appt.clients.email,
        subject: `Session ${appt.session_number} starts in 1 hour ⏰`,
        html: `
          <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0A0F14;color:white;padding:40px;border-radius:16px;">
            <h1 style="color:#10B981;">Your session starts in 1 hour! ⏰</h1>
            <div style="background:#111820;border-radius:12px;padding:24px;margin:24px 0;">
              <p style="color:white;margin:0;">⏰ Time: <strong>${formattedTime}</strong></p>
              <p style="color:white;margin:8px 0;">👤 Nutritionist: <strong>${appt.nutritionists.name}</strong></p>
              <p style="color:white;margin:0;">⏱️ Duration: <strong>30 minutes</strong></p>
            </div>
            <p style="color:#9CA3AF;">Check your email for the Google Meet link.</p>
            <p style="color:#6B7280;font-size:12px;margin-top:32px;">TheBeetamin · India's #1 Personalized Nutrition System</p>
          </div>
        `,
      })
      await supabaseAdmin
        .from('appointments')
        .update({ reminder_1h_sent: true })
        .eq('id', appt.id)
      sent1h++
    }
  }

  return NextResponse.json({
    ok: true,
    processed: all.length,
    sent24h,
    sent1h,
    timestamp: now.toISOString(),
  })
}
