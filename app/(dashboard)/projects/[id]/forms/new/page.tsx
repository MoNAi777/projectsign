'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight, FileText, ClipboardCheck, CheckCircle, CreditCard } from 'lucide-react';
import { FormType, FORM_TYPE_LABELS } from '@/types';
import { cn } from '@/lib/utils';

interface NewFormPageProps {
  params: Promise<{ id: string }>;
}

const formTypes: { type: FormType; icon: typeof FileText; description: string }[] = [
  {
    type: 'quote',
    icon: FileText,
    description: 'הצעת מחיר מפורטת עם פריטים ומחירים',
  },
  {
    type: 'work_approval',
    icon: ClipboardCheck,
    description: 'אישור תחילת עבודה מהלקוח',
  },
  {
    type: 'completion',
    icon: CheckCircle,
    description: 'אישור סיום עבודה וקבלת תוצאות',
  },
  {
    type: 'payment',
    icon: CreditCard,
    description: 'אישור תשלום וקבלה',
  },
];

export default function NewFormPage({ params }: NewFormPageProps) {
  const { id } = use(params);
  const [selectedType, setSelectedType] = useState<FormType | null>(null);
  const router = useRouter();

  const handleContinue = () => {
    if (selectedType) {
      router.push(`/projects/${id}/forms/new/${selectedType}`);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="טופס חדש"
        description="בחר את סוג הטופס שברצונך ליצור"
      />

      <div className="grid gap-4 md:grid-cols-2">
        {formTypes.map(({ type, icon: Icon, description }) => (
          <Card
            key={type}
            className={cn(
              'cursor-pointer transition-all',
              selectedType === type
                ? 'ring-2 ring-primary border-primary'
                : 'hover:border-primary/50'
            )}
            onClick={() => setSelectedType(type)}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    selectedType === type
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {FORM_TYPE_LABELS[type]}
                  </CardTitle>
                  <CardDescription>{description}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <Button onClick={handleContinue} disabled={!selectedType}>
          המשך
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/projects/${id}`}>
            <ArrowRight className="h-4 w-4 ml-2" />
            ביטול
          </Link>
        </Button>
      </div>
    </div>
  );
}
