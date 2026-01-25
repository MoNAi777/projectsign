import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Plus, FolderKanban } from 'lucide-react';
import { ProjectsFilter } from '@/components/projects/ProjectsFilter';
import { EmptyState } from '@/components/shared/EmptyState';

async function getProjects() {
  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      *,
      contacts (*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }

  return projects || [];
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-8">
      <PageHeader
        title="פרויקטים"
        description="ניהול כל הפרויקטים שלך"
        actions={
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="h-4 w-4 ml-2" />
              פרויקט חדש
            </Link>
          </Button>
        }
      />

      {projects.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={<FolderKanban className="h-8 w-8 text-muted-foreground" />}
              title="אין פרויקטים"
              description="צור את הפרויקט הראשון שלך כדי להתחיל"
              action={
                <Button asChild>
                  <Link href="/projects/new">
                    <Plus className="h-4 w-4 ml-2" />
                    צור פרויקט
                  </Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <ProjectsFilter projects={projects} />
      )}
    </div>
  );
}
