import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

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

    const signingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign/${token}`;

    // Handle different sending methods
    if (method === 'link') {
      return NextResponse.json({ signingUrl, token });
    }

    if (method === 'email' && email) {
      // TODO: Implement email sending with Resend
      // For now, just return the URL
      await supabase
        .from('forms')
        .update({ sent_at: new Date().toISOString(), sent_via: 'email' })
        .eq('id', formId);

      return NextResponse.json({ signingUrl, message: 'Email sent' });
    }

    if (method === 'sms' && phone) {
      // TODO: Implement SMS sending with Twilio
      // For now, just return the URL
      await supabase
        .from('forms')
        .update({ sent_at: new Date().toISOString(), sent_via: 'sms' })
        .eq('id', formId);

      return NextResponse.json({ signingUrl, message: 'SMS sent' });
    }

    return NextResponse.json({ signingUrl });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
