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
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { FORM_TYPE_LABELS, QuoteData, UNIT_LABELS, FormType } from '@/types';

interface SignPageProps {
  params: Promise<{ token: string }>;
}

interface FormData {
  id: string;
  type: FormType;
  data: QuoteData;
  project_name: string;
  contact_name: string;
}

export default function SignPage({ params }: SignPageProps) {
  const { token } = use(params);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
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

  const quoteData = formData?.data;

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

        {/* Quote Content */}
        {formData?.type === 'quote' && quoteData && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">פרטי ההצעה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items */}
              <div className="space-y-2">
                {quoteData.items?.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} {UNIT_LABELS[item.unit] || item.unit} ×{' '}
                        {formatCurrency(item.unit_price)}
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
                  <span dir="ltr">{formatCurrency(quoteData.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>מע״מ:</span>
                  <span dir="ltr">{formatCurrency(quoteData.vat_amount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>סה״כ לתשלום:</span>
                  <span dir="ltr">{formatCurrency(quoteData.total)}</span>
                </div>
              </div>

              {/* Additional Info */}
              {quoteData.valid_until && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4">
                  <Calendar className="h-4 w-4" />
                  <span>תוקף ההצעה: {formatDate(quoteData.valid_until)}</span>
                </div>
              )}

              {quoteData.notes && (
                <div className="pt-4">
                  <p className="text-sm font-medium">הערות:</p>
                  <p className="text-sm text-muted-foreground">
                    {quoteData.notes}
                  </p>
                </div>
              )}

              {quoteData.payment_terms && (
                <div>
                  <p className="text-sm font-medium">תנאי תשלום:</p>
                  <p className="text-sm text-muted-foreground">
                    {quoteData.payment_terms}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
                בלחיצה על "חתום ואשר" אני מאשר/ת שקראתי את תוכן המסמך ומסכים/ה
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
