import { Resend } from 'resend'

export type SendDietPlanEmailResult = { ok: true; id?: string } | { ok: false; error: string }

export function sessionsDietPlanUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.thebeetamin.com'
  return `${base.replace(/\/$/, '')}/sessions#diet-plans`
}

/** Sent when a nutritionist publishes a diet plan (CRM grid or PDF). */
export async function sendNutritionistDietPlanEmail(input: {
  to: string
  name: string
  nutritionistName: string
  planTitle: string
  /** When set, email includes a PDF download button (uploaded plans). */
  downloadUrl?: string
}): Promise<SendDietPlanEmailResult> {
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
  const viewUrl = sessionsDietPlanUrl()
  const title = input.planTitle.trim() || 'Personalised Diet Plan'

  const resend = new Resend(apiKey)

  const primaryCta = input.downloadUrl
    ? `<table cellpadding="0" cellspacing="0" style="margin:0 auto 12px;">
        <tr>
          <td style="background:#10B981;border-radius:8px;text-align:center;">
            <a href="${input.downloadUrl}" style="display:inline-block;padding:14px 28px;color:#000000;font-weight:bold;font-size:14px;text-decoration:none;">
              Download PDF
            </a>
          </td>
        </tr>
      </table>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
        <tr>
          <td style="border:2px solid #10B981;border-radius:8px;text-align:center;">
            <a href="${viewUrl}" style="display:inline-block;padding:12px 24px;color:#10B981;font-weight:bold;font-size:14px;text-decoration:none;">
              View on Sessions Page
            </a>
          </td>
        </tr>
      </table>`
    : `<table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
        <tr>
          <td style="background:#10B981;border-radius:8px;text-align:center;">
            <a href="${viewUrl}" style="display:inline-block;padding:14px 28px;color:#000000;font-weight:bold;font-size:14px;text-decoration:none;">
              View My Diet Plan
            </a>
          </td>
        </tr>
      </table>`

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      replyTo,
      subject: `Your diet plan is ready — ${title}`,
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
            <td style="padding:28px 32px 8px;text-align:center;border-bottom:3px solid #10B981;">
              <p style="margin:0;font-size:18px;font-weight:bold;color:#10B981;letter-spacing:0.02em;">The Beetamin</p>
              <p style="margin:8px 0 0;font-size:11px;color:#64748b;">Personalised Nutrition</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 16px;font-size:16px;color:#1a1a1a;">Hi ${firstName},</p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;">
                Your nutritionist <strong>${input.nutritionistName}</strong> has sent you a new diet plan — <strong>${title}</strong>.
              </p>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#475569;">
                Open your sessions page to see day-by-day meals, or download the PDF if one was attached.
              </p>
              ${primaryCta}
              <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
                Bookmark <a href="${viewUrl}" style="color:#10B981;font-weight:bold;">your diet plan</a> — it stays on your sessions page for every visit.
              </p>
              <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#334155;">
                Warm wishes,<br/><span style="color:#10B981;font-weight:bold;">The Beetamin team</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f8faf8;font-size:11px;color:#64748b;text-align:center;border-top:1px solid #e2e8e0;">
              <a href="https://thebeetamin.com" style="color:#10B981;">thebeetamin.com</a>
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
      console.error('[sendNutritionistDietPlanEmail]', error)
      return { ok: false, error: error.message || 'Failed to send email' }
    }
    return { ok: true, id: data?.id }
  } catch (e) {
    console.error('[sendNutritionistDietPlanEmail]', e)
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to send email' }
  }
}

/** @deprecated Use sendNutritionistDietPlanEmail */
export async function sendDietPlanReadyEmail(input: {
  to: string
  name: string
  nutritionistName: string
  planTitle: string
  downloadUrl: string
}): Promise<SendDietPlanEmailResult> {
  return sendNutritionistDietPlanEmail({
    to: input.to,
    name: input.name,
    nutritionistName: input.nutritionistName,
    planTitle: input.planTitle,
    downloadUrl: input.downloadUrl,
  })
}
