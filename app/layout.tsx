import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from 'sonner';
import "./globals.css";

// 1. Font Configuration
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

// 2. Viewport Configuration (Next.js 14+ separates this from Metadata)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
  ],
};

// 3. Complete SEO & Metadata Configuration
export const metadata: Metadata = {
  metadataBase: new URL('https://inferacore.tech'), // Replace with your actual production URL
  title: {
    default: "Infera Core | Intelligent Engineering Workspace",
    template: "%s | Infera Core", // Automatically appends the brand name to child page titles
  },
  description: "Transforming Learning, AI Guidance, and Redefining Education for modern engineering workflows. Stop guessing and start executing.",
  keywords: [
    "Infera Core", 
    "AI Study Buddy", 
    "Engineering Workspace", 
    "AI Guidance", 
    "Developer Tools", 
    "Productivity"
  ],
  authors: [{ name: "Infera Core Team" }],
  creator: "Infera Core",
  publisher: "Infera Core",
  
  // Open Graph (For rich links on LinkedIn, Facebook, Discord, iMessage, etc.)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Infera Core | Intelligent Engineering Workspace",
    description: "Transforming Learning, AI Guidance, and Redefining Education for modern engineering workflows.",
    siteName: "Infera Core",
    images: [
      {
        url: "/logo.png", // Create a 1200x630 image and put it in your /public folder
        width: 1200,
        height: 630,
        alt: "Infera Core Platform Overview",
      },
    ],
  },

  // Twitter Cards (For rich links on X/Twitter)
  twitter: {
    card: "summary_large_image",
    title: "Infera Core | Intelligent Engineering Workspace",
    description: "Transforming Learning, AI Guidance, and Redefining Education for modern engineering workflows.",
    images: ["/og-image.jpg"],
    creator: "@inferacore_tech", // Your actual Twitter handle
  },

  // Favicons & App Icons
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png", // Recommended to add this to /public
    apple: "/apple-touch-icon.png",   // Recommended to add this to /public
  },
  
  // Search Engine Crawling Rules
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetBrainsMono.variable}`}>
      <body
        className="font-sans antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex flex-col min-h-screen"
      >
        <ThemeProvider 
          attribute="class" 
          defaultTheme="system" 
          enableSystem 
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}