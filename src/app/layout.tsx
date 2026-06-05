import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { db } from "@/lib/db";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  let settingsMap: Record<string, string> = {};
  try {
    const settings = await db.siteSettings.findMany();
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }
  } catch (error) {
    console.error("Failed to fetch settings for metadata:", error);
  }

  const siteName = settingsMap["site_name"] || "Noticias Hoy";
  const siteDesc = settingsMap["site_description"] || "Tu portal de noticias digital de confianza. Las últimas noticias de tecnología, deportes, política, ciencia, cultura y economía.";
  const siteFavicon = settingsMap["site_favicon"] || "https://api.dicebear.com/9.x/initials/svg?seed=NH&backgroundColor=c0392b";

  return {
    title: `${siteName} | Portal de Noticias Digital`,
    description: siteDesc,
    keywords: ["noticias", "actualidad", "tecnología", "deportes", "política", "ciencia", "cultura", "economía"],
    authors: [{ name: siteName }],
    icons: {
      icon: siteFavicon,
    },
    openGraph: {
      title: siteName,
      description: siteDesc,
      type: "website",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <SonnerToaster />
          <ShadcnToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
