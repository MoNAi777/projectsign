import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormTypeBadge } from '@/components/shared/StatusBadge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import {
  ArrowRight,
  Edit,
  Send,
  Download,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { FormType, FORM_TYPE_LABELS, QuoteData, UNIT_LABELS } from '@/types';
import { SendFormButton } from '@/components/forms/SendFormButton';

interface FormPageProps {
  params: Promise<{ id: string; formId: string }>;
}

async function getForm(formId: string) {
  const supabase = await createClient();

  const { data: form, error } = await supabase
    .from('forms')
    .select(`
      *,
      projects (
        id,
        name,
        contacts (*)
      )
    `)
    .eq('id', formId)
    .single();

  if (error || !form) {
    return null;
  }

  return form;
}

export default async function FormPage({ params }: FormPageProps) {
  const { id: projectId, formId } = await params;
  const form = await getForm(formId);

  if (!form) {
    notFound();
  }

  const data = form.data as QuoteData;
  const contact = form.projects?.contacts;

  return (
    <div className="space-y-8">
      <PageHeader
        title={FORM_TYPE_LABELS[form.type as FormType]}
        description={form.projects?.name}
        actions={
          <div className="flex items-center gap-2">
            <FormTypeBadge type={form.type as FormType} />
            {form.signed_at && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">נחתם</span>
              </div>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quote Content */}
          {form.type === 'quote' && data && (
            <Card>
              <CardHeader>
                <CardTitle>פריטים</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                    <div className="col-span-5">תיאור</div>
                    <div className="col-span-2 text-center">כמות</div>
                    <div className="col-span-2 text-center">יחידה</div>
                    <div className="col-span-1 text-left">מחיר</div>
                    <div className="col-span-2 text-left">סה״כ</div>
                  </div>

                  {/* Items */}
                  {data.items?.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-4 text-sm py-2 border-b last:border-0"
                    >
                      <div className="col-span-5">{item.description}</div>
                      <div className="col-span-2 text-center">
                        {item.quantity}
                      </div>
                      <div className="col-span-2 text-center">
                        {UNIT_LABELS[item.unit] || item.unit}
                      </div>
                      <div className="col-span-1 text-left" dir="ltr">
                        {formatCurrency(item.unit_price)}
                      </div>
                      <div className="col-span-2 text-left font-medium" dir="ltr">
                        {formatCurrency(item.total)}
                      </div>
                    </div>
                  ))}

                  {/* Totals */}
                  <div className="pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>סה״כ לפני מע״מ:</span>
                      <span dir="ltr">{formatCurrency(data.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>מע״מ ({(data.vat_rate * 100).toFixed(0)}%):</span>
                      <span dir="ltr">{formatCurrency(data.vat_amount)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>סה״כ לתשלום:</span>
                      <span dir="ltr">{formatCurrency(data.total)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Info */}
          {form.type === 'quote' && data && (
            <Card>
              <CardHeader>
                <CardTitle>פרטים נוספים</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.valid_until && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>תוקף ההצעה: {formatDate(data.valid_until)}</span>
                  </div>
                )}
                {data.payment_terms && (
                  <div>
                    <p className="text-sm font-medium mb-1">תנאי תשלום:</p>
                    <p className="text-muted-foreground">{data.payment_terms}</p>
                  </div>
                )}
                {data.notes && (
                  <div>
                    <p className="text-sm font-medium mb-1">הערות:</p>
                    <p className="text-muted-foreground">{data.notes}</p>
                  </div>
                )}
                {data.warranty_terms && (
                  <div>
                    <p className="text-sm font-medium mb-1">תנאי אחריות:</p>
                    <p className="text-muted-foreground">{data.warranty_terms}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Signature */}
          {form.signed_at && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  חתימה
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.signature_url && (
                  <div className="border rounded-lg p-4 bg-white">
                    <img
                      src={form.signature_url}
                      alt="חתימה"
                      className="max-h-24"
                    />
                  </div>
                )}
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>נחתם על ידי: {form.signed_by}</p>
                  <p>בתאריך: {formatDate(form.signed_at)}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">פעולות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!form.signed_at && (
                <>
                  <Button className="w-full" variant="outline" asChild>
                    <Link href={`/projects/${projectId}/forms/${formId}/edit`}>
                      <Edit className="h-4 w-4 ml-2" />
                      עריכה
                    </Link>
                  </Button>
                  <SendFormButton
                    formId={formId}
                    contactEmail={contact?.email}
                    contactPhone={contact?.phone}
                  />
                </>
              )}
              <Button className="w-full" variant="outline">
                <Download className="h-4 w-4 ml-2" />
                הורד PDF
              </Button>
            </CardContent>
          </Card>

          {/* Contact */}
          {contact && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">פרטי לקוח</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="font-medium">{contact.name}</p>
                {contact.phone && <p dir="ltr">{contact.phone}</p>}
                {contact.email && <p dir="ltr">{contact.email}</p>}
              </CardContent>
            </Card>
          )}

          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">מידע</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1 text-muted-foreground">
              <p>נוצר: {formatDate(form.created_at)}</p>
              <p>עודכן: {formatDate(form.updated_at)}</p>
              {form.sent_at && <p>נשלח: {formatDate(form.sent_at)}</p>}
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full" asChild>
            <Link href={`/projects/${projectId}`}>
              <ArrowRight className="h-4 w-4 ml-2" />
              חזרה לפרויקט
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
