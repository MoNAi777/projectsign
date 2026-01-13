import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectStatusBadge, FormTypeBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import Link from 'next/link';
import {
  Plus,
  Edit,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { ProjectStatus, FormType, FORM_TYPE_LABELS } from '@/types';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

async function getProject(id: string) {
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      contacts (*),
      forms (*)
    `)
    .eq('id', id)
    .single();

  if (error || !project) {
    return null;
  }

  return project;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  const contact = project.contacts;
  const forms = project.forms || [];

  return (
    <div className="space-y-8">
      <PageHeader
        title={project.name}
        description={project.description || undefined}
        actions={
          <div className="flex items-center gap-2">
            <ProjectStatusBadge status={project.status as ProjectStatus} />
            <Button variant="outline" asChild>
              <Link href={`/projects/${project.id}/edit`}>
                <Edit className="h-4 w-4 ml-2" />
                עריכה
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Forms */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>טפסים</CardTitle>
              <Button size="sm" asChild>
                <Link href={`/projects/${project.id}/forms/new`}>
                  <Plus className="h-4 w-4 ml-2" />
                  טופס חדש
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {forms.length === 0 ? (
                <EmptyState
                  icon={<FileText className="h-8 w-8 text-muted-foreground" />}
                  title="אין טפסים"
                  description="צור טופס ראשון לפרויקט זה"
                  action={
                    <Button size="sm" asChild>
                      <Link href={`/projects/${project.id}/forms/new`}>
                        <Plus className="h-4 w-4 ml-2" />
                        צור טופס
                      </Link>
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {forms.map((form: { id: string; type: FormType; created_at: string; signed_at?: string }) => (
                    <Link
                      key={form.id}
                      href={`/projects/${project.id}/forms/${form.id}`}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {FORM_TYPE_LABELS[form.type]}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(form.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FormTypeBadge type={form.type} />
                        {form.signed_at && (
                          <span className="text-xs text-green-600">נחתם</span>
                        )}
                        <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">פרטי לקוח</CardTitle>
            </CardHeader>
            <CardContent>
              {contact ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{contact.name}</span>
                  </div>
                  {contact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${contact.phone}`}
                        className="text-primary hover:underline"
                        dir="ltr"
                      >
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-primary hover:underline"
                        dir="ltr"
                      >
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {(contact.address || contact.city) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {[contact.address, contact.city]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  לא הוגדר לקוח לפרויקט זה
                </p>
              )}
            </CardContent>
          </Card>

          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">מידע</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  נוצר: {formatDate(project.created_at)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  עודכן: {formatDate(project.updated_at)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
