'use client';

import { useRef, useState, useCallback } from 'react';
import SignaturePad from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Eraser, Check } from 'lucide-react';

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void;
  onClear?: () => void;
  disabled?: boolean;
}

export function SignatureCanvas({
  onSave,
  onClear,
  disabled = false,
}: SignatureCanvasProps) {
  const sigRef = useRef<SignaturePad>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = useCallback(() => {
    sigRef.current?.clear();
    setIsEmpty(true);
    onClear?.();
  }, [onClear]);

  const handleSave = useCallback(() => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const dataUrl = sigRef.current.toDataURL('image/png', 1.0);
      onSave(dataUrl);
    }
  }, [onSave]);

  return (
    <div className="space-y-4">
      <div className="relative border-2 border-dashed border-gray-300 rounded-lg bg-white">
        <SignaturePad
          ref={sigRef}
          canvasProps={{
            className: 'w-full h-48 rounded-lg signature-canvas',
            style: {
              touchAction: 'none',
              cursor: disabled ? 'not-allowed' : 'crosshair',
            },
          }}
          onBegin={() => setIsEmpty(false)}
          backgroundColor="white"
          penColor="black"
          minWidth={1}
          maxWidth={3}
          velocityFilterWeight={0.7}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400">
            חתום כאן
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleClear}
          disabled={disabled || isEmpty}
        >
          <Eraser className="h-4 w-4 ml-2" />
          נקה
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={disabled || isEmpty}
        >
          <Check className="h-4 w-4 ml-2" />
          אשר חתימה
        </Button>
      </div>
    </div>
  );
}
