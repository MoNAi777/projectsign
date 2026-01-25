import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { InstallPrompt } from '@/components/layout/InstallPrompt';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <MobileNav />
      <Sidebar />
      <div className="md:pr-64">
        <main className="pt-16 md:pt-0 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
      <InstallPrompt />
    </div>
  );
}
