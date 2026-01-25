import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ProjectSign - חתימה על מסמך',
  description: 'מסמך ממתין לחתימתך הדיגיטלית',
  manifest: undefined,
  appleWebApp: {
    capable: false,
  },
};

export default function SignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
