'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ButtonLoader } from '@/components/shared/LoadingSpinner';
import { toast } from 'sonner';
import { AlertCircle, User, Lock } from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState<{ email?: string; user_metadata?: { full_name?: string } } | null>(null);
  const [fullName, setFullName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setFullName(user.user_metadata?.full_name || '');
      }
    };
    getUser();
  }, [supabase.auth]);

  const handleUpdateProfile = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });

      if (error) {
        setError('שגיאה בעדכון הפרופיל');
        return;
      }

      toast.success('הפרופיל עודכן בהצלחה');
    } catch {
      setError('אירעה שגיאה');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    if (newPassword.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setError('שגיאה בעדכון הסיסמה');
        return;
      }

      toast.success('הסיסמה עודכנה בהצלחה');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('אירעה שגיאה');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="הגדרות"
        description="נהל את הגדרות החשבון שלך"
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            פרטי פרופיל
          </CardTitle>
          <CardDescription>עדכן את פרטי החשבון שלך</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              לא ניתן לשנות את כתובת האימייל
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">שם מלא</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="ישראל ישראלי"
            />
          </div>

          <Button onClick={handleUpdateProfile} disabled={isLoading}>
            {isLoading && <ButtonLoader />}
            שמור שינויים
          </Button>
        </CardContent>
      </Card>

      {/* Password Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            שינוי סיסמה
          </CardTitle>
          <CardDescription>עדכן את סיסמת החשבון שלך</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">סיסמה חדשה</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">אימות סיסמה</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              dir="ltr"
            />
          </div>

          <Button onClick={handleChangePassword} disabled={isLoading}>
            {isLoading && <ButtonLoader />}
            שנה סיסמה
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
