'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { paymentDataSchema, type PaymentDataForm } from '@/lib/validations';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ButtonLoader, PageLoader } from '@/components/shared/LoadingSpinner';
import Link from 'next/link';
import { ArrowRight, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Form, CompletionData, PAYMENT_METHOD_LABELS, PaymentMethod } from '@/types';

interface PaymentFormPageProps {
  params: Promise<{ id: string }>;
}

interface CompletionForm extends Form {
  data: CompletionData;
}

export default function PaymentFormPage({ params }: PaymentFormPageProps) {
  const { id: projectId } = use(params);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCompletions, setIsLoadingCompletions] = useState(true);
  const [completions, setCompletions] = useState<CompletionForm[]>([]);
  const [selectedCompletion, setSelectedCompletion] = useState<CompletionForm | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PaymentDataForm>({
    resolver: zodResolver(paymentDataSchema),
    defaultValues: {
      completion_id: '',
      amount_due: 0,
      amount_paid: 0,
      payment_method: 'transfer',
      reference_number: '',
      paid_at: new Date().toISOString().split('T')[0],
      receipt_number: '',
      remaining_balance: 0,
      notes: '',
    },
  });

  const amountDue = watch('amount_due');
  const amountPaid = watch('amount_paid');
  const paymentMethod = watch('payment_method');

  // Calculate remaining balance
  useEffect(() => {
    const remaining = Math.max(0, (amountDue || 0) - (amountPaid || 0));
    setValue('remaining_balance', remaining);
  }, [amountDue, amountPaid, setValue]);

  // Fetch completions for this project
  useEffect(() => {
    const fetchCompletions = async () => {
      try {
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .eq('project_id', projectId)
          .eq('type', 'completion')
          .not('signed_at', 'is', null)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCompletions((data || []) as CompletionForm[]);
      } catch (err) {
        console.error('Error fetching completions:', err);
      } finally {
        setIsLoadingCompletions(false);
      }
    };

    fetchCompletions();
  }, [projectId, supabase]);

  const handleCompletionSelect = (completionId: string) => {
    const completion = completions.find((c) => c.id === completionId);
    if (completion) {
      setSelectedCompletion(completion);
      setValue('completion_id', completionId);
      // Amount needs to be entered manually since completion form no longer has financial data
    }
  };

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setValue('payment_method', method);
  };

  const onSubmit = async (data: PaymentDataForm) => {
    setError(null);
    setIsLoading(true);

    try {
      const { error: formError } = await supabase.from('forms').insert({
        project_id: projectId,
        type: 'payment',
        data: data,
      });

      if (formError) {
        console.error('Form error:', formError);
        setError('אירעה שגיאה ביצירת הטופס');
        return;
      }

      // Update project status to paid if fully paid
      if (data.remaining_balance === 0) {
        await supabase
          .from('projects')
          .update({ status: 'paid' })
          .eq('id', projectId);
      }

      toast.success('טופס תשלום נוצר בהצלחה');
      router.push(`/projects/${projectId}`);
    } catch (err) {
      console.error('Error:', err);
      setError('אירעה שגיאה, נסה שנית');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingCompletions) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="טופס תשלום"
        description="צור טופס אישור תשלום"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Completion Selection */}
        <Card>
          <CardHeader>
            <CardTitle>בחירת אישור סיום</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {completions.length === 0 ? (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  אין אישורי סיום חתומים לפרויקט זה. יש ליצור ולחתום על אישור
                  סיום תחילה.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>בחר אישור סיום</Label>
                  <Select onValueChange={handleCompletionSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר אישור סיום חתום" />
                    </SelectTrigger>
                    <SelectContent>
                      {completions.map((completion) => (
                        <SelectItem key={completion.id} value={completion.id}>
                          {formatDate(completion.data.work_date)} - {completion.data.site_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCompletion && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <p className="font-medium">פרטי אישור הסיום:</p>
                    <div className="text-sm space-y-1">
                      <p>
                        אתר / כתובת:{' '}
                        <span className="font-medium">
                          {selectedCompletion.data.site_name}
                        </span>
                      </p>
                      <p>
                        תאריך ביצוע:{' '}
                        <span className="font-medium">
                          {formatDate(selectedCompletion.data.work_date)}
                        </span>
                      </p>
                      <p>
                        שביעות רצון כללית:{' '}
                        <span className="font-medium">
                          {selectedCompletion.data.satisfaction_overall}/5
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle>פרטי התשלום</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount_due">סכום לתשלום</Label>
                <Input
                  id="amount_due"
                  type="number"
                  min="0"
                  step="0.01"
                  dir="ltr"
                  {...register('amount_due', { valueAsNumber: true })}
                />
                {errors.amount_due && (
                  <p className="text-sm text-destructive">
                    {errors.amount_due.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>סכום לתשלום (לתצוגה)</Label>
                <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center">
                  {formatCurrency(amountDue || 0)}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount_paid">סכום ששולם</Label>
                <Input
                  id="amount_paid"
                  type="number"
                  min="0"
                  step="0.01"
                  dir="ltr"
                  {...register('amount_paid', { valueAsNumber: true })}
                />
                {errors.amount_paid && (
                  <p className="text-sm text-destructive">
                    {errors.amount_paid.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>יתרה לתשלום</Label>
                <div className={`h-10 px-3 py-2 border rounded-md flex items-center font-bold ${
                  watch('remaining_balance') > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  {formatCurrency(watch('remaining_balance') || 0)}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>אמצעי תשלום</Label>
                <Select value={paymentMethod} onValueChange={handlePaymentMethodChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר אמצעי תשלום" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.payment_method && (
                  <p className="text-sm text-destructive">
                    {errors.payment_method.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paid_at">תאריך תשלום</Label>
                <Input
                  id="paid_at"
                  type="date"
                  dir="ltr"
                  {...register('paid_at')}
                />
                {errors.paid_at && (
                  <p className="text-sm text-destructive">
                    {errors.paid_at.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reference_number">מספר אסמכתא</Label>
                <Input
                  id="reference_number"
                  placeholder="מספר צ'ק / אישור העברה..."
                  dir="ltr"
                  {...register('reference_number')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt_number">מספר קבלה</Label>
                <Input
                  id="receipt_number"
                  placeholder="מספר קבלה..."
                  dir="ltr"
                  {...register('receipt_number')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">הערות</Label>
              <Textarea
                id="notes"
                placeholder="הערות נוספות לתשלום..."
                {...register('notes')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle>סיכום</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">סכום לתשלום</p>
                <p className="text-2xl font-bold">{formatCurrency(amountDue || 0)}</p>
              </div>
              <div className="p-4 bg-green-100 rounded-lg">
                <p className="text-sm text-green-700">שולם</p>
                <p className="text-2xl font-bold text-green-800">{formatCurrency(amountPaid || 0)}</p>
              </div>
              <div className={`p-4 rounded-lg ${
                watch('remaining_balance') > 0 ? 'bg-yellow-100' : 'bg-green-100'
              }`}>
                <p className={`text-sm ${
                  watch('remaining_balance') > 0 ? 'text-yellow-700' : 'text-green-700'
                }`}>יתרה</p>
                <p className={`text-2xl font-bold ${
                  watch('remaining_balance') > 0 ? 'text-yellow-800' : 'text-green-800'
                }`}>{formatCurrency(watch('remaining_balance') || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={isLoading || !selectedCompletion}
          >
            {isLoading && <ButtonLoader />}
            צור טופס תשלום
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/projects/${projectId}`}>
              <ArrowRight className="h-4 w-4 ml-2" />
              ביטול
            </Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
