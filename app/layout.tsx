import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { BackButtonHandler } from "@/components/layout/BackButtonHandler";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["latin", "hebrew"],
});

export const metadata: Metadata = {
  title: "ProjectSign - ניהול פרויקטים וחתימות דיגיטליות",
  description: "מערכת לניהול פרויקטים, הצעות מחיר וחתימות דיגיטליות לעסקים קטנים",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ProjectSign",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Immediate back button guard - runs before React hydration
              if (!window.location.pathname.startsWith('/sign')) {
                window.history.pushState({guard:true},'',window.location.href);
                window.addEventListener('popstate',function(e){
                  if(!e.state||!e.state.sheetOpen&&!e.state.dialogOpen){
                    window.history.pushState({guard:true},'',window.location.href);
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body className={`${heebo.variable} font-sans antialiased`}>
        <BackButtonHandler />
        {children}
        <Toaster position="top-center" dir="rtl" />
      </body>
    </html>
  );
}
