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
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ButtonLoader, PageLoader } from '@/components/shared/LoadingSpinner';
import Link from 'next/link';
import { ArrowRight, AlertCircle, Star, FileText, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CompletionFormPageProps {
  params: Promise<{ id: string }>;
}

// Rating component
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
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CompletionFormPage({ params }: CompletionFormPageProps) {
  const { id: projectId } = use(params);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [projectData, setProjectData] = useState<{ name: string; contact?: { name: string; address?: string } } | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
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
      site_name: '',
      order_number: '',
      work_date: new Date().toISOString().split('T')[0],
      satisfaction_overall: 5,
      satisfaction_site_conduct: 5,
      satisfaction_work_quality: 5,
      satisfaction_appearance: 5,
      satisfaction_worker_behavior: 5,
      feedback_notes: '',
      legal_disclaimer_accepted: false,
    },
  });

  const legalDisclaimerAccepted = watch('legal_disclaimer_accepted');
  const satisfactionOverall = watch('satisfaction_overall');
  const satisfactionSiteConduct = watch('satisfaction_site_conduct');
  const satisfactionWorkQuality = watch('satisfaction_work_quality');
  const satisfactionAppearance = watch('satisfaction_appearance');
  const satisfactionWorkerBehavior = watch('satisfaction_worker_behavior');

  // Fetch project data to pre-fill
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('name, contacts(*)')
          .eq('id', projectId)
          .single();

        if (error) throw error;

        const contact = Array.isArray(data.contacts) ? data.contacts[0] : data.contacts;
        setProjectData({
          name: data.name,
          contact: contact,
        });

        // Pre-fill site name if available
        if (contact?.address) {
          setValue('site_name', contact.address);
        }
      } catch (err) {
        console.error('Error fetching project:', err);
      } finally {
        setIsLoadingProject(false);
      }
    };

    fetchProject();
  }, [projectId, supabase, setValue]);

  const onSubmit = async (data: CompletionDataForm) => {
    setError(null);
    setIsLoading(true);

    try {
      // Create form and get the ID
      const { data: form, error: formError } = await supabase
        .from('forms')
        .insert({
          project_id: projectId,
          type: 'completion',
          data: data,
        })
        .select('id')
        .single();

      if (formError || !form) {
        console.error('Form error:', formError);
        setError('אירעה שגיאה ביצירת הטופס');
        return;
      }

      // Update project status to completed
      const { error: statusError } = await supabase
        .from('projects')
        .update({ status: 'completed' })
        .eq('id', projectId);

      if (statusError) {
        console.error('Status error:', statusError);
        // Rollback: Delete the form if status update failed
        await supabase.from('forms').delete().eq('id', form.id);
        setError('אירעה שגיאה בעדכון סטטוס הפרויקט');
        return;
      }

      toast.success('טופס הגשת עבודה נוצר בהצלחה');
      router.push(`/projects/${projectId}`);
    } catch (err) {
      console.error('Error:', err);
      setError('אירעה שגיאה, נסה שנית');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProject) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="טופס הגשת עבודה ושביעות רצון"
        description="אישור סיום העבודה ודירוג שביעות רצון"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              פרטי ההזמנה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site_name">שם אתר / כתובת *</Label>
              <Input
                id="site_name"
                placeholder="הכנס את כתובת האתר"
                {...register('site_name')}
              />
              {errors.site_name && (
                <p className="text-sm text-destructive">{errors.site_name.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="order_number">מס׳ הזמנה (אם קיים)</Label>
                <Input
                  id="order_number"
                  placeholder="מספר הזמנה"
                  {...register('order_number')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="work_date">תאריך ביצוע העבודה *</Label>
                <Input
                  id="work_date"
                  type="date"
                  dir="ltr"
                  {...register('work_date')}
                />
                {errors.work_date && (
                  <p className="text-sm text-destructive">{errors.work_date.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Declaration */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-sm leading-relaxed text-green-800">
              אני החתום/ה מטה מאשר/ת כי העבודה בוצעה והוגשה בהתאם להזמנה, להסכמות ולתנאי האתר,
              ונמסרה לשביעות רצוני המלאה במועד סיום העבודה.
            </p>
          </CardContent>
        </Card>

        {/* Satisfaction Rating */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              דירוג שביעות רצון
            </CardTitle>
            <p className="text-sm text-muted-foreground">1 = לא מרוצה כלל | 5 = מרוצה מאוד</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <StarRating
                label="שביעות רצון כללית"
                value={satisfactionOverall}
                onChange={(val) => setValue('satisfaction_overall', val)}
              />
              <StarRating
                label="התנהלות באתר העבודה"
                value={satisfactionSiteConduct}
                onChange={(val) => setValue('satisfaction_site_conduct', val)}
              />
              <StarRating
                label="איכות ביצוע העבודה"
                value={satisfactionWorkQuality}
                onChange={(val) => setValue('satisfaction_work_quality', val)}
              />
              <StarRating
                label="נראות וגימור העבודה"
                value={satisfactionAppearance}
                onChange={(val) => setValue('satisfaction_appearance', val)}
              />
              <StarRating
                label="התנהגות איש הביצוע"
                value={satisfactionWorkerBehavior}
                onChange={(val) => setValue('satisfaction_worker_behavior', val)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Feedback Notes */}
        <Card>
          <CardHeader>
            <CardTitle>הערות / משוב</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              id="feedback_notes"
              placeholder="הערות נוספות או משוב..."
              rows={4}
              {...register('feedback_notes')}
            />
          </CardContent>
        </Card>

        {/* Legal Disclaimer */}
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Shield className="h-5 w-5" />
              סעיף הגנה והיעדר טענות עתידיות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>
                הלקוח מצהיר כי בדק את העבודה במועד מסירתה, כי לא נמצאו ליקויים גלויים לעין,
                וכי ידוע לו שמדובר בעבודות באבן, קרמיקה, שיש ופורצלן אשר מטבעם עלולים לכלול
                שברים נסתרים, מאמצים פנימיים או רגישויות חומריות שאינן ניתנות לזיהוי מראש.
              </p>
              <p>
                לאחר חתימה על טופס זה, הלקוח מוותר על כל טענה, דרישה או תביעה עתידית בגין
                סדקים, שברים או נזקים הנובעים מתכונות החומר, תשתיות קיימות, עבודות קודמות,
                התקנה או שימוש שבוצעו על ידי צד ג׳, וכן על נזקים שנגרמו לאחר סיום העבודה
                ו/או שלא בנוכחות איש הביצוע.
              </p>
              <p className="font-medium">
                אחריות החברה חלה אך ורק על ביצוע העבודה כפי שנמסרה במועד סיומה,
                ואינה חלה על נזקים עקיפים, תוצאתיים או עתידיים.
              </p>
            </div>

            <div className="flex items-start space-x-2 space-x-reverse pt-4 border-t">
              <Checkbox
                id="legal_disclaimer_accepted"
                checked={legalDisclaimerAccepted}
                onCheckedChange={(checked) =>
                  setValue('legal_disclaimer_accepted', checked === true)
                }
              />
              <div>
                <Label htmlFor="legal_disclaimer_accepted" className="cursor-pointer font-medium">
                  אני מאשר/ת כי קראתי, הבנתי והסכמתי לכל האמור לעיל
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  וכי אין לי ולא יהיו לי טענות נוספות לאחר מועד החתימה.
                </p>
              </div>
            </div>
            {errors.legal_disclaimer_accepted && (
              <p className="text-sm text-destructive">
                {errors.legal_disclaimer_accepted.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={isLoading || !legalDisclaimerAccepted}
          >
            {isLoading && <ButtonLoader />}
            צור טופס הגשת עבודה
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
