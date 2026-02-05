import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nocturne Passport",
  description: "Your digital proof of presence.",
  icons: {
    icon: "/logo.png", // Correct: Points to public/logo.png
    apple: "/logo.png",
    shortcut: "/logo.png",
  },
  openGraph: {
    title: "Nocturne Passport",
    description: "Digital Stamp Collection Protocol",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Keep it here for the "dark" class toggle
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        // Add it here to ignore extension-injected attributes like 'cz-shortcut-listen'
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
