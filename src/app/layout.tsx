import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "MEP Invitation 2026 – New Year Celebration",
  description: "Join the New Year 2026 MEP: a 30-member initiative led by 3 leaders and 3 co-leaders. Apply, learn more, and celebrate with us.",
  keywords: "MEP, New Year 2026, AMV, Leaders, Co-Leaders, Application, Video Editing",
  authors: [{ name: "MEP 2026 Team" }],
  openGraph: {
    title: "MEP Invitation 2026 – New Year Celebration",
    description: "Join the New Year 2026 MEP: a 30-member initiative led by 3 leaders and 3 co-leaders. Apply as Leader or Co-Leader today!",
    type: "website",
    locale: "en_US",
    url: "https://yourdomain.com",
    siteName: "MEP 2026",
    images: [
      {
        url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop",
        width: 1600,
        height: 900,
        alt: "New Year 2026 MEP Invitation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MEP Invitation 2026 – New Year Celebration",
    description: "Join the New Year 2026 MEP: a 30-member initiative led by 3 leaders and 3 co-leaders. Apply as Leader or Co-Leader today!",
    images: ["https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorReporter />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />
        {children}
        <Toaster />
        <VisualEditsMessenger />
      </body>
    </html>
  );
}