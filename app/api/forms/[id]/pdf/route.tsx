import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { FormType, QuoteData, WorkApprovalData, CompletionData, PaymentData } from '@/types';

// Increase function timeout for PDF generation
export const maxDuration = 60;

// Force Node.js runtime for PDF generation
export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: formId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form with project verification
    const { data: form, error: formError } = await supabase
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
      .eq('id', formId)
      .eq('projects.user_id', user.id)
      .single();

    if (formError || !form) {
      console.error('Form fetch error:', formError);
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const contact = form.projects?.contacts;
    const contactName = Array.isArray(contact) ? contact[0]?.name : contact?.name;

    // Pre-fetch signature image as data URL for reliable PDF embedding
    let signatureDataUrl: string | undefined;
    if (form.signature_url) {
      try {
        const imgResponse = await fetch(form.signature_url);
        if (imgResponse.ok) {
          const imgBuffer = await imgResponse.arrayBuffer();
          const base64 = Buffer.from(imgBuffer).toString('base64');
          const contentType = imgResponse.headers.get('content-type') || 'image/png';
          signatureDataUrl = `data:${contentType};base64,${base64}`;
        }
      } catch (e) {
        console.error('Failed to fetch signature image:', e);
      }
    }

    // Dynamic import to avoid issues with serverless cold starts
    let renderToBuffer;
    let getFormPDFTemplate;

    try {
      const pdfRenderer = await import('@react-pdf/renderer');
      renderToBuffer = pdfRenderer.renderToBuffer;
      console.log('PDF renderer loaded successfully');
    } catch (importError) {
      console.error('Failed to import @react-pdf/renderer:', importError);
      throw new Error('PDF renderer module failed to load');
    }

    try {
      const templates = await import('@/lib/pdf/templates');
      getFormPDFTemplate = templates.getFormPDFTemplate;
      console.log('PDF templates loaded successfully');
    } catch (importError) {
      console.error('Failed to import pdf templates:', importError);
      throw new Error('PDF templates module failed to load');
    }

    // Generate PDF
    console.log('Generating PDF for form type:', form.type);
    console.log('Form data:', JSON.stringify(form.data, null, 2));

    let pdfDocument;
    try {
      pdfDocument = getFormPDFTemplate(
        form.type as FormType,
        form.data as QuoteData | WorkApprovalData | CompletionData | PaymentData,
        form.projects?.name || 'Unknown Project',
        contactName,
        form.signed_at,
        form.signed_by,
        signatureDataUrl || form.signature_url
      );
      console.log('PDF document created successfully');
    } catch (templateError) {
      console.error('Failed to create PDF template:', templateError);
      throw new Error(`PDF template creation failed: ${templateError instanceof Error ? templateError.message : 'Unknown error'}`);
    }

    console.log('Rendering PDF to buffer...');
    let pdfBuffer;
    try {
      pdfBuffer = await renderToBuffer(pdfDocument);
      console.log('PDF rendered, size:', pdfBuffer.length);
    } catch (renderError) {
      console.error('Failed to render PDF:', renderError);
      throw new Error(`PDF rendering failed: ${renderError instanceof Error ? renderError.message : 'Unknown error'}`);
    }

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(pdfBuffer);

    // Create filename
    const formTypeNames: Record<string, string> = {
      quote: 'quote',
      work_approval: 'work-approval',
      completion: 'completion',
      payment: 'payment',
    };
    const fileName = `${formTypeNames[form.type] || form.type}-${form.projects?.name || 'form'}.pdf`;

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to generate PDF: ${errorMessage}` }, { status: 500 });
  }
}
