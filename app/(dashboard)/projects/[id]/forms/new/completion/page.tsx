'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { completionDataSchema, type CompletionDataForm } from '@/lib/validations';
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
import { Form, WorkApprovalData } from '@/types';

interface CompletionFormPageProps {
  params: Promise<{ id: string }>;
}

interface WorkApprovalForm extends Form {
  data: WorkApprovalData;
}

export default function CompletionFormPage({ params }: CompletionFormPageProps) {
  const { id: projectId } = use(params);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(true);
  const [workApprovals, setWorkApprovals] = useState<WorkApprovalForm[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<WorkApprovalForm | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CompletionDataForm>({
    resolver: zodResolver(completionDataSchema),
    defaultValues: {
      work_approval_id: '',
      actual_completion_date: new Date().toISOString().split('T')[0],
      work_summary: '',
      deviations_from_quote: '',
      additional_charges: 0,
      additional_charges_reason: '',
      final_amount: 0,
      client_notes: '',
      warranty_start_date: new Date().toISOString().split('T')[0],
    },
  });

  const additionalCharges = watch('additional_charges');
  const finalAmount = watch('final_amount');

  // Fetch work approvals for this project
  useEffect(() => {
    const fetchWorkApprovals = async () => {
      try {
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .eq('project_id', projectId)
          .eq('type', 'work_approval')
          .not('signed_at', 'is', null)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setWorkApprovals((data || []) as WorkApprovalForm[]);
      } catch (err) {
        console.error('Error fetching work approvals:', err);
      } finally {
        setIsLoadingApprovals(false);
      }
    };

    fetchWorkApprovals();
  }, [projectId, supabase]);

  const handleApprovalSelect = (approvalId: string) => {
    const approval = workApprovals.find((a) => a.id === approvalId);
    if (approval) {
      setSelectedApproval(approval);
      setValue('work_approval_id', approvalId);
      setValue('final_amount', approval.data.approved_amount);
    }
  };

  const onSubmit = async (data: CompletionDataForm) => {
    setError(null);
    setIsLoading(true);

    try {
      const { error: formError } = await supabase.from('forms').insert({
        project_id: projectId,
        type: 'completion',
        data: data,
      });

      if (formError) {
        console.error('Form error:', formError);
        setError('אירעה שגיאה ביצירת הטופס');
        return;
      }

      // Update project status to completed
      await supabase
        .from('projects')
        .update({ status: 'completed' })
        .eq('id', projectId);

      toast.success('טופס סיום עבודה נוצר בהצלחה');
      router.push(`/projects/${projectId}`);
    } catch (err) {
      console.error('Error:', err);
      setError('אירעה שגיאה, נסה שנית');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingApprovals) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="טופס סיום עבודה"
        description="צור טופס אישור סיום עבודה"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Work Approval Selection */}
        <Card>
          <CardHeader>
            <CardTitle>בחירת אישור עבודה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {workApprovals.length === 0 ? (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  אין אישורי עבודה חתומים לפרויקט זה. יש ליצור ולחתום על אישור
                  עבודה תחילה.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>בחר אישור עבודה</Label>
                  <Select onValueChange={handleApprovalSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר אישור עבודה חתום" />
                    </SelectTrigger>
                    <SelectContent>
                      {workApprovals.map((approval) => (
                        <SelectItem key={approval.id} value={approval.id}>
                          {formatDate(approval.created_at)} -{' '}
                          {formatCurrency(approval.data.approved_amount)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedApproval && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <p className="font-medium">פרטי אישור העבודה:</p>
                    <div className="text-sm space-y-1">
                      <p>
                        סכום מאושר:{' '}
                        <span className="font-medium">
                          {formatCurrency(selectedApproval.data.approved_amount)}
                        </span>
                      </p>
                      <p>
                        תאריך התחלה:{' '}
                        <span className="font-medium">
                          {formatDate(selectedApproval.data.start_date)}
                        </span>
                      </p>
                      <p>
                        תאריך סיום משוער:{' '}
                        <span className="font-medium">
                          {formatDate(selectedApproval.data.estimated_end_date)}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Completion Details */}
        <Card>
          <CardHeader>
            <CardTitle>פרטי סיום העבודה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="actual_completion_date">תאריך סיום בפועל</Label>
                <Input
                  id="actual_completion_date"
                  type="date"
                  dir="ltr"
                  {...register('actual_completion_date')}
                />
                {errors.actual_completion_date && (
                  <p className="text-sm text-destructive">
                    {errors.actual_completion_date.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="warranty_start_date">תאריך תחילת אחריות</Label>
                <Input
                  id="warranty_start_date"
                  type="date"
                  dir="ltr"
                  {...register('warranty_start_date')}
                />
                {errors.warranty_start_date && (
                  <p className="text-sm text-destructive">
                    {errors.warranty_start_date.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="work_summary">סיכום העבודה</Label>
              <Textarea
                id="work_summary"
                placeholder="תאר את העבודה שבוצעה..."
                rows={4}
                {...register('work_summary')}
              />
              {errors.work_summary && (
                <p className="text-sm text-destructive">
                  {errors.work_summary.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deviations_from_quote">סטיות מהצעת המחיר</Label>
              <Textarea
                id="deviations_from_quote"
                placeholder="פרט שינויים או סטיות מההצעה המקורית (אם היו)..."
                rows={3}
                {...register('deviations_from_quote')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle>סיכום כספי</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="additional_charges">חיובים נוספים</Label>
                <Input
                  id="additional_charges"
                  type="number"
                  min="0"
                  step="0.01"
                  dir="ltr"
                  {...register('additional_charges', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label>חיובים נוספים (לתצוגה)</Label>
                <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center">
                  {formatCurrency(additionalCharges || 0)}
                </div>
              </div>
            </div>

            {additionalCharges > 0 && (
              <div className="space-y-2">
                <Label htmlFor="additional_charges_reason">סיבת החיובים הנוספים</Label>
                <Textarea
                  id="additional_charges_reason"
                  placeholder="פרט את הסיבה לחיובים הנוספים..."
                  {...register('additional_charges_reason')}
                />
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="final_amount">סכום סופי לתשלום</Label>
                <Input
                  id="final_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  dir="ltr"
                  {...register('final_amount', { valueAsNumber: true })}
                />
                {errors.final_amount && (
                  <p className="text-sm text-destructive">
                    {errors.final_amount.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>סכום סופי (לתצוגה)</Label>
                <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center font-bold">
                  {formatCurrency(finalAmount || 0)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_notes">הערות ללקוח</Label>
              <Textarea
                id="client_notes"
                placeholder="הערות נוספות ללקוח..."
                {...register('client_notes')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={isLoading || !selectedApproval}
          >
            {isLoading && <ButtonLoader />}
            צור טופס סיום עבודה
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
