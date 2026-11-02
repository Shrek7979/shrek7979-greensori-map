import type { Metadata, Viewport } from "next";
import { Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import PWARegister from "./pwa-register";

const serifDisplay = Instrument_Serif({
  variable: "--font-serif-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5f0" },
    { media: "(prefers-color-scheme: dark)", color: "#121311" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${serifDisplay.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
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
