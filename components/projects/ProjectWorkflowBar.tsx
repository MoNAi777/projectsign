'use client';

import { Check, Circle, Send, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormType, FORM_TYPE_LABELS } from '@/types';

interface FormInfo {
  id: string;
  type: FormType;
  sent_at?: string | null;
  signed_at?: string | null;
}

interface ProjectWorkflowBarProps {
  forms: FormInfo[];
  projectId: string;
}

type StepStatus = 'not_started' | 'created' | 'sent' | 'signed';

const WORKFLOW_STEPS: { type: FormType; label: string }[] = [
  { type: 'quote', label: 'הצעת מחיר' },
  { type: 'work_approval', label: 'אישור עבודה' },
  { type: 'completion', label: 'הגשת עבודה' },
  { type: 'payment', label: 'תשלום' },
];

function getStepStatus(forms: FormInfo[], type: FormType): StepStatus {
  const form = forms.find((f) => f.type === type);
  if (!form) return 'not_started';
  if (form.signed_at) return 'signed';
  if (form.sent_at) return 'sent';
  return 'created';
}

function StepIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case 'signed':
      return (
        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
          <Check className="h-4 w-4 text-white" />
        </div>
      );
    case 'sent':
      return (
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
          <Send className="h-4 w-4 text-white" />
        </div>
      );
    case 'created':
      return (
        <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
          <FileText className="h-4 w-4 text-white" />
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          <Circle className="h-4 w-4 text-gray-400" />
        </div>
      );
  }
}

const STATUS_LABELS: Record<StepStatus, string> = {
  not_started: 'לא התחיל',
  created: 'נוצר',
  sent: 'נשלח',
  signed: 'נחתם',
};

export function ProjectWorkflowBar({ forms, projectId }: ProjectWorkflowBarProps) {
  const steps = WORKFLOW_STEPS.map((step) => ({
    ...step,
    status: getStepStatus(forms, step.type),
  }));

  // Calculate overall progress
  const completedSteps = steps.filter((s) => s.status === 'signed').length;
  const progressPercent = (completedSteps / steps.length) * 100;

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="relative mb-2">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-left" dir="ltr">
          {completedSteps}/{steps.length}
        </p>
      </div>

      {/* Steps */}
      <div className="flex items-start justify-between gap-1">
        {steps.map((step, index) => (
          <div key={step.type} className="flex flex-col items-center flex-1 relative">
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'absolute top-4 h-0.5 w-full -left-1/2',
                  step.status === 'signed' ? 'bg-green-500' : 'bg-gray-200'
                )}
                style={{ zIndex: 0 }}
              />
            )}

            {/* Icon */}
            <div className="relative z-10">
              <StepIcon status={step.status} />
            </div>

            {/* Label */}
            <span className="text-xs mt-1 text-center leading-tight font-medium">
              {step.label}
            </span>

            {/* Status */}
            <span
              className={cn(
                'text-[10px] mt-0.5',
                step.status === 'signed' && 'text-green-600',
                step.status === 'sent' && 'text-blue-600',
                step.status === 'created' && 'text-yellow-600',
                step.status === 'not_started' && 'text-gray-400'
              )}
            >
              {STATUS_LABELS[step.status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
