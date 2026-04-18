import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, source } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'name and email required' }, { status: 400 })
    }

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
