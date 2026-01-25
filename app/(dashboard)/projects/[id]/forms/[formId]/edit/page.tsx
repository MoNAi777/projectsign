'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import {
  quoteDataSchema,
  workApprovalDataSchema,
  completionDataSchema,
  paymentDataSchema,
  type QuoteDataForm,
  type WorkApprovalDataForm,
  type CompletionDataForm,
  type PaymentDataForm,
} from '@/lib/validations';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ButtonLoader, PageLoader } from '@/components/shared/LoadingSpinner';
import Link from 'next/link';
import { ArrowRight, AlertCircle, Plus, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FORM_TYPE_LABELS, UNIT_LABELS, PAYMENT_METHOD_LABELS, FormType, PaymentMethod } from '@/types';

interface EditFormPageProps {
  params: Promise<{ id: string; formId: string }>;
}

const VAT_RATE = 0.17;

export default function EditFormPage({ params }: EditFormPageProps) {
  const { id: projectId, formId } = use(params);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(true);
  const [formType, setFormType] = useState<FormType | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  // Fetch existing form data
  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await fetch(`/api/forms/${formId}`);
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 400 && data.error?.includes('נחתם')) {
            setError('לא ניתן לערוך טופס שכבר נחתם');
          } else {
            setError(data.error || 'טופס לא נמצא');
          }
          return;
        }

        if (data.signed_at) {
          setError('לא ניתן לערוך טופס שכבר נחתם');
          return;
        }

        setFormType(data.type);
        setFormData(data.data);
      } catch (err) {
        console.error('Error:', err);
        setError('שגיאה בטעינת הטופס');
      } finally {
        setIsLoadingForm(false);
      }
    };

    fetchForm();
  }, [formId]);

  const handleSave = async (data: any) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update form');
      }

      toast.success('הטופס עודכן בהצלחה');
      router.push(`/projects/${projectId}/forms/${formId}`);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בעדכון הטופס');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingForm) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  if (error && !formData) {
    return (
      <div className="space-y-8">
        <PageHeader title="עריכת טופס" />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" asChild>
          <Link href={`/projects/${projectId}`}>
            <ArrowRight className="h-4 w-4 ml-2" />
            חזרה לפרויקט
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`עריכת ${formType ? FORM_TYPE_LABELS[formType] : 'טופס'}`}
        description="עדכון פרטי הטופס"
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {formType === 'quote' && (
        <QuoteEditForm
          initialData={formData}
          onSave={handleSave}
          isLoading={isLoading}
          projectId={projectId}
          formId={formId}
        />
      )}

      {formType === 'work_approval' && (
        <WorkApprovalEditForm
          initialData={formData}
          onSave={handleSave}
          isLoading={isLoading}
          projectId={projectId}
          formId={formId}
        />
      )}

      {formType === 'completion' && (
        <CompletionEditForm
          initialData={formData}
          onSave={handleSave}
          isLoading={isLoading}
          projectId={projectId}
          formId={formId}
        />
      )}

      {formType === 'payment' && (
        <PaymentEditForm
          initialData={formData}
          onSave={handleSave}
          isLoading={isLoading}
          projectId={projectId}
          formId={formId}
        />
      )}
    </div>
  );
}

// Quote Edit Form Component
function QuoteEditForm({
  initialData,
  onSave,
  isLoading,
  projectId,
  formId,
}: {
  initialData: QuoteDataForm;
  onSave: (data: any) => void;
  isLoading: boolean;
  projectId: string;
  formId: string;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuoteDataForm>({
    resolver: zodResolver(quoteDataSchema),
    defaultValues: initialData,
  });

  const items = watch('items') || [];

  const addItem = () => {
    const newItem = {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unit: 'unit',
      unit_price: 0,
      total: 0,
    };
    setValue('items', [...items, newItem]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setValue('items', newItems);
    recalculateTotals(newItems);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }

    setValue('items', newItems);
    recalculateTotals(newItems);
  };

  const recalculateTotals = (currentItems: any[]) => {
    const subtotal = currentItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const vatAmount = subtotal * VAT_RATE;
    const total = subtotal + vatAmount;

    setValue('subtotal', subtotal);
    setValue('vat_amount', vatAmount);
    setValue('total', total);
  };

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>פריטים</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="grid gap-4 p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1 grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label>תיאור</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="תיאור הפריט"
                    />
                  </div>
                  <div>
                    <Label>כמות</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>יחידה</Label>
                    <Select
                      value={item.unit}
                      onValueChange={(value) => updateItem(index, 'unit', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(UNIT_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>מחיר ליחידה</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>סה״כ</Label>
                    <Input value={`₪${item.total.toFixed(2)}`} disabled />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addItem}>
            <Plus className="h-4 w-4 ml-2" />
            הוסף פריט
          </Button>

          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between">
              <span>סה״כ לפני מע״מ:</span>
              <span>₪{(watch('subtotal') || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>מע״מ (17%):</span>
              <span>₪{(watch('vat_amount') || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>סה״כ לתשלום:</span>
              <span>₪{(watch('total') || 0).toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>פרטים נוספים</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>תוקף ההצעה</Label>
            <Input type="date" {...register('valid_until')} />
          </div>
          <div>
            <Label>תנאי תשלום</Label>
            <Textarea {...register('payment_terms')} placeholder="תנאי תשלום..." />
          </div>
          <div>
            <Label>הערות</Label>
            <Textarea {...register('notes')} placeholder="הערות..." />
          </div>
          <div>
            <Label>תנאי אחריות</Label>
            <Textarea {...register('warranty_terms')} placeholder="תנאי אחריות..." />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <ButtonLoader />}
          שמור שינויים
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={`/projects/${projectId}/forms/${formId}`}>
            <ArrowRight className="h-4 w-4 ml-2" />
            ביטול
          </Link>
        </Button>
      </div>
    </form>
  );
}

// Work Approval Edit Form
function WorkApprovalEditForm({
  initialData,
  onSave,
  isLoading,
  projectId,
  formId,
}: {
  initialData: WorkApprovalDataForm;
  onSave: (data: any) => void;
  isLoading: boolean;
  projectId: string;
  formId: string;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WorkApprovalDataForm>({
    resolver: zodResolver(workApprovalDataSchema),
    defaultValues: initialData,
  });

  const infrastructureDeclaration = watch('infrastructure_declaration');

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>פרטי האתר</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>שם האתר / כתובת *</Label>
            <Input {...register('site_name')} />
            {errors.site_name && <p className="text-sm text-destructive">{errors.site_name.message}</p>}
          </div>
          <div>
            <Label>הצעת מחיר (מספר הפניה)</Label>
            <Input {...register('quote_reference')} />
          </div>
          <div>
            <Label>תאריך תחילת ביצוע *</Label>
            <Input type="date" {...register('start_date')} />
            {errors.start_date && <p className="text-sm text-destructive">{errors.start_date.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>פרטי העבודה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>פירוט העבודה *</Label>
            <Textarea {...register('work_details')} rows={4} />
            {errors.work_details && <p className="text-sm text-destructive">{errors.work_details.message}</p>}
          </div>
          <div>
            <Label>הערות</Label>
            <Textarea {...register('notes')} rows={3} />
          </div>
          <div>
            <Label>תוספות</Label>
            <Textarea {...register('additions')} rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>פרטי איש קשר</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>שם איש קשר *</Label>
              <Input {...register('contact_name')} />
              {errors.contact_name && <p className="text-sm text-destructive">{errors.contact_name.message}</p>}
            </div>
            <div>
              <Label>טלפון *</Label>
              <Input type="tel" dir="ltr" {...register('contact_phone')} />
              {errors.contact_phone && <p className="text-sm text-destructive">{errors.contact_phone.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-2 space-x-reverse">
            <Checkbox
              id="infrastructure_declaration"
              checked={infrastructureDeclaration}
              onCheckedChange={(checked) => setValue('infrastructure_declaration', checked === true)}
            />
            <Label htmlFor="infrastructure_declaration" className="cursor-pointer">
              אני מאשר/ת כי מסרתי מידע מלא ומדויק בנוגע לתשתיות הקיימות באתר
            </Label>
          </div>
          {errors.infrastructure_declaration && (
            <p className="text-sm text-destructive mt-2">{errors.infrastructure_declaration.message}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isLoading || !infrastructureDeclaration}>
          {isLoading && <ButtonLoader />}
          שמור שינויים
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={`/projects/${projectId}/forms/${formId}`}>
            <ArrowRight className="h-4 w-4 ml-2" />
            ביטול
          </Link>
        </Button>
      </div>
    </form>
  );
}

// Star Rating Component
function StarRating({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (val: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={cn(
                'h-6 w-6 transition-colors',
                star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// Completion Edit Form
function CompletionEditForm({
  initialData,
  onSave,
  isLoading,
  projectId,
  formId,
}: {
  initialData: CompletionDataForm;
  onSave: (data: any) => void;
  isLoading: boolean;
  projectId: string;
  formId: string;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CompletionDataForm>({
    resolver: zodResolver(completionDataSchema),
    defaultValues: initialData,
  });

  const legalDisclaimerAccepted = watch('legal_disclaimer_accepted');

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>פרטי ההזמנה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>שם אתר / כתובת *</Label>
            <Input {...register('site_name')} />
            {errors.site_name && <p className="text-sm text-destructive">{errors.site_name.message}</p>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>מס׳ הזמנה</Label>
              <Input {...register('order_number')} />
            </div>
            <div>
              <Label>תאריך ביצוע העבודה *</Label>
              <Input type="date" {...register('work_date')} />
              {errors.work_date && <p className="text-sm text-destructive">{errors.work_date.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>דירוג שביעות רצון</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <StarRating
              label="שביעות רצון כללית"
              value={watch('satisfaction_overall')}
              onChange={(val) => setValue('satisfaction_overall', val)}
            />
            <StarRating
              label="התנהלות באתר העבודה"
              value={watch('satisfaction_site_conduct')}
              onChange={(val) => setValue('satisfaction_site_conduct', val)}
            />
            <StarRating
              label="איכות ביצוע העבודה"
              value={watch('satisfaction_work_quality')}
              onChange={(val) => setValue('satisfaction_work_quality', val)}
            />
            <StarRating
              label="נראות וגימור העבודה"
              value={watch('satisfaction_appearance')}
              onChange={(val) => setValue('satisfaction_appearance', val)}
            />
            <StarRating
              label="התנהגות איש הביצוע"
              value={watch('satisfaction_worker_behavior')}
              onChange={(val) => setValue('satisfaction_worker_behavior', val)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>הערות / משוב</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea {...register('feedback_notes')} rows={4} placeholder="הערות נוספות..." />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-2 space-x-reverse">
            <Checkbox
              id="legal_disclaimer"
              checked={legalDisclaimerAccepted}
              onCheckedChange={(checked) => setValue('legal_disclaimer_accepted', checked === true)}
            />
            <Label htmlFor="legal_disclaimer" className="cursor-pointer">
              אני מאשר/ת כי קראתי, הבנתי והסכמתי לסעיף ההגנה והיעדר טענות עתידיות
            </Label>
          </div>
          {errors.legal_disclaimer_accepted && (
            <p className="text-sm text-destructive mt-2">{errors.legal_disclaimer_accepted.message}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isLoading || !legalDisclaimerAccepted}>
          {isLoading && <ButtonLoader />}
          שמור שינויים
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={`/projects/${projectId}/forms/${formId}`}>
            <ArrowRight className="h-4 w-4 ml-2" />
            ביטול
          </Link>
        </Button>
      </div>
    </form>
  );
}

// Payment Edit Form
function PaymentEditForm({
  initialData,
  onSave,
  isLoading,
  projectId,
  formId,
}: {
  initialData: PaymentDataForm;
  onSave: (data: any) => void;
  isLoading: boolean;
  projectId: string;
  formId: string;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PaymentDataForm>({
    resolver: zodResolver(paymentDataSchema),
    defaultValues: initialData,
  });

  const amountDue = watch('amount_due');
  const amountPaid = watch('amount_paid');
  const paymentMethod = watch('payment_method');

  // Calculate remaining balance
  useEffect(() => {
    const remaining = Math.max(0, (amountDue || 0) - (amountPaid || 0));
    setValue('remaining_balance', remaining);
  }, [amountDue, amountPaid, setValue]);

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>פרטי התשלום</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>סכום לתשלום</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                {...register('amount_due', { valueAsNumber: true })}
              />
              {errors.amount_due && <p className="text-sm text-destructive">{errors.amount_due.message}</p>}
            </div>
            <div>
              <Label>סכום ששולם</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                {...register('amount_paid', { valueAsNumber: true })}
              />
              {errors.amount_paid && <p className="text-sm text-destructive">{errors.amount_paid.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>אמצעי תשלום</Label>
              <Select value={paymentMethod} onValueChange={(val) => setValue('payment_method', val as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>תאריך תשלום</Label>
              <Input type="date" {...register('paid_at')} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>מספר אסמכתא</Label>
              <Input {...register('reference_number')} />
            </div>
            <div>
              <Label>מספר קבלה</Label>
              <Input {...register('receipt_number')} />
            </div>
          </div>

          <div>
            <Label>הערות</Label>
            <Textarea {...register('notes')} rows={3} />
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span>יתרה לתשלום:</span>
              <span className={`text-lg font-bold ${watch('remaining_balance') > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                ₪{(watch('remaining_balance') || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <ButtonLoader />}
          שמור שינויים
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={`/projects/${projectId}/forms/${formId}`}>
            <ArrowRight className="h-4 w-4 ml-2" />
            ביטול
          </Link>
        </Button>
      </div>
    </form>
  );
}
