import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inferacore | Global Engineering Intelligence",
  description: "Join the most advanced engineering intelligence network. Access automated skill gap analysis, dynamic career roadmapping, and cross-domain market signals.",
  keywords: ["Engineering", "Career Roadmap", "Intelligence Network", "Skill Gap Analysis", "Tech Trends"],
  authors: [{ name: "Inferacore System" }],
  icons: {
    icon: "/favicon.ico", // Ensure you have a favicon in your public folder
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning is REQUIRED for next-themes to work without errors
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${jetBrainsMono.variable} font-sans antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 selection:bg-[#7D87FF] selection:text-white`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}