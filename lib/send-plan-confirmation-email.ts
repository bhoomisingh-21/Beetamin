import { Resend } from 'resend'

export type SendPlanConfirmationEmailResult =
  | { ok: true; id?: string }
  | { ok: false; error: string }

/** Confirmation email sent to the customer after a successful ₹3,999 full-plan purchase. */
export async function sendFullPlanConfirmationEmail(input: {
  to: string
  name: string
  sessionsTotal: number
  planEndDate: string
  bookingUrl: string
}): Promise<SendPlanConfirmationEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { ok: false, error: 'Email service is not configured' }
  }

  const from =
    process.env.RESEND_REPORTS_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    'The Beetamin <hi@thebeetamin.com>'
  const replyTo = process.env.RESEND_SUPPORT_EMAIL || 'support@thebeetamin.com'
  const firstName = input.name.split(/\s+/)[0] || input.name

  const planEndPretty = (() => {
    try {
      return new Date(input.planEndDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return input.planEndDate
    }
  })()

  const resend = new Resend(apiKey)

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      replyTo,
      subject: 'Welcome to The Core Transformation ✓ — The Beetamin',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;background:#f4f6f4;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8e0;">
          <tr>
            <td style="padding:28px 32px 8px;text-align:center;border-bottom:3px solid #1a472a;">
              <p style="margin:0;font-size:18px;font-weight:bold;color:#1a472a;letter-spacing:0.02em;">The Beetamin</p>
              <p style="margin:8px 0 0;font-size:11px;color:#64748b;">Wellness Clinic</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 16px;font-size:16px;color:#1a1a1a;">Hi ${firstName},</p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;">
                Your payment is confirmed and your <strong>90-Day Core Transformation</strong> is now active. Welcome aboard — we're excited to support your recovery.
              </p>
              <div style="background:#ecfdf5;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:20px;">
                <p style="margin:0 0 10px;font-size:12px;font-weight:bold;color:#166534;">Your plan</p>
                <ul style="margin:0;padding-left:18px;color:#334155;font-size:13px;line-height:1.7;">
                  <li><strong>${input.sessionsTotal} live nutritionist sessions</strong> over 90 days</li>
                  <li>Personalised diet plan from your nutritionist</li>
                  <li>Progress tracking &amp; check-ins</li>
                  <li>Plan valid until <strong>${planEndPretty}</strong></li>
                </ul>
              </div>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;">
                <strong>Next step:</strong> book your first session with a nutritionist so they can review your assessment and prepare your personalised plan.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                <tr>
                  <td style="background:#1a472a;border-radius:8px;text-align:center;">
                    <a href="${input.bookingUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-weight:bold;font-size:14px;text-decoration:none;">
                      Book Your First Session
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#334155;">
                Warm wishes,<br/><span style="color:#1a472a;font-weight:bold;">The Beetamin team</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f8faf8;font-size:11px;color:#64748b;text-align:center;border-top:1px solid #e2e8e0;">
              <a href="https://thebeetamin.com" style="color:#1a472a;">thebeetamin.com</a>
              · Reply to this email if you need any help
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    })

    if (error) {
      console.error('[sendFullPlanConfirmationEmail]', error)
      return { ok: false, error: error.message || 'Failed to send email' }
    }
    return { ok: true, id: data?.id }
  } catch (e) {
    console.error('[sendFullPlanConfirmationEmail]', e)
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to send email' }
  }
}
