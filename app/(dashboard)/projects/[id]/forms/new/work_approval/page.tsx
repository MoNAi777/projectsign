'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { workApprovalDataSchema, type WorkApprovalDataForm } from '@/lib/validations';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ButtonLoader, PageLoader } from '@/components/shared/LoadingSpinner';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { ArrowRight, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Form, QuoteData } from '@/types';

interface WorkApprovalFormPageProps {
  params: Promise<{ id: string }>;
}

interface QuoteForm extends Form {
  data: QuoteData;
}

export default function WorkApprovalFormPage({ params }: WorkApprovalFormPageProps) {
  const { id: projectId } = use(params);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(true);
  const [quotes, setQuotes] = useState<QuoteForm[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<QuoteForm | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WorkApprovalDataForm>({
    resolver: zodResolver(workApprovalDataSchema),
    defaultValues: {
      quote_id: '',
      approved_amount: 0,
      start_date: new Date().toISOString().split('T')[0],
      estimated_end_date: '',
      terms_accepted: false,
      special_conditions: '',
      deposit_required: false,
      deposit_amount: 0,
      deposit_paid: false,
    },
  });

  const depositRequired = watch('deposit_required');
  const approvedAmount = watch('approved_amount');

  // Fetch quotes for this project
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .eq('project_id', projectId)
          .eq('type', 'quote')
          .not('signed_at', 'is', null)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setQuotes((data || []) as QuoteForm[]);
      } catch (err) {
        console.error('Error fetching quotes:', err);
      } finally {
        setIsLoadingQuotes(false);
      }
    };

    fetchQuotes();
  }, [projectId, supabase]);

  const handleQuoteSelect = (quoteId: string) => {
    const quote = quotes.find((q) => q.id === quoteId);
    if (quote) {
      setSelectedQuote(quote);
      setValue('quote_id', quoteId);
      setValue('approved_amount', quote.data.total);
    }
  };

  const onSubmit = async (data: WorkApprovalDataForm) => {
    setError(null);
    setIsLoading(true);

    try {
      const { error: formError } = await supabase.from('forms').insert({
        project_id: projectId,
        type: 'work_approval',
        data: data,
      });

      if (formError) {
        console.error('Form error:', formError);
        setError('אירעה שגיאה ביצירת הטופס');
        return;
      }

      // Update project status to approved
      await supabase
        .from('projects')
        .update({ status: 'approved' })
        .eq('id', projectId);

      toast.success('טופס אישור עבודה נוצר בהצלחה');
      router.push(`/projects/${projectId}`);
    } catch (err) {
      console.error('Error:', err);
      setError('אירעה שגיאה, נסה שנית');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingQuotes) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="טופס התחלת עבודה"
        description="צור טופס אישור להתחלת עבודה"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Quote Selection */}
        <Card>
          <CardHeader>
            <CardTitle>בחירת הצעת מחיר</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quotes.length === 0 ? (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  אין הצעות מחיר חתומות לפרויקט זה. יש ליצור ולחתום על הצעת מחיר
                  תחילה.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>בחר הצעת מחיר</Label>
                  <Select onValueChange={handleQuoteSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר הצעת מחיר חתומה" />
                    </SelectTrigger>
                    <SelectContent>
                      {quotes.map((quote) => (
                        <SelectItem key={quote.id} value={quote.id}>
                          {formatDate(quote.created_at)} -{' '}
                          {formatCurrency(quote.data.total)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedQuote && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <p className="font-medium">פרטי ההצעה הנבחרת:</p>
                    <div className="text-sm space-y-1">
                      <p>
                        סה״כ:{' '}
                        <span className="font-medium">
                          {formatCurrency(selectedQuote.data.total)}
                        </span>
                      </p>
                      <p>
                        תאריך יצירה:{' '}
                        <span className="font-medium">
                          {formatDate(selectedQuote.created_at)}
                        </span>
                      </p>
                      <p>
                        נחתם על ידי:{' '}
                        <span className="font-medium">
                          {selectedQuote.signed_by}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Work Details */}
        <Card>
          <CardHeader>
            <CardTitle>פרטי העבודה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="approved_amount">סכום מאושר</Label>
                <Input
                  id="approved_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  dir="ltr"
                  {...register('approved_amount', { valueAsNumber: true })}
                />
                {errors.approved_amount && (
                  <p className="text-sm text-destructive">
                    {errors.approved_amount.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>סכום מאושר (לתצוגה)</Label>
                <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center">
                  {formatCurrency(approvedAmount || 0)}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start_date">תאריך התחלה</Label>
                <Input
                  id="start_date"
                  type="date"
                  dir="ltr"
                  {...register('start_date')}
                />
                {errors.start_date && (
                  <p className="text-sm text-destructive">
                    {errors.start_date.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_end_date">תאריך סיום משוער</Label>
                <Input
                  id="estimated_end_date"
                  type="date"
                  dir="ltr"
                  {...register('estimated_end_date')}
                />
                {errors.estimated_end_date && (
                  <p className="text-sm text-destructive">
                    {errors.estimated_end_date.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="special_conditions">תנאים מיוחדים</Label>
              <Textarea
                id="special_conditions"
                placeholder="פרט תנאים מיוחדים להסכם..."
                {...register('special_conditions')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Deposit */}
        <Card>
          <CardHeader>
            <CardTitle>מקדמה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="deposit_required"
                checked={depositRequired}
                onCheckedChange={(checked) =>
                  setValue('deposit_required', checked === true)
                }
              />
              <Label htmlFor="deposit_required" className="cursor-pointer">
                נדרשת מקדמה
              </Label>
            </div>

            {depositRequired && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="deposit_amount">סכום מקדמה</Label>
                    <Input
                      id="deposit_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      dir="ltr"
                      {...register('deposit_amount', { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>אחוז מהסכום הכולל</Label>
                    <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center">
                      {approvedAmount > 0
                        ? `${((watch('deposit_amount') / approvedAmount) * 100).toFixed(1)}%`
                        : '0%'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="deposit_paid"
                    checked={watch('deposit_paid')}
                    onCheckedChange={(checked) =>
                      setValue('deposit_paid', checked === true)
                    }
                  />
                  <Label htmlFor="deposit_paid" className="cursor-pointer">
                    המקדמה שולמה
                  </Label>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Terms Acceptance */}
        <Card>
          <CardHeader>
            <CardTitle>אישור תנאים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-2 space-x-reverse">
              <Checkbox
                id="terms_accepted"
                checked={watch('terms_accepted')}
                onCheckedChange={(checked) =>
                  setValue('terms_accepted', checked === true)
                }
              />
              <div>
                <Label htmlFor="terms_accepted" className="cursor-pointer">
                  אני מאשר/ת את תנאי העבודה ומסכים/ה להתחיל בביצוע
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  החתימה על טופס זה מהווה אישור להתחלת העבודה בהתאם לתנאים
                  שנקבעו בהצעת המחיר
                </p>
              </div>
            </div>
            {errors.terms_accepted && (
              <p className="text-sm text-destructive mt-2">
                {errors.terms_accepted.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={isLoading || !selectedQuote || !watch('terms_accepted')}
          >
            {isLoading && <ButtonLoader />}
            צור טופס אישור עבודה
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
