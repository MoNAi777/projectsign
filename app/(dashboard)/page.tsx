import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  FolderKanban,
  FileText,
  Clock,
  CheckCircle,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PROJECT_STATUS_LABELS } from '@/types';

async function getDashboardStats() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from('projects')
    .select('id, status');

  const stats = {
    total: projects?.length || 0,
    draft: projects?.filter((p) => p.status === 'draft').length || 0,
    active:
      projects?.filter((p) =>
        ['quote_sent', 'approved', 'in_progress'].includes(p.status)
      ).length || 0,
    completed:
      projects?.filter((p) => ['completed', 'paid'].includes(p.status)).length ||
      0,
  };

  return stats;
}

async function getRecentProjects() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  return projects || [];
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const recentProjects = await getRecentProjects();

  return (
    <div className="space-y-8">
      <PageHeader
        title="לוח בקרה"
        description="סקירה כללית של הפרויקטים שלך"
        actions={
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="h-4 w-4 ml-2" />
              פרויקט חדש
            </Link>
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">סה״כ פרויקטים</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">טיוטות</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">פעילים</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">הושלמו</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>פרויקטים אחרונים</CardTitle>
        </CardHeader>
        <CardContent>
          {recentProjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>אין פרויקטים עדיין</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/projects/new">צור פרויקט ראשון</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {PROJECT_STATUS_LABELS[project.status as keyof typeof PROJECT_STATUS_LABELS]}
                    </p>
                  </div>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
