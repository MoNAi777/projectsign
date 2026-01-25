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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ButtonLoader, PageLoader } from '@/components/shared/LoadingSpinner';
import Link from 'next/link';
import { ArrowRight, AlertCircle, Building2, FileText, User, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface WorkApprovalFormPageProps {
  params: Promise<{ id: string }>;
}

export default function WorkApprovalFormPage({ params }: WorkApprovalFormPageProps) {
  const { id: projectId } = use(params);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [projectData, setProjectData] = useState<{ name: string; contact?: { name: string; phone?: string; address?: string } } | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
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
      site_name: '',
      quote_reference: '',
      start_date: new Date().toISOString().split('T')[0],
      work_details: '',
      notes: '',
      additions: '',
      contact_name: '',
      contact_phone: '',
      infrastructure_declaration: false,
    },
  });

  const infrastructureDeclaration = watch('infrastructure_declaration');

  // Fetch project data to pre-fill contact info
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

        // Pre-fill contact info if available
        if (contact) {
          setValue('contact_name', contact.name || '');
          setValue('contact_phone', contact.phone || '');
          if (contact.address) {
            setValue('site_name', contact.address);
          }
        }
      } catch (err) {
        console.error('Error fetching project:', err);
      } finally {
        setIsLoadingProject(false);
      }
    };

    fetchProject();
  }, [projectId, supabase, setValue]);

  const onSubmit = async (data: WorkApprovalDataForm) => {
    setError(null);
    setIsLoading(true);

    try {
      // Create form and get the ID
      const { data: form, error: formError } = await supabase
        .from('forms')
        .insert({
          project_id: projectId,
          type: 'work_approval',
          data: data,
        })
        .select('id')
        .single();

      if (formError || !form) {
        console.error('Form error:', formError);
        setError('אירעה שגיאה ביצירת הטופס');
        return;
      }

      // Update project status to approved
      const { error: statusError } = await supabase
        .from('projects')
        .update({ status: 'approved' })
        .eq('id', projectId);

      if (statusError) {
        console.error('Status error:', statusError);
        // Rollback: Delete the form if status update failed
        await supabase.from('forms').delete().eq('id', form.id);
        setError('אירעה שגיאה בעדכון סטטוס הפרויקט');
        return;
      }

      toast.success('טופס הזמנת עבודה נוצר בהצלחה');
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
        title="הזמנת עבודה / אישור ביצוע"
        description="טופס אישור תחילת עבודה"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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

        {/* Site Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              פרטי האתר
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site_name">שם האתר / הכתובת *</Label>
              <Input
                id="site_name"
                placeholder="הכנס את כתובת האתר"
                {...register('site_name')}
              />
              {errors.site_name && (
                <p className="text-sm text-destructive">{errors.site_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quote_reference">הצעת מחיר (מספר הפניה)</Label>
              <Input
                id="quote_reference"
                placeholder="מספר הצעת מחיר אם קיים"
                {...register('quote_reference')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">תאריך תחילת ביצוע *</Label>
              <Input
                id="start_date"
                type="date"
                dir="ltr"
                {...register('start_date')}
              />
              {errors.start_date && (
                <p className="text-sm text-destructive">{errors.start_date.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Work Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              פרטי העבודה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="work_details">פירוט העבודה *</Label>
              <Textarea
                id="work_details"
                placeholder="תאר את העבודה שתתבצע..."
                rows={4}
                {...register('work_details')}
              />
              {errors.work_details && (
                <p className="text-sm text-destructive">{errors.work_details.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">הערות</Label>
              <Textarea
                id="notes"
                placeholder="הערות נוספות..."
                rows={3}
                {...register('notes')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additions">תוספות</Label>
              <Textarea
                id="additions"
                placeholder="תוספות לעבודה..."
                rows={3}
                {...register('additions')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              פרטי איש קשר
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact_name">שם איש קשר *</Label>
                <Input
                  id="contact_name"
                  placeholder="שם מלא"
                  {...register('contact_name')}
                />
                {errors.contact_name && (
                  <p className="text-sm text-destructive">{errors.contact_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">טלפון *</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  dir="ltr"
                  placeholder="050-0000000"
                  {...register('contact_phone')}
                />
                {errors.contact_phone && (
                  <p className="text-sm text-destructive">{errors.contact_phone.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Declaration Acceptance */}
        <Card>
          <CardHeader>
            <CardTitle>אישור והסכמה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-2 space-x-reverse">
              <Checkbox
                id="infrastructure_declaration"
                checked={infrastructureDeclaration}
                onCheckedChange={(checked) =>
                  setValue('infrastructure_declaration', checked === true)
                }
              />
              <div>
                <Label htmlFor="infrastructure_declaration" className="cursor-pointer font-medium">
                  אני מאשר/ת כי מסרתי מידע מלא ומדויק בנוגע לתשתיות הקיימות באתר
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  ידוע לי כי האחריות על מסירת מידע נכון בנוגע לתשתיות, צנרת, חשמל ונקודות רגישות חלה עליי בלבד.
                </p>
              </div>
            </div>
            {errors.infrastructure_declaration && (
              <p className="text-sm text-destructive mt-2">
                {errors.infrastructure_declaration.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={isLoading || !infrastructureDeclaration}
          >
            {isLoading && <ButtonLoader />}
            צור טופס הזמנת עבודה
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
