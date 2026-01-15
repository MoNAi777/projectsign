'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { SignatureCanvas } from '@/components/signature/SignatureCanvas';
import { PageLoader, ButtonLoader } from '@/components/shared/LoadingSpinner';
import {
  FileSignature,
  AlertCircle,
  CheckCircle,
  Calendar,
  User,
  DollarSign,
  FileText,
  CreditCard,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  FORM_TYPE_LABELS,
  QuoteData,
  WorkApprovalData,
  CompletionData,
  PaymentData,
  UNIT_LABELS,
  PAYMENT_METHOD_LABELS,
  FormType,
} from '@/types';

interface SignPageProps {
  params: Promise<{ token: string }>;
}

interface FormDataResponse {
  id: string;
  type: FormType;
  data: QuoteData | WorkApprovalData | CompletionData | PaymentData;
  project_name: string;
  contact_name: string;
}

export default function SignPage({ params }: SignPageProps) {
  const { token } = use(params);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormDataResponse | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await fetch(`/api/sign/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'הקישור אינו תקף או שפג תוקפו');
          return;
        }

        setFormData(data);
      } catch {
        setError('אירעה שגיאה בטעינת המסמך');
      } finally {
        setIsLoading(false);
      }
    };

    fetchForm();
  }, [token]);

  const handleSubmit = async () => {
    if (!signerName.trim()) {
      setError('יש להזין את שמך');
      return;
    }

    if (!signatureData) {
      setError('יש לחתום על המסמך');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerName,
          signatureData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'אירעה שגיאה בשמירת החתימה');
        return;
      }

      setSuccess(true);
    } catch {
      setError('אירעה שגיאה, נסה שנית');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <PageLoader />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">המסמך נחתם בהצלחה!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              תודה רבה. החתימה שלך נשמרה במערכת.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !formData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle className="text-2xl">שגיאה</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render Quote Content
  const renderQuoteContent = (data: QuoteData) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          פרטי הצעת המחיר
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Items */}
        <div className="space-y-2">
          {data.items?.map((item, index) => (
            <div
              key={index}
              className="flex justify-between py-3 border-b last:border-0"
            >
              <div>
                <p className="font-medium">{item.description}</p>
                <p className="text-sm text-muted-foreground">
                  {item.quantity} {UNIT_LABELS[item.unit] || item.unit} × {formatCurrency(item.unit_price)}
                </p>
              </div>
              <p className="font-medium" dir="ltr">
                {formatCurrency(item.total)}
              </p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="pt-4 border-t space-y-2">
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
            <span dir="ltr" className="text-primary">{formatCurrency(data.total)}</span>
          </div>
        </div>

        {/* Additional Info */}
        {data.valid_until && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4">
            <Calendar className="h-4 w-4" />
            <span>תוקף ההצעה: {formatDate(data.valid_until)}</span>
          </div>
        )}

        {data.notes && (
          <div className="pt-2">
            <p className="text-sm font-medium">הערות:</p>
            <p className="text-sm text-muted-foreground">{data.notes}</p>
          </div>
        )}

        {data.payment_terms && (
          <div>
            <p className="text-sm font-medium">תנאי תשלום:</p>
            <p className="text-sm text-muted-foreground">{data.payment_terms}</p>
          </div>
        )}

        {data.warranty_terms && (
          <div>
            <p className="text-sm font-medium">תנאי אחריות:</p>
            <p className="text-sm text-muted-foreground">{data.warranty_terms}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render Work Approval Content
  const renderWorkApprovalContent = (data: WorkApprovalData) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          פרטי אישור העבודה
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">סכום מאושר:</span>
            <span className="font-bold text-lg" dir="ltr">{formatCurrency(data.approved_amount)}</span>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">תאריך התחלה:</span>
            <span className="font-medium">{formatDate(data.start_date)}</span>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">תאריך סיום משוער:</span>
            <span className="font-medium">{formatDate(data.estimated_end_date)}</span>
          </div>

          {data.deposit_required && (
            <>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">מקדמה נדרשת:</span>
                <span className="font-medium" dir="ltr">{formatCurrency(data.deposit_amount)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">סטטוס מקדמה:</span>
                <span className={`font-medium ${data.deposit_paid ? 'text-green-600' : 'text-yellow-600'}`}>
                  {data.deposit_paid ? 'שולמה' : 'טרם שולמה'}
                </span>
              </div>
            </>
          )}
        </div>

        {data.special_conditions && (
          <div className="pt-4">
            <p className="text-sm font-medium">תנאים מיוחדים:</p>
            <p className="text-sm text-muted-foreground">{data.special_conditions}</p>
          </div>
        )}

        <div className="pt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm">
            בחתימתי על מסמך זה אני מאשר/ת את תחילת העבודה בהתאם לתנאים שנקבעו בהצעת המחיר.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  // Render Completion Content
  const renderCompletionContent = (data: CompletionData) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          פרטי סיום העבודה
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">תאריך סיום:</span>
            <span className="font-medium">{formatDate(data.actual_completion_date)}</span>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">תאריך תחילת אחריות:</span>
            <span className="font-medium">{formatDate(data.warranty_start_date)}</span>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">סכום סופי:</span>
            <span className="font-bold text-lg text-primary" dir="ltr">{formatCurrency(data.final_amount)}</span>
          </div>

          {data.additional_charges > 0 && (
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">חיובים נוספים:</span>
              <span className="font-medium" dir="ltr">{formatCurrency(data.additional_charges)}</span>
            </div>
          )}
        </div>

        <div className="pt-4">
          <p className="text-sm font-medium">סיכום העבודה:</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.work_summary}</p>
        </div>

        {data.deviations_from_quote && (
          <div>
            <p className="text-sm font-medium">סטיות מהצעת המחיר:</p>
            <p className="text-sm text-muted-foreground">{data.deviations_from_quote}</p>
          </div>
        )}

        {data.additional_charges_reason && (
          <div>
            <p className="text-sm font-medium">סיבת חיובים נוספים:</p>
            <p className="text-sm text-muted-foreground">{data.additional_charges_reason}</p>
          </div>
        )}

        {data.client_notes && (
          <div>
            <p className="text-sm font-medium">הערות:</p>
            <p className="text-sm text-muted-foreground">{data.client_notes}</p>
          </div>
        )}

        <div className="pt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm">
            בחתימתי על מסמך זה אני מאשר/ת את סיום העבודה ואת הסכום הסופי לתשלום.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  // Render Payment Content
  const renderPaymentContent = (data: PaymentData) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          פרטי התשלום
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
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
          <div className="pt-4">
            <p className="text-sm font-medium">הערות:</p>
            <p className="text-sm text-muted-foreground">{data.notes}</p>
          </div>
        )}

        <div className="pt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm">
            בחתימתי על מסמך זה אני מאשר/ת את קבלת התשלום.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  // Render form content based on type
  const renderFormContent = () => {
    if (!formData) return null;

    switch (formData.type) {
      case 'quote':
        return renderQuoteContent(formData.data as QuoteData);
      case 'work_approval':
        return renderWorkApprovalContent(formData.data as WorkApprovalData);
      case 'completion':
        return renderCompletionContent(formData.data as CompletionData);
      case 'payment':
        return renderPaymentContent(formData.data as PaymentData);
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-muted/50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <FileSignature className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">ProjectSign</span>
          </div>
          <p className="text-muted-foreground">חתימה דיגיטלית</p>
        </div>

        {/* Document Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{FORM_TYPE_LABELS[formData!.type]}</CardTitle>
              <span className="text-sm text-muted-foreground">
                {formData?.project_name}
              </span>
            </div>
          </CardHeader>
        </Card>

        {/* Form Content - Rendered based on type */}
        {renderFormContent()}

        {/* Signature Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">חתימה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="signerName">שם מלא</Label>
              <div className="relative">
                <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signerName"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="הכנס את שמך המלא"
                  className="pr-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>חתימה</Label>
              <SignatureCanvas
                onSave={setSignatureData}
                onClear={() => setSignatureData(null)}
                disabled={isSubmitting}
              />
            </div>

            <div className="pt-4">
              <p className="text-xs text-muted-foreground mb-4">
                בלחיצה על &quot;חתום ואשר&quot; אני מאשר/ת שקראתי את תוכן המסמך ומסכים/ה
                לתנאים המפורטים בו.
              </p>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !signerName || !signatureData}
                className="w-full"
                size="lg"
              >
                {isSubmitting && <ButtonLoader />}
                חתום ואשר
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
