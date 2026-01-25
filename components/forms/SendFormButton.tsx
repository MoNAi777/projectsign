'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ButtonLoader } from '@/components/shared/LoadingSpinner';
import { Send, Mail, MessageSquare, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface SendFormButtonProps {
  formId: string;
  contactEmail?: string;
  contactPhone?: string;
}

export function SendFormButton({
  formId,
  contactEmail,
  contactPhone,
}: SendFormButtonProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState(contactEmail || '');
  const [phone, setPhone] = useState(contactPhone || '');
  const [signingUrl, setSigningUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when dialog closes
      setSigningUrl(null);
      setCopied(false);
      setEmail(contactEmail || '');
      setPhone(contactPhone || '');
    }
  };

  const generateLink = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/forms/${formId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'link' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate link');
      }

      setSigningUrl(data.signingUrl);
      toast.success('קישור נוצר בהצלחה');
    } catch (error) {
      console.error('Error:', error);
      toast.error('שגיאה ביצירת קישור');
    } finally {
      setIsLoading(false);
    }
  };

  const sendViaEmail = async () => {
    if (!email) {
      toast.error('יש להזין כתובת אימייל');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/forms/${formId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'email', email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      toast.success('האימייל נשלח בהצלחה');
      handleOpenChange(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('שגיאה בשליחת האימייל');
    } finally {
      setIsLoading(false);
    }
  };

  const sendViaSMS = async () => {
    if (!phone) {
      toast.error('יש להזין מספר טלפון');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/forms/${formId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'sms', phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send SMS');
      }

      toast.success('הודעת SMS נשלחה בהצלחה');
      handleOpenChange(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('שגיאה בשליחת SMS');
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = async () => {
    if (signingUrl) {
      await navigator.clipboard.writeText(signingUrl);
      setCopied(true);
      toast.success('הקישור הועתק');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareViaWhatsApp = () => {
    if (signingUrl) {
      const message = encodeURIComponent(
        `שלום, מצורף קישור לחתימה על המסמך:\n${signingUrl}`
      );
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Send className="h-4 w-4 ml-2" />
          שלח לחתימה
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>שליחה לחתימה</DialogTitle>
          <DialogDescription>
            בחר את אופן שליחת המסמך לחתימה
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">קישור</TabsTrigger>
            <TabsTrigger value="email">אימייל</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4 pt-4">
            {!signingUrl ? (
              <Button onClick={generateLink} disabled={isLoading} className="w-full">
                {isLoading && <ButtonLoader />}
                צור קישור לחתימה
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input value={signingUrl} readOnly dir="ltr" />
                  <Button variant="outline" size="icon" onClick={copyLink}>
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {phone && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={shareViaWhatsApp}
                  >
                    <MessageSquare className="h-4 w-4 ml-2" />
                    שתף בוואטסאפ
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="email" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email">כתובת אימייל</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                dir="ltr"
              />
            </div>
            <Button onClick={sendViaEmail} disabled={isLoading} className="w-full">
              {isLoading && <ButtonLoader />}
              <Mail className="h-4 w-4 ml-2" />
              שלח באימייל
            </Button>
          </TabsContent>

          <TabsContent value="sms" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="phone">מספר טלפון</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="050-1234567"
                dir="ltr"
              />
            </div>
            <Button onClick={sendViaSMS} disabled={isLoading} className="w-full">
              {isLoading && <ButtonLoader />}
              <MessageSquare className="h-4 w-4 ml-2" />
              שלח SMS
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            סגור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
