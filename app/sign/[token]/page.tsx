'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  ExternalLink,
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
  const [isPWA, setIsPWA] = useState(false);

  // Star ratings state for completion forms
  const [ratings, setRatings] = useState({
    satisfaction_overall: 5,
    satisfaction_site_conduct: 5,
    satisfaction_work_quality: 5,
    satisfaction_appearance: 5,
    satisfaction_worker_behavior: 5,
  });
  const [feedbackNotes, setFeedbackNotes] = useState('');

  // Detect if running in PWA/standalone mode
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      setIsPWA(true);
    }
  }, []);

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
      // Include ratings if this is a completion form
      const submitData: Record<string, unknown> = {
        signerName,
        signatureData,
      };

      if (formData?.type === 'completion') {
        submitData.ratings = ratings;
        submitData.feedbackNotes = feedbackNotes;
      }

      const response = await fetch(`/api/sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
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

  // Show message if opened in PWA mode
  if (isPWA) {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <ExternalLink className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-2xl">פתח בדפדפן</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              כדי לחתום על המסמך, יש לפתוח את הקישור בדפדפן רגיל.
            </p>
            <Button
              onClick={() => {
                // Try to open in external browser
                window.open(currentUrl, '_system');
              }}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 ml-2" />
              פתח בדפדפן
            </Button>
            <p className="text-xs text-muted-foreground">
              או העתק את הקישור ופתח אותו בדפדפן Chrome/Safari
            </p>
          </CardContent>
        </Card>
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
    <>
      {/* Declaration Banner */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="pt-6">
          <p className="text-sm leading-relaxed">
            אני הח״מ מאשר/ת כי עברתי עם המבצע על כל הצרכים, הדרישות והיקף העבודה,
            וקיבלתי הסבר מלא בנוגע לתשתיות הקיימות באתר, לרבות נקודות רגישות, סיכונים אפשריים
            והנחיות שיש לדעת לפני תחילת הקידוח ו/או ביצוע העבודה.
          </p>
          <p className="text-sm font-medium mt-2 text-primary">
            הובהר לי כי האחריות על מסירת מידע מלא ומדויק בנוגע לתשתיות קיימות חלה עליי.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            פרטי הזמנת העבודה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
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

          <div className="pt-4">
            <p className="text-sm font-medium">פירוט העבודה:</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.work_details}</p>
          </div>

          {data.notes && (
            <div>
              <p className="text-sm font-medium">הערות:</p>
              <p className="text-sm text-muted-foreground">{data.notes}</p>
            </div>
          )}

          {data.additions && (
            <div>
              <p className="text-sm font-medium">תוספות:</p>
              <p className="text-sm text-muted-foreground">{data.additions}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );

  // Helper for rendering static stars (for display)
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  // Interactive star rating component
  const InteractiveStars = ({
    value,
    onChange,
    label,
  }: {
    value: number;
    onChange: (value: number) => void;
    label: string;
  }) => {
    const [hoverValue, setHoverValue] = useState(0);

    return (
      <div className="flex justify-between items-center py-3 border-b">
        <span className="text-sm">{label}</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoverValue(star)}
              onMouseLeave={() => setHoverValue(0)}
              className={`text-2xl transition-colors cursor-pointer ${
                star <= (hoverValue || value)
                  ? 'text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-200'
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Render Completion Content
  const renderCompletionContent = (data: CompletionData) => (
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

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            פרטי ההזמנה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
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

      {/* Customer Declaration */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-lg text-green-800">הצהרת הלקוח</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-green-800">
            אני החתום/ה מטה מאשר/ת כי העבודה בוצעה והוגשה בהתאם להזמנה, להסכמות ולתנאי האתר,
            ונמסרה לשביעות רצוני המלאה במועד סיום העבודה.
          </p>
        </CardContent>
      </Card>

      {/* Interactive Satisfaction Rating */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">דירוג שביעות רצון</CardTitle>
          <p className="text-sm text-muted-foreground">לחץ על הכוכבים כדי לדרג (1 = לא מרוצה כלל | 5 = מרוצה מאוד)</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <InteractiveStars
              value={ratings.satisfaction_overall}
              onChange={(value) => setRatings((prev) => ({ ...prev, satisfaction_overall: value }))}
              label="שביעות רצון כללית"
            />
            <InteractiveStars
              value={ratings.satisfaction_site_conduct}
              onChange={(value) => setRatings((prev) => ({ ...prev, satisfaction_site_conduct: value }))}
              label="התנהלות באתר העבודה"
            />
            <InteractiveStars
              value={ratings.satisfaction_work_quality}
              onChange={(value) => setRatings((prev) => ({ ...prev, satisfaction_work_quality: value }))}
              label="איכות ביצוע העבודה"
            />
            <InteractiveStars
              value={ratings.satisfaction_appearance}
              onChange={(value) => setRatings((prev) => ({ ...prev, satisfaction_appearance: value }))}
              label="נראות וגימור העבודה"
            />
            <InteractiveStars
              value={ratings.satisfaction_worker_behavior}
              onChange={(value) => setRatings((prev) => ({ ...prev, satisfaction_worker_behavior: value }))}
              label="התנהגות איש הביצוע"
            />
          </div>
        </CardContent>
      </Card>

      {/* Feedback Notes Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">הערות / משוב (אופציונלי)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={feedbackNotes}
            onChange={(e) => setFeedbackNotes(e.target.value)}
            placeholder="ספר לנו על החוויה שלך..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Legal Disclaimer */}
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="text-lg text-amber-800">סעיף הגנה והיעדר טענות עתידיות</CardTitle>
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

      {/* Customer Approval */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg text-blue-800">אישור הלקוח</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-blue-800">
            אני מאשר/ת כי קראתי, הבנתי והסכמתי לכל האמור לעיל, וכי אין לי ולא יהיו לי טענות נוספות לאחר מועד החתימה.
          </p>
        </CardContent>
      </Card>
    </>
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
