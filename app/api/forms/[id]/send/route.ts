import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { sendFormEmail } from '@/lib/email';
import { sendFormSMS } from '@/lib/sms';

const SIGNING_TOKEN_EXPIRY_HOURS = 48;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: formId } = await params;
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify form belongs to user
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select(`
        *,
        projects!inner (
          id,
          user_id,
          name,
          contacts (*)
        )
      `)
      .eq('id', formId)
      .single();

    if (formError || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (form.projects.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { method, email, phone } = body;

    // Generate signing token
    const token = randomUUID();
    const expiresAt = new Date(
      Date.now() + SIGNING_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
    );

    // Insert token using admin client (bypasses RLS)
    const { error: tokenError } = await adminClient
      .from('signing_tokens')
      .insert({
        form_id: formId,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('Error creating token:', tokenError);
      return NextResponse.json({ error: 'Failed to create signing token' }, { status: 500 });
    }

    // Get the base URL - use environment variable or construct from request headers
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ||
      `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}`).trim();
    const signingUrl = `${baseUrl}/sign/${token}`.replace(/\s+/g, '');

    // Handle different sending methods
    if (method === 'link') {
      return NextResponse.json({ signingUrl, token });
    }

    if (method === 'email' && email) {
      // Get contact name for email greeting
      const contacts = form.projects?.contacts;
      const contact = Array.isArray(contacts) ? contacts[0] : contacts;
      const contactName = contact?.name;

      // Send email via Resend
      const emailResult = await sendFormEmail({
        to: email,
        formType: form.type,
        projectName: form.projects?.name || 'פרויקט',
        signingUrl,
        contactName,
      });

      if (!emailResult.success) {
        console.error('Email send failed:', emailResult.error);
        return NextResponse.json(
          { error: 'Failed to send email', signingUrl },
          { status: 500 }
        );
      }

      await supabase
        .from('forms')
        .update({ sent_at: new Date().toISOString(), sent_via: 'email' })
        .eq('id', formId);

      return NextResponse.json({ signingUrl, message: 'Email sent successfully' });
    }

    if (method === 'sms' && phone) {
      // Send SMS via Twilio
      const smsResult = await sendFormSMS({
        to: phone,
        formType: form.type,
        projectName: form.projects?.name || 'פרויקט',
        signingUrl,
      });

      if (!smsResult.success) {
        console.error('SMS send failed:', smsResult.error);
        return NextResponse.json(
          { error: 'Failed to send SMS', signingUrl },
          { status: 500 }
        );
      }

      await supabase
        .from('forms')
        .update({ sent_at: new Date().toISOString(), sent_via: 'sms' })
        .eq('id', formId);

      return NextResponse.json({ signingUrl, message: 'SMS sent successfully' });
    }

    return NextResponse.json({ signingUrl });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
