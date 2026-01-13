import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ProjectStatus, FormType, PROJECT_STATUS_LABELS, FORM_TYPE_LABELS } from '@/types';
import { STATUS_COLORS, FORM_TYPE_COLORS } from '@/lib/constants';

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
}

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  return (
    <Badge variant="secondary" className={cn(STATUS_COLORS[status])}>
      {PROJECT_STATUS_LABELS[status]}
    </Badge>
  );
}

interface FormTypeBadgeProps {
  type: FormType;
}

export function FormTypeBadge({ type }: FormTypeBadgeProps) {
  return (
    <Badge variant="secondary" className={cn(FORM_TYPE_COLORS[type])}>
      {FORM_TYPE_LABELS[type]}
    </Badge>
  );
}
