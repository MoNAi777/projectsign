import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { z } from 'zod';

// Validation schema for ratings (completion forms)
const ratingsSchema = z.object({
  satisfaction_overall: z.number().min(1).max(5),
  satisfaction_site_conduct: z.number().min(1).max(5),
  satisfaction_work_quality: z.number().min(1).max(5),
  satisfaction_appearance: z.number().min(1).max(5),
  satisfaction_worker_behavior: z.number().min(1).max(5),
}).optional();

// Validation schema for signature submission
const signatureSchema = z.object({
  signerName: z.string().min(2, 'Name too short').max(100, 'Name too long'),
  signatureData: z.string().min(100, 'Invalid signature').startsWith('data:image/', 'Invalid signature format'),
  ratings: ratingsSchema,
  feedbackNotes: z.string().max(1000).optional(),
});

// GET - Validate token and return form data
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const adminClient = createAdminClient();

    // Find valid token
    const { data: tokenData, error: tokenError } = await adminClient
      .from('signing_tokens')
      .select(`
        *,
        forms (
          *,
          projects (
            name,
            contacts (name)
          )
        )
      `)
      .eq('token', token)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'הקישור אינו תקף או שפג תוקפו' },
        { status: 404 }
      );
    }

    const form = tokenData.forms;

    // Handle contacts being an array
    const contacts = form.projects?.contacts;
    const contactName = Array.isArray(contacts) ? contacts[0]?.name : contacts?.name;

    return NextResponse.json({
      id: form.id,
      type: form.type,
      data: form.data,
      project_name: form.projects?.name || '',
      contact_name: contactName || '',
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Submit signature
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const adminClient = createAdminClient();

    // Get client IP and user agent
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Find valid token
    const { data: tokenData, error: tokenError } = await adminClient
      .from('signing_tokens')
      .select('*, forms (*)')
      .eq('token', token)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'הקישור אינו תקף או שפג תוקפו' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = signatureSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { signerName, signatureData, ratings, feedbackNotes } = validation.data;

    const form = tokenData.forms;
    const formId = form.id;

    // If completion form and ratings provided, merge them into form data
    let updatedFormData = form.data;
    if (form.type === 'completion' && ratings) {
      updatedFormData = {
        ...form.data,
        ...ratings,
        feedback_notes: feedbackNotes || form.data.feedback_notes || '',
      };
    }

    // Create hash of form data for integrity
    const formDataJson = JSON.stringify(updatedFormData, Object.keys(updatedFormData).sort());
    const signatureHash = createHash('sha256').update(formDataJson).digest('hex');

    // Upload signature image to Supabase Storage
    const base64Data = signatureData.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `${formId}/${Date.now()}.png`;

    const { error: uploadError } = await adminClient.storage
      .from('signatures')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload signature' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = adminClient.storage
      .from('signatures')
      .getPublicUrl(fileName);

    const signatureUrl = urlData.publicUrl;

    // Update form with signature and potentially updated data (for completion forms with ratings)
    const updatePayload: Record<string, unknown> = {
      signature_url: signatureUrl,
      signature_hash: signatureHash,
      signed_at: new Date().toISOString(),
      signed_by: signerName,
      signer_ip: ip,
      signer_user_agent: userAgent,
    };

    // Include updated form data if ratings were submitted
    if (form.type === 'completion' && ratings) {
      updatePayload.data = updatedFormData;
    }

    const { error: updateError } = await adminClient
      .from('forms')
      .update(updatePayload)
      .eq('id', formId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to save signature' },
        { status: 500 }
      );
    }

    // Mark token as used
    await adminClient
      .from('signing_tokens')
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
        used_ip: ip,
        used_user_agent: userAgent,
      })
      .eq('id', tokenData.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
