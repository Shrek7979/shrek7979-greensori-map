import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import PWARegister from "./pwa-register";

// 빌드 때 Google에서 받아오다 실패하는 일이 있어 폰트 파일을 직접 둔다 (latin 서브셋)
const geistSans = localFont({
  src: "./fonts/geist-latin.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const cuteFont = localFont({
  src: "./fonts/baloo2-latin.woff2",
  variable: "--font-fredoka",
  weight: "500 700",
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
