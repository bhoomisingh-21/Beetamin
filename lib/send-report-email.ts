import { Resend } from 'resend'

export type SendRecoveryReportEmailResult =
  | { ok: true; id?: string }
  | { ok: false; error: string }

export async function sendRecoveryReportEmail(input: {
  to: string
  name: string
  reportId: string
  signedDownloadUrl: string
  pdfBuffer: Buffer
}): Promise<SendRecoveryReportEmailResult> {
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

  const resend = new Resend(apiKey)
  const filename = `Beetamin-Recovery-Plan-${input.reportId}.pdf`

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      replyTo,
      subject: 'Your Personalised Recovery Plan is Ready ✓ — The Beetamin',
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
                Your personalised deficiency recovery report prepared by <strong>Dr. Priya Sharma</strong> is ready.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                <tr>
                  <td style="background:#1a472a;border-radius:8px;text-align:center;">
                    <a href="${input.signedDownloadUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-weight:bold;font-size:14px;text-decoration:none;">
                      Download Your Report
                    </a>
                  </td>
                </tr>
              </table>
              <div style="background:#ecfdf5;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:20px;">
                <p style="margin:0 0 10px;font-size:12px;font-weight:bold;color:#166534;">Your report includes</p>
                <ul style="margin:0;padding-left:18px;color:#334155;font-size:13px;line-height:1.7;">
                  <li>Your deficiency analysis</li>
                  <li>7-day personalised meal plan</li>
                  <li>Safe supplement recommendations</li>
                  <li>Your daily recovery routine</li>
                </ul>
              </div>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#334155;">
                Your report is also <strong>attached to this email</strong> as a PDF.
              </p>
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
      attachments: [
        {
          filename,
          content: input.pdfBuffer.toString('base64'),
        },
      ],
    })

    if (error) {
      console.error('[sendRecoveryReportEmail]', error)
      return { ok: false, error: error.message || 'Failed to send email' }
    }
    return { ok: true, id: data?.id }
  } catch (e) {
    console.error('[sendRecoveryReportEmail]', e)
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to send email' }
  }
}
