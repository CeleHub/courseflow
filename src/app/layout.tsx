import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";

//Analytics
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CourseFlow",
  description: "Your academic rhythm, perfectly timed",
  icons: {
    shortcut: '/favicon.svg',
  },
  openGraph: {
    locale: "en_US",
    title: "CourseFlow",
    siteName: "CourseFlow",
    description: "Your academic rhythm, perfectly timed",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
