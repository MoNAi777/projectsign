'use client';

import { useState, useEffect, use } from 'react';
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
import { ButtonLoader, PageLoader } from '@/components/shared/LoadingSpinner';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = use(params);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
  });

  useEffect(() => {
    const fetchProject = async () => {
      const { data: project, error } = await supabase
        .from('projects')
        .select(`*, contacts (*)`)
        .eq('id', id)
        .single();

      if (error || !project) {
        router.push('/projects');
        return;
      }

      reset({
        project: {
          name: project.name,
          description: project.description || '',
        },
        contact: project.contacts
          ? {
              name: project.contacts.name,
              phone: project.contacts.phone || '',
              email: project.contacts.email || '',
              address: project.contacts.address || '',
              city: project.contacts.city || '',
              notes: project.contacts.notes || '',
            }
          : undefined,
      });

      setIsFetching(false);
    };

    fetchProject();
  }, [id, supabase, reset, router]);

  const onSubmit = async (data: CreateProjectForm) => {
    setError(null);
    setIsLoading(true);

    try {
      // Update project
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          name: data.project.name,
          description: data.project.description || null,
        })
        .eq('id', id);

      if (projectError) {
        setError('אירעה שגיאה בעדכון הפרויקט');
        return;
      }

      // Update or create contact
      if (data.contact?.name) {
        const { data: existingContact } = await supabase
          .from('contacts')
          .select('id')
          .eq('project_id', id)
          .single();

        if (existingContact) {
          await supabase
            .from('contacts')
            .update({
              name: data.contact.name,
              phone: data.contact.phone || null,
              email: data.contact.email || null,
              address: data.contact.address || null,
              city: data.contact.city || null,
              notes: data.contact.notes || null,
            })
            .eq('project_id', id);
        } else {
          await supabase.from('contacts').insert({
            project_id: id,
            name: data.contact.name,
            phone: data.contact.phone || null,
            email: data.contact.email || null,
            address: data.contact.address || null,
            city: data.contact.city || null,
            notes: data.contact.notes || null,
          });
        }
      }

      toast.success('הפרויקט עודכן בהצלחה');
      router.push(`/projects/${id}`);
    } catch {
      setError('אירעה שגיאה, נסה שנית');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);

      if (error) {
        toast.error('שגיאה במחיקת הפרויקט');
        return;
      }

      toast.success('הפרויקט נמחק');
      router.push('/projects');
    } catch {
      toast.error('אירעה שגיאה');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="עריכת פרויקט"
        description="עדכן את פרטי הפרויקט"
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <ButtonLoader />}
              שמור שינויים
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href={`/projects/${id}`}>
                <ArrowRight className="h-4 w-4 ml-2" />
                ביטול
              </Link>
            </Button>
          </div>

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="destructive">
                <Trash2 className="h-4 w-4 ml-2" />
                מחק פרויקט
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>מחיקת פרויקט</DialogTitle>
                <DialogDescription>
                  האם אתה בטוח שברצונך למחוק את הפרויקט? פעולה זו לא ניתנת לביטול
                  וכל הטפסים הקשורים יימחקו גם כן.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  ביטול
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  {isLoading && <ButtonLoader />}
                  מחק
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </form>
    </div>
  );
}
