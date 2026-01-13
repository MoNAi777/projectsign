import { FileSignature } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/50 p-4">
      <div className="flex items-center gap-2 mb-8">
        <FileSignature className="h-10 w-10 text-primary" />
        <span className="text-2xl font-bold">ProjectSign</span>
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
