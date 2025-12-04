import type { Metadata } from "next";
import { Geist, Geist_Mono, Chewy } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const chewy = Chewy({
  weight: "400",
  variable: "--font-chewy",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZooTube - Curated Videos for Kids",
  description: "A safe, parent-curated YouTube video platform for children. Parents manage a whitelist of approved videos.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ZooTube",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon-192x192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${chewy.variable} antialiased`}
      >
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
