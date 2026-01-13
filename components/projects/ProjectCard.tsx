'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectStatusBadge } from '@/components/shared/StatusBadge';
import { formatDate } from '@/lib/utils';
import { Project, Contact, ProjectStatus } from '@/types';
import { User, Calendar, ArrowLeft } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  contact?: Contact | null;
}

export function ProjectCard({ project, contact }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <ProjectStatusBadge status={project.status as ProjectStatus} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {contact && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{contact.name}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(project.created_at)}</span>
          </div>
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          )}
          <div className="flex items-center gap-1 text-sm text-primary pt-2">
            <span>צפה בפרויקט</span>
            <ArrowLeft className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
