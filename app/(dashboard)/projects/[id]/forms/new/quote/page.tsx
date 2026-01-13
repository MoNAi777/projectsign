'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { quoteDataSchema, type QuoteDataForm } from '@/lib/validations';
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
import { ButtonLoader } from '@/components/shared/LoadingSpinner';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { ArrowRight, Plus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  formatCurrency,
  generateId,
  getDefaultValidUntil,
  calculateVAT,
  calculateTotal,
} from '@/lib/utils';
import { UNIT_OPTIONS, VAT_RATE } from '@/lib/constants';

interface QuoteFormPageProps {
  params: Promise<{ id: string }>;
}

export default function QuoteFormPage({ params }: QuoteFormPageProps) {
  const { id: projectId } = use(params);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuoteDataForm>({
    resolver: zodResolver(quoteDataSchema),
    defaultValues: {
      items: [
        {
          id: generateId(),
          description: '',
          quantity: 1,
          unit: 'unit',
          unit_price: 0,
          total: 0,
        },
      ],
      subtotal: 0,
      vat_rate: VAT_RATE,
      vat_amount: 0,
      total: 0,
      valid_until: getDefaultValidUntil(),
      notes: '',
      payment_terms: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Watch items for calculations
  const items = watch('items');

  // Calculate totals whenever items change
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = (item.quantity || 0) * (item.unit_price || 0);
    return sum + itemTotal;
  }, 0);

  const vatAmount = calculateVAT(subtotal, VAT_RATE);
  const total = calculateTotal(subtotal, VAT_RATE);

  // Update item total when quantity or price changes
  const updateItemTotal = (index: number) => {
    const item = items[index];
    const itemTotal = (item.quantity || 0) * (item.unit_price || 0);
    setValue(`items.${index}.total`, itemTotal);
  };

  const addItem = () => {
    append({
      id: generateId(),
      description: '',
      quantity: 1,
      unit: 'unit',
      unit_price: 0,
      total: 0,
    });
  };

  const onSubmit = async (data: QuoteDataForm) => {
    setError(null);
    setIsLoading(true);

    try {
      // Calculate final totals
      const finalData = {
        ...data,
        subtotal,
        vat_amount: vatAmount,
        total,
        items: data.items.map((item) => ({
          ...item,
          total: (item.quantity || 0) * (item.unit_price || 0),
        })),
      };

      const { error: formError } = await supabase.from('forms').insert({
        project_id: projectId,
        type: 'quote',
        data: finalData,
      });

      if (formError) {
        console.error('Form error:', formError);
        setError('אירעה שגיאה ביצירת הטופס');
        return;
      }

      toast.success('הצעת המחיר נוצרה בהצלחה');
      router.push(`/projects/${projectId}`);
    } catch (err) {
      console.error('Error:', err);
      setError('אירעה שגיאה, נסה שנית');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="הצעת מחיר חדשה"
        description="מלא את פרטי הצעת המחיר"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>פריטים</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 ml-2" />
              הוסף פריט
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="space-y-4">
                {index > 0 && <Separator />}
                <div className="grid gap-4 md:grid-cols-12 items-end">
                  {/* Description */}
                  <div className="md:col-span-4 space-y-2">
                    <Label>תיאור</Label>
                    <Input
                      placeholder="תיאור הפריט"
                      {...register(`items.${index}.description`)}
                    />
                  </div>

                  {/* Quantity */}
                  <div className="md:col-span-2 space-y-2">
                    <Label>כמות</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      {...register(`items.${index}.quantity`, {
                        valueAsNumber: true,
                        onChange: () => updateItemTotal(index),
                      })}
                    />
                  </div>

                  {/* Unit */}
                  <div className="md:col-span-2 space-y-2">
                    <Label>יחידה</Label>
                    <Select
                      defaultValue={field.unit}
                      onValueChange={(value) =>
                        setValue(`items.${index}.unit`, value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Unit Price */}
                  <div className="md:col-span-2 space-y-2">
                    <Label>מחיר ליחידה</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      dir="ltr"
                      {...register(`items.${index}.unit_price`, {
                        valueAsNumber: true,
                        onChange: () => updateItemTotal(index),
                      })}
                    />
                  </div>

                  {/* Total & Delete */}
                  <div className="md:col-span-2 flex items-center gap-2">
                    <div className="flex-1 text-left font-medium">
                      {formatCurrency(
                        (items[index]?.quantity || 0) *
                          (items[index]?.unit_price || 0)
                      )}
                    </div>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {errors.items && (
              <p className="text-sm text-destructive">{errors.items.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardHeader>
            <CardTitle>סיכום</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-xs mr-auto text-left">
              <div className="flex justify-between">
                <span>סה״כ לפני מע״מ:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>מע״מ (17%):</span>
                <span>{formatCurrency(vatAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>סה״כ:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle>פרטים נוספים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="valid_until">תוקף ההצעה</Label>
                <Input
                  id="valid_until"
                  type="date"
                  dir="ltr"
                  {...register('valid_until')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_terms">תנאי תשלום</Label>
                <Input
                  id="payment_terms"
                  placeholder="שוטף + 30"
                  {...register('payment_terms')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">הערות</Label>
              <Textarea
                id="notes"
                placeholder="הערות להצעת המחיר..."
                {...register('notes')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warranty_terms">תנאי אחריות</Label>
              <Textarea
                id="warranty_terms"
                placeholder="תנאי אחריות..."
                {...register('warranty_terms')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <ButtonLoader />}
            צור הצעת מחיר
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
