import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "JEEmocks — NTA-Accurate Mock Tests for JEE Main & Advanced",
  description:
    "Practice with NTA-pattern mock tests designed for JEE Main & Advanced aspirants. Realistic exam simulator, chapter-wise analytics, pacing analysis, and detailed solutions — no distractions, just serious preparation.",
  keywords: [
    "JEE mock test",
    "JEE Main practice",
    "JEE Advanced test series",
    "NTA pattern",
    "IIT JEE preparation",
    "online mock test JEE",
    "JEE exam simulator",
  ],
  openGraph: {
    title: "JEEmocks — NTA-Accurate Mock Tests for JEE Main & Advanced",
    description:
      "Practice with NTA-pattern mock tests. Realistic exam simulator, chapter-wise analytics, and detailed solutions.",
    type: "website",
  },
};

import QueryProvider from "../components/providers/QueryProvider";
import { ToastProvider } from "../components/providers/ToastContext";
import { AuthProvider } from "../components/providers/AuthContext";
import { ThemeProvider } from "../components/providers/ThemeContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* MathJax 3 Config */}
        <Script id="mathjax-config" strategy="beforeInteractive">
          {`
            window.MathJax = {
              tex: {
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']]
              },
              svg: {
                fontCache: 'global'
              }
            };
          `}
        </Script>
        <Script
          id="mathjax-load"
          src={`https://cdn.jsdelivr.net/npm/mathjax@${process.env.NEXT_PUBLIC_MATHJAX_VERSION || '3'}/es5/tex-mml-chtml.js`}
          strategy="afterInteractive"
        />
        <QueryProvider>
          <ToastProvider>
            <AuthProvider>
              <ThemeProvider>
                {children}
              </ThemeProvider>
            </AuthProvider>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
