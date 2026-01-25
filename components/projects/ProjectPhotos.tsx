'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ButtonLoader } from '@/components/shared/LoadingSpinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Camera, Plus, Trash2, X, Image as ImageIcon } from 'lucide-react';

interface ProjectImage {
  id: string;
  url: string;
  caption?: string;
  created_at: string;
}

interface ProjectPhotosProps {
  projectId: string;
}

export function ProjectPhotos({ projectId }: ProjectPhotosProps) {
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ProjectImage | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchImages();
  }, [projectId]);

  const fetchImages = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/images`);
      if (response.ok) {
        const data = await response.json();
        setImages(data);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`/api/projects/${projectId}/images`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const newImage = await response.json();
          setImages((prev) => [newImage, ...prev]);
          toast.success('התמונה הועלתה בהצלחה');
        } else {
          const data = await response.json();
          toast.error(data.error || 'שגיאה בהעלאת התמונה');
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('שגיאה בהעלאת התמונה');
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (imageId: string) => {
    setDeletingId(imageId);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/images?imageId=${imageId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setImages((prev) => prev.filter((img) => img.id !== imageId));
        setSelectedImage(null);
        toast.success('התמונה נמחקה');
      } else {
        toast.error('שגיאה במחיקת התמונה');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('שגיאה במחיקת התמונה');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            תמונות
          </CardTitle>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <ButtonLoader />
              ) : (
                <Plus className="h-4 w-4 ml-2" />
              )}
              הוסף תמונה
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <ButtonLoader />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">אין תמונות בפרויקט זה</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="h-4 w-4 ml-2" />
                הוסף תמונה ראשונה
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group border"
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image.url}
                    alt={image.caption || 'תמונת פרויקט'}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center justify-between">
              <span>תצוגת תמונה</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => selectedImage && handleDelete(selectedImage.id)}
                disabled={deletingId === selectedImage?.id}
              >
                {deletingId === selectedImage?.id ? (
                  <ButtonLoader />
                ) : (
                  <Trash2 className="h-4 w-4 ml-2" />
                )}
                מחק
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="p-4">
              <img
                src={selectedImage.url}
                alt={selectedImage.caption || 'תמונת פרויקט'}
                className="w-full max-h-[70vh] object-contain rounded-lg"
              />
              {selectedImage.caption && (
                <p className="mt-3 text-sm text-muted-foreground text-center">
                  {selectedImage.caption}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
