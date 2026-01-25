import twilio from 'twilio';
import type { Twilio } from 'twilio';

// Lazy initialization to avoid build-time errors
let twilioClient: Twilio | null = null;

function getTwilioClient(): { client: Twilio; fromNumber: string } | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return null;
  }

  if (!twilioClient) {
    twilioClient = twilio(accountSid, authToken);
  }

  return { client: twilioClient, fromNumber };
}

interface SendFormSMSParams {
  to: string;
  formType: string;
  projectName: string;
  signingUrl: string;
}

const FORM_TYPE_LABELS: Record<string, string> = {
  quote: 'הצעת מחיר',
  work_approval: 'הזמנת עבודה',
  completion: 'טופס הגשת עבודה',
  payment: 'אישור תשלום',
};

// Format Israeli phone to international format
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // If starts with 0, replace with +972
  if (digits.startsWith('0')) {
    return '+972' + digits.substring(1);
  }

  // If already has country code
  if (digits.startsWith('972')) {
    return '+' + digits;
  }

  // Otherwise assume Israeli number
  return '+972' + digits;
}

export async function sendFormSMS({
  to,
  formType,
  projectName,
  signingUrl,
}: SendFormSMSParams): Promise<{ success: boolean; error?: string }> {
  try {
    const twilioConfig = getTwilioClient();
    if (!twilioConfig) {
      console.error('Twilio credentials not configured');
      return { success: false, error: 'SMS service not configured' };
    }

    const { client, fromNumber } = twilioConfig;
    const formTypeName = FORM_TYPE_LABELS[formType] || formType;
    const formattedPhone = formatPhoneNumber(to);

    const message = `ProjectSign: מסמך ${formTypeName} עבור "${projectName}" ממתין לחתימתך.\n\nלחתימה לחץ כאן:\n${signingUrl}`;

    await client.messages.create({
      body: message,
      from: fromNumber,
      to: formattedPhone,
    });

    return { success: true };
  } catch (error) {
    console.error('SMS error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send SMS' };
  }
}
