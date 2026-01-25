'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface FormActionsProps {
  formId: string;
  projectId: string;
  isSigned: boolean;
  formType: string;
}

export function FormActions({ formId, projectId, isSigned, formType }: FormActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete form');
      }

      toast.success('הטופס נמחק בהצלחה');
      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה במחיקת הטופס');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isSigned) {
    return (
      <p className="text-sm text-muted-foreground text-center py-2">
        טופס זה נחתם ולא ניתן לעריכה או מחיקה
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Button className="w-full" variant="outline" asChild>
        <Link href={`/projects/${projectId}/forms/${formId}/edit`}>
          <Edit className="h-4 w-4 ml-2" />
          עריכה
        </Link>
      </Button>

      <ConfirmDialog
        trigger={
          <Button className="w-full text-destructive hover:text-destructive" variant="outline">
            <Trash2 className="h-4 w-4 ml-2" />
            מחיקה
          </Button>
        }
        title="מחיקת טופס"
        description={`האם אתה בטוח שברצונך למחוק את הטופס? פעולה זו אינה ניתנת לביטול.`}
        confirmText="מחק"
        cancelText="ביטול"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
