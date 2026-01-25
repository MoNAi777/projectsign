'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ButtonLoader } from '@/components/shared/LoadingSpinner';
import { Download } from 'lucide-react';

interface DownloadPDFButtonProps {
  formId: string;
}

export function DownloadPDFButton({ formId }: DownloadPDFButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/forms/${formId}/pdf`);

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Get filename from Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = 'document.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^";\n]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          fileName = decodeURIComponent(filenameMatch[1]);
        }
      }

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('שגיאה בהורדת PDF');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      className="w-full"
      variant="outline"
      onClick={handleDownload}
      disabled={isLoading}
    >
      {isLoading ? <ButtonLoader /> : <Download className="h-4 w-4 ml-2" />}
      הורד PDF
    </Button>
  );
}
