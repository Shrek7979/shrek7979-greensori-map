import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Baloo_2 } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import PWARegister from "./pwa-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cuteFont = Baloo_2({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://greensori-map.vercel.app"),
  title: "GreenSori Map",
  description: "그린소리가 담은 카페 · 공간 · 여행의 기록",
  openGraph: {
    title: "GreenSori Map",
    description: "그린소리가 담은 카페 · 공간 · 여행의 기록",
    url: "https://greensori-map.vercel.app",
    siteName: "GreenSori Map",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GreenSori Map",
    description: "그린소리가 담은 카페 · 공간 · 여행의 기록",
  },
  appleWebApp: {
    capable: true,
    title: "GreenSori",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#6f4e37",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${cuteFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){window.__pwaPrompt=null;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__pwaPrompt=e;window.dispatchEvent(new Event('pwaPromptReady'));});window.addEventListener('appinstalled',function(){window.__pwaPrompt=null;});})();",
          }}
        />
        {children}
        <PWARegister />
        <Analytics />
      </body>
    </html>
  );
}
