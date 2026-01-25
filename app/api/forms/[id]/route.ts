import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for form updates
const updateFormSchema = z.object({
  data: z.record(z.string(), z.unknown()).optional(),
});

// GET - Get single form with ownership verification
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form with project ownership verification
    const { data: form, error } = await supabase
      .from('forms')
      .select(`
        *,
        projects!inner (
          id,
          name,
          user_id,
          contacts (*)
        )
      `)
      .eq('id', id)
      .eq('projects.user_id', user.id)
      .single();

    if (error || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    return NextResponse.json(form);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update form (only if not signed)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing form with ownership check
    const { data: existingForm, error: fetchError } = await supabase
      .from('forms')
      .select(`
        *,
        projects!inner (
          id,
          user_id
        )
      `)
      .eq('id', id)
      .eq('projects.user_id', user.id)
      .single();

    if (fetchError || !existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Check if form is already signed
    if (existingForm.signed_at) {
      return NextResponse.json(
        { error: 'לא ניתן לערוך טופס שכבר נחתם' },
        { status: 400 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validation = updateFormSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Update form
    const { data: updatedForm, error: updateError } = await supabase
      .from('forms')
      .update({
        data: validation.data.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update form' }, { status: 500 });
    }

    return NextResponse.json(updatedForm);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete form (only if not signed)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing form with ownership check
    const { data: existingForm, error: fetchError } = await supabase
      .from('forms')
      .select(`
        *,
        projects!inner (
          id,
          user_id
        )
      `)
      .eq('id', id)
      .eq('projects.user_id', user.id)
      .single();

    if (fetchError || !existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Check if form is already signed
    if (existingForm.signed_at) {
      return NextResponse.json(
        { error: 'לא ניתן למחוק טופס שכבר נחתם' },
        { status: 400 }
      );
    }

    // Delete associated signing tokens first
    await supabase
      .from('signing_tokens')
      .delete()
      .eq('form_id', id);

    // Delete the form
    const { error: deleteError } = await supabase
      .from('forms')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete form' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
