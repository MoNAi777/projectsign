'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  // Resize canvas to match container dimensions
  useEffect(() => {
    const resizeCanvas = () => {
      if (sigRef.current && containerRef.current) {
        const canvas = sigRef.current.getCanvas();
        const container = containerRef.current;
        const ratio = Math.max(window.devicePixelRatio || 1, 1);

        canvas.width = container.offsetWidth * ratio;
        canvas.height = 200 * ratio;
        canvas.getContext('2d')?.scale(ratio, ratio);

        sigRef.current.clear();
        setIsEmpty(true);
      }
    };

    // Initial resize
    resizeCanvas();

    // Resize on window resize
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

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
      <div ref={containerRef} className="relative border-2 border-dashed border-gray-300 rounded-lg bg-white overflow-hidden">
        <SignaturePad
          ref={sigRef}
          canvasProps={{
            className: 'signature-canvas',
            style: {
              width: '100%',
              height: '200px',
              touchAction: 'none',
              cursor: disabled ? 'not-allowed' : 'crosshair',
              display: 'block',
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
