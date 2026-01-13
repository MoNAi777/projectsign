'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { createProjectSchema, type CreateProjectForm } from '@/lib/validations';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ButtonLoader } from '@/components/shared/LoadingSpinner';
import { AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewProjectPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      project: {
        name: '',
        description: '',
      },
      contact: {
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        notes: '',
      },
    },
  });

  const onSubmit = async (data: CreateProjectForm) => {
    setError(null);
    setIsLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('יש להתחבר מחדש');
        return;
      }

      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: data.project.name,
          description: data.project.description || null,
          status: 'draft',
        })
        .select()
        .single();

      if (projectError) {
        console.error('Project error:', projectError);
        setError('אירעה שגיאה ביצירת הפרויקט');
        return;
      }

      // Create contact if name provided
      if (data.contact?.name) {
        const { error: contactError } = await supabase
          .from('contacts')
          .insert({
            project_id: project.id,
            name: data.contact.name,
            phone: data.contact.phone || null,
            email: data.contact.email || null,
            address: data.contact.address || null,
            city: data.contact.city || null,
            notes: data.contact.notes || null,
          });

        if (contactError) {
          console.error('Contact error:', contactError);
          // Don't fail the whole operation, project was created
        }
      }

      toast.success('הפרויקט נוצר בהצלחה');
      router.push(`/projects/${project.id}`);
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
        title="פרויקט חדש"
        description="צור פרויקט חדש והוסף פרטי לקוח"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Project Details */}
        <Card>
          <CardHeader>
            <CardTitle>פרטי הפרויקט</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project.name">שם הפרויקט *</Label>
              <Input
                id="project.name"
                placeholder="לדוגמה: שיפוץ דירה - רחוב הרצל"
                {...register('project.name')}
              />
              {errors.project?.name && (
                <p className="text-sm text-destructive">
                  {errors.project.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="project.description">תיאור</Label>
              <Textarea
                id="project.description"
                placeholder="תיאור קצר של הפרויקט..."
                {...register('project.description')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Details */}
        <Card>
          <CardHeader>
            <CardTitle>פרטי הלקוח</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact.name">שם הלקוח</Label>
                <Input
                  id="contact.name"
                  placeholder="ישראל ישראלי"
                  {...register('contact.name')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact.phone">טלפון</Label>
                <Input
                  id="contact.phone"
                  type="tel"
                  placeholder="050-1234567"
                  dir="ltr"
                  {...register('contact.phone')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact.email">אימייל</Label>
                <Input
                  id="contact.email"
                  type="email"
                  placeholder="email@example.com"
                  dir="ltr"
                  {...register('contact.email')}
                />
                {errors.contact?.email && (
                  <p className="text-sm text-destructive">
                    {errors.contact.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact.city">עיר</Label>
                <Input
                  id="contact.city"
                  placeholder="תל אביב"
                  {...register('contact.city')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact.address">כתובת</Label>
              <Input
                id="contact.address"
                placeholder="רחוב הרצל 1, דירה 5"
                {...register('contact.address')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact.notes">הערות</Label>
              <Textarea
                id="contact.notes"
                placeholder="הערות נוספות על הלקוח..."
                {...register('contact.notes')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <ButtonLoader />}
            צור פרויקט
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/projects">
              <ArrowRight className="h-4 w-4 ml-2" />
              ביטול
            </Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
