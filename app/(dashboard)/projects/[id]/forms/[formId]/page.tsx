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
  CheckCircle,
  Calendar,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { FormType, FORM_TYPE_LABELS, QuoteData, WorkApprovalData, CompletionData, PaymentData, UNIT_LABELS, PAYMENT_METHOD_LABELS } from '@/types';
import { SendFormButton } from '@/components/forms/SendFormButton';
import { FormActions } from '@/components/forms/FormActions';
import { DownloadPDFButton } from '@/components/forms/DownloadPDFButton';

interface FormPageProps {
  params: Promise<{ id: string; formId: string }>;
}

async function getForm(formId: string) {
  const supabase = await createClient();

  // Get current user for ownership verification
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
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
    .eq('id', formId)
    .eq('projects.user_id', user.id)
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

  const contacts = form.projects?.contacts;
  const contact = Array.isArray(contacts) ? contacts[0] : contacts;

  // Helper function to render stars
  const renderStars = (rating: number) => {
    return (
      <span className="inline-flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}
          >
            ★
          </span>
        ))}
      </span>
    );
  };

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

      {/* Mobile Actions - shown only on mobile, above content */}
      <div className="lg:hidden">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap gap-2">
              <FormActions
                formId={formId}
                projectId={projectId}
                isSigned={!!form.signed_at}
                formType={form.type}
              />
              {!form.signed_at && (
                <SendFormButton
                  formId={formId}
                  contactEmail={contact?.email}
                  contactPhone={contact?.phone}
                />
              )}
              <DownloadPDFButton formId={formId} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quote Content */}
          {form.type === 'quote' && (() => {
            const data = form.data as QuoteData;
            return (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>פריטים</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Items - mobile friendly stacked layout */}
                      <div className="space-y-3">
                        {data.items?.map((item, index) => (
                          <div
                            key={index}
                            className="p-3 rounded-lg border bg-muted/30"
                          >
                            <p className="font-medium mb-2">{item.description}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                              <span>כמות: {item.quantity} {UNIT_LABELS[item.unit] || item.unit}</span>
                              <span dir="ltr">מחיר: {formatCurrency(item.unit_price)}</span>
                            </div>
                            <div className="mt-1 text-left font-semibold" dir="ltr">
                              {formatCurrency(item.total)}
                            </div>
                          </div>
                        ))}
                      </div>

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
              </>
            );
          })()}

          {/* Work Approval Content */}
          {form.type === 'work_approval' && (() => {
            const data = form.data as WorkApprovalData;
            return (
              <>
                <Card className="border-primary/50 bg-primary/5">
                  <CardContent className="pt-6">
                    <p className="text-sm leading-relaxed">
                      אני הח״מ מאשר/ת כי עברתי עם המבצע על כל הצרכים, הדרישות והיקף העבודה,
                      וקיבלתי הסבר מלא בנוגע לתשתיות הקיימות באתר.
                    </p>
                    <p className="text-sm font-medium mt-2 text-primary">
                      הובהר לי כי האחריות על מסירת מידע מלא ומדויק בנוגע לתשתיות קיימות חלה עליי.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>פרטי הזמנת העבודה</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">שם האתר / כתובת:</span>
                        <span className="font-medium">{data.site_name}</span>
                      </div>
                      {data.quote_reference && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">הצעת מחיר:</span>
                          <span className="font-medium">{data.quote_reference}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">תאריך תחילת ביצוע:</span>
                        <span className="font-medium">{formatDate(data.start_date)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">איש קשר:</span>
                        <span className="font-medium">{data.contact_name}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">טלפון:</span>
                        <span className="font-medium" dir="ltr">{data.contact_phone}</span>
                      </div>
                    </div>
                    <div className="pt-2">
                      <p className="text-sm font-medium mb-1">פירוט העבודה:</p>
                      <p className="text-muted-foreground whitespace-pre-wrap">{data.work_details}</p>
                    </div>
                    {data.notes && (
                      <div>
                        <p className="text-sm font-medium mb-1">הערות:</p>
                        <p className="text-muted-foreground">{data.notes}</p>
                      </div>
                    )}
                    {data.additions && (
                      <div>
                        <p className="text-sm font-medium mb-1">תוספות:</p>
                        <p className="text-muted-foreground">{data.additions}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            );
          })()}

          {/* Completion Content */}
          {form.type === 'completion' && (() => {
            const data = form.data as CompletionData;
            return (
              <>
                {/* Company Header */}
                <Card className="border-primary">
                  <CardContent className="pt-6 text-center">
                    <h2 className="text-2xl font-bold text-primary">Daniel – Cut & Drill</h2>
                    <p className="text-muted-foreground mt-1">עיצובים מיוחדים באבן וקרמיקה | 054-7980580</p>
                    <Separator className="my-4" />
                    <h3 className="text-lg font-semibold">טופס הגשת עבודה ושביעות רצון לקוח</h3>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>פרטי ההזמנה</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">שם אתר / כתובת:</span>
                        <span className="font-medium">{data.site_name}</span>
                      </div>
                      {data.order_number && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">מס׳ הזמנה (אם קיים):</span>
                          <span className="font-medium">{data.order_number}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">תאריך ביצוע העבודה:</span>
                        <span className="font-medium">{formatDate(data.work_date)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-green-800">הצהרת הלקוח</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-green-800">
                      אני החתום/ה מטה מאשר/ת כי העבודה בוצעה והוגשה בהתאם להזמנה, להסכמות ולתנאי האתר,
                      ונמסרה לשביעות רצוני המלאה במועד סיום העבודה.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>דירוג שביעות רצון</CardTitle>
                    <p className="text-sm text-muted-foreground">1 = לא מרוצה כלל | 5 = מרוצה מאוד</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm">שביעות רצון כללית</span>
                        {renderStars(data.satisfaction_overall)}
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm">התנהלות באתר העבודה</span>
                        {renderStars(data.satisfaction_site_conduct)}
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm">איכות ביצוע העבודה</span>
                        {renderStars(data.satisfaction_work_quality)}
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm">נראות וגימור העבודה</span>
                        {renderStars(data.satisfaction_appearance)}
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm">התנהגות איש הביצוע</span>
                        {renderStars(data.satisfaction_worker_behavior)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {data.feedback_notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle>הערות / משוב</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground whitespace-pre-wrap">{data.feedback_notes}</p>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-amber-200">
                  <CardHeader>
                    <CardTitle className="text-amber-800">סעיף הגנה והיעדר טענות עתידיות</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      הלקוח מצהיר כי בדק את העבודה במועד מסירתה, כי לא נמצאו ליקויים גלויים לעין,
                      וכי ידוע לו שמדובר בעבודות באבן, קרמיקה, שיש ופורצלן אשר מטבעם עלולים לכלול
                      שברים נסתרים, מאמצים פנימיים או רגישויות חומריות שאינן ניתנות לזיהוי מראש.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      לאחר חתימה על טופס זה, הלקוח מוותר על כל טענה, דרישה או תביעה עתידית בגין
                      סדקים, שברים או נזקים הנובעים מתכונות החומר, תשתיות קיימות, עבודות קודמות,
                      התקנה או שימוש שבוצעו על ידי צד ג׳.
                    </p>
                    <p className="text-sm font-medium text-amber-800">
                      אחריות החברה חלה אך ורק על ביצוע העבודה כפי שנמסרה במועד סיומה.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-blue-800">אישור הלקוח</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-blue-800">
                      אני מאשר/ת כי קראתי, הבנתי והסכמתי לכל האמור לעיל, וכי אין לי ולא יהיו לי טענות נוספות לאחר מועד החתימה.
                    </p>
                  </CardContent>
                </Card>
              </>
            );
          })()}

          {/* Payment Content */}
          {form.type === 'payment' && (() => {
            const data = form.data as PaymentData;
            return (
              <Card>
                <CardHeader>
                  <CardTitle>פרטי התשלום</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">סכום לתשלום:</span>
                      <span className="font-medium" dir="ltr">{formatCurrency(data.amount_due)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">סכום ששולם:</span>
                      <span className="font-bold text-lg text-green-600" dir="ltr">{formatCurrency(data.amount_paid)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">יתרה:</span>
                      <span className={`font-medium ${data.remaining_balance > 0 ? 'text-yellow-600' : 'text-green-600'}`} dir="ltr">
                        {formatCurrency(data.remaining_balance)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">אמצעי תשלום:</span>
                      <span className="font-medium">{PAYMENT_METHOD_LABELS[data.payment_method]}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">תאריך תשלום:</span>
                      <span className="font-medium">{formatDate(data.paid_at)}</span>
                    </div>
                    {data.reference_number && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">מספר אסמכתא:</span>
                        <span className="font-medium" dir="ltr">{data.reference_number}</span>
                      </div>
                    )}
                    {data.receipt_number && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">מספר קבלה:</span>
                        <span className="font-medium" dir="ltr">{data.receipt_number}</span>
                      </div>
                    )}
                  </div>
                  {data.notes && (
                    <div className="pt-2">
                      <p className="text-sm font-medium mb-1">הערות:</p>
                      <p className="text-muted-foreground">{data.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

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
          {/* Actions - hidden on mobile (shown above content instead) */}
          <Card className="hidden lg:block">
            <CardHeader>
              <CardTitle className="text-base">פעולות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <FormActions
                formId={formId}
                projectId={projectId}
                isSigned={!!form.signed_at}
                formType={form.type}
              />
              {!form.signed_at && (
                <SendFormButton
                  formId={formId}
                  contactEmail={contact?.email}
                  contactPhone={contact?.phone}
                />
              )}
              <DownloadPDFButton formId={formId} />
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
