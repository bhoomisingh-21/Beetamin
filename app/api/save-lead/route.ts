import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Resend } from 'resend'
import { validateLeadInput } from '@/lib/utils'

const resend = new Resend(process.env.RESEND_API_KEY)

const rateMap = new Map<string, { count: number; reset: number }>()

function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)

  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false

  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const allowed = checkRateLimit(ip, 5, 60_000)
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Please wait.' }, { status: 429 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const validation = validateLeadInput(body)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { name, email, phone, source } = validation.data

    await supabaseAdmin.from('leads').upsert({ name, email, phone, source }, { onConflict: 'email' })

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: 'hi@thebeetamin.com',
      subject: `New Lead [${source}]: ${name}`,
      html: `
        <div style="font-family:Inter,sans-serif;padding:24px;background:#f9fafb;border-radius:12px;max-width:500px;">
          <h2 style="color:#10B981;">New Lead 🌿</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || '—'}</p>
          <p><strong>Source:</strong> ${source}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN')}</p>
          ${phone ? `<a href="https://wa.me/${phone.replace(/\D/g, '')}" style="background:#25D366;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;margin-top:12px;">WhatsApp →</a>` : ''}
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
