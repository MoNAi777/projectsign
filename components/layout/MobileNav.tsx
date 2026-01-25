'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  LogOut,
  FileSignature,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const navItems = [
  {
    href: '/',
    label: 'לוח בקרה',
    icon: LayoutDashboard,
  },
  {
    href: '/projects',
    label: 'פרויקטים',
    icon: FolderKanban,
  },
  {
    href: '/settings',
    label: 'הגדרות',
    icon: Settings,
  },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // Handle back button when sheet is open
  useEffect(() => {
    if (open) {
      // Push a state when sheet opens so back button can close it
      window.history.pushState({ sheetOpen: true }, '');

      const handlePopState = (event: PopStateEvent) => {
        // When back button is pressed, close the sheet
        setOpen(false);
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [open]);

  // When sheet closes (not via back button), clean up history
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen && open) {
      // Sheet is closing, go back in history if we pushed a state
      if (window.history.state?.sheetOpen) {
        window.history.back();
      }
    }
    setOpen(newOpen);
  }, [open]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    handleOpenChange(false);
  };

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="flex items-center justify-between h-14 px-4">
        <Link href="/" className="flex items-center gap-2">
          <FileSignature className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">ProjectSign</span>
        </Link>

        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">פתח תפריט</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <FileSignature className="h-6 w-6 text-primary" />
                <span>ProjectSign</span>
              </SheetTitle>
            </SheetHeader>

            <nav className="flex flex-col gap-2 mt-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => handleOpenChange(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="absolute bottom-6 left-4 right-4">
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                התנתק
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
