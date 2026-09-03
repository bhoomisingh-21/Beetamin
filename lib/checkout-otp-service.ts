import crypto from 'crypto'
import { Resend } from 'resend'

const OTP_TTL_MS = 10 * 60 * 1000

export function generateOtpCode(): string {
  return String(crypto.randomInt(100000, 999999))
}

export function hashOtpCode(code: string): string {
  return crypto.createHash('sha256').update(code.trim()).digest('hex')
}

export function normalizeIndianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) return `91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return digits
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`
  return null
}

export function formatPhoneDisplay(e164: string): string {
  if (e164.startsWith('91') && e164.length === 12) {
    return `+91 ${e164.slice(2, 7)} ${e164.slice(7)}`
  }
  return e164
}

export function otpExpiresAt(): string {
  return new Date(Date.now() + OTP_TTL_MS).toISOString()
}

async function sendOtpEmail(
  to: string,
  code: string,
  purpose: 'checkout' | 'assessment' = 'checkout',
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.RESEND_FROM?.trim() || 'TheBeetamin <noreply@thebeetamin.com>'
  if (!apiKey) {
    return { ok: false, error: 'Email service is not configured. Contact support@thebeetamin.com.' }
  }

  const intro =
    purpose === 'assessment'
      ? 'Use this code to securely view your personalized health assessment results:'
      : 'Use this code to continue your ₹3,999 Full Recovery Plan purchase:'
  const heading = purpose === 'assessment' ? 'Verify to see your results' : 'Verify before checkout'

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from,
    to,
    subject: `${code} — your TheBeetamin verification code`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <p style="color:#111;font-size:18px;font-weight:700">${heading}</p>
        <p style="color:#555;font-size:15px;line-height:1.5">${intro}</p>
        <p style="font-size:32px;font-weight:900;letter-spacing:6px;color:#10B981;margin:24px 0">${code}</p>
        <p style="color:#888;font-size:13px">Valid for 10 minutes. If you did not request this, ignore this email.</p>
      </div>
    `,
  })

  if (error) {
    console.error('[checkout-otp] email', error)
    return { ok: false, error: 'Could not send verification email. Try again.' }
  }
  return { ok: true }
}

/** MSG91 OTP (India). Requires MSG91_AUTH_KEY + MSG91_OTP_TEMPLATE_ID env vars. */
async function sendOtpSms(mobileE164: string, code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const authKey = process.env.MSG91_AUTH_KEY?.trim()
  const templateId = process.env.MSG91_OTP_TEMPLATE_ID?.trim()

  if (!authKey || !templateId) {
    return {
      ok: false,
      error: 'SMS verification is not configured yet. Verify with email instead, or contact support@thebeetamin.com.',
    }
  }

  try {
    const res = await fetch('https://control.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: {
        authkey: authKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_id: templateId,
        mobile: mobileE164,
        otp: code,
        otp_length: 6,
      }),
    })

    const json = (await res.json().catch(() => ({}))) as { type?: string; message?: string }
    if (!res.ok || json.type === 'error') {
      console.error('[checkout-otp] MSG91', res.status, json)
      return { ok: false, error: json.message || 'Could not send SMS. Try email verification.' }
    }
    return { ok: true }
  } catch (e) {
    console.error('[checkout-otp] MSG91 fetch', e)
    return { ok: false, error: 'Could not send SMS. Try email verification.' }
  }
}

export async function deliverOtp(args: {
  channel: 'phone' | 'email'
  phoneE164?: string
  email?: string
  code: string
  purpose?: 'checkout' | 'assessment'
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (args.channel === 'email') {
    const email = args.email?.trim().toLowerCase()
    if (!email) return { ok: false, error: 'Email is required.' }
    return sendOtpEmail(email, args.code, args.purpose ?? 'checkout')
  }

  const mobile = args.phoneE164?.trim()
  if (!mobile) return { ok: false, error: 'Phone number is required.' }
  return sendOtpSms(mobile, args.code)
}
