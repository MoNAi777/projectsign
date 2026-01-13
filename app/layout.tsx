import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["latin", "hebrew"],
});

export const metadata: Metadata = {
  title: "ProjectSign - ניהול פרויקטים וחתימות דיגיטליות",
  description: "מערכת לניהול פרויקטים, הצעות מחיר וחתימות דיגיטליות לעסקים קטנים",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-center" dir="rtl" />
      </body>
    </html>
  );
}
