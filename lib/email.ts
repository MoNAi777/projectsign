import { Resend } from 'resend';

// Lazy initialization to avoid build-time errors
let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

interface SendFormEmailParams {
  to: string;
  formType: string;
  projectName: string;
  signingUrl: string;
  contactName?: string;
}

const FORM_TYPE_LABELS: Record<string, string> = {
  quote: 'הצעת מחיר',
  work_approval: 'הזמנת עבודה',
  completion: 'טופס הגשת עבודה',
  payment: 'אישור תשלום',
};

export async function sendFormEmail({
  to,
  formType,
  projectName,
  signingUrl,
  contactName,
}: SendFormEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getResendClient();
    if (!client) {
      console.error('RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const formTypeName = FORM_TYPE_LABELS[formType] || formType;
    const greeting = contactName ? `שלום ${contactName},` : 'שלום,';

    const { data, error } = await client.emails.send({
      from: process.env.EMAIL_FROM || 'ProjectSign <noreply@projectsign.co.il>',
      to: [to],
      subject: `${formTypeName} - ${projectName} | דרוש חתימתך`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; direction: rtl; text-align: right; background-color: #f5f5f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">ProjectSign</h1>
              <p style="color: #666; font-size: 14px;">חתימה דיגיטלית</p>
            </div>

            <p style="font-size: 16px; color: #333;">${greeting}</p>

            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              מצורף קישור לחתימה על <strong>${formTypeName}</strong> עבור פרויקט <strong>${projectName}</strong>.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${signingUrl}"
                 style="display: inline-block; background-color: #0066cc; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                לחתימה על המסמך
              </a>
            </div>

            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              הקישור תקף ל-48 שעות. אם הקישור פג תוקף, אנא פנה למשרד לקבלת קישור חדש.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="font-size: 12px; color: #999; text-align: center;">
              הודעה זו נשלחה באמצעות מערכת ProjectSign.<br>
              אם לא ביקשת מסמך זה, אנא התעלם מהודעה זו.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}
