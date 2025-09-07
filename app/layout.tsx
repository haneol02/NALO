import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from './lib/auth/AuthProvider';
import ErrorBoundary from './components/ErrorBoundary';
import AutoRecovery from './components/AutoRecovery';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NALO(날로) - 날로 먹는 프로젝트 기획",
  description: "AI가 도와주는 스마트한 프로젝트 기획 솔루션. 완전 무료로 당신만의 창업 아이디어를 만나보세요.",
  keywords: "프로젝트 아이디어, 창업 아이디어, 사이드프로젝트, AI 기획, 스마트 기획, 무료 서비스",
  authors: [{ name: "NALO Team" }],
  openGraph: {
    title: "NALO(날로) - 날로 먹는 프로젝트 기획",
    description: "AI가 도와주는 스마트한 프로젝트 기획 솔루션",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "NALO(날로) - 날로 먹는 프로젝트 기획",
    description: "AI가 도와주는 스마트한 프로젝트 기획 솔루션",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <AutoRecovery>
          <ErrorBoundary>
            <AuthProvider>
              <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-blue-50">
                {children}
              </div>
            </AuthProvider>
          </ErrorBoundary>
        </AutoRecovery>
      </body>
    </html>
  );
}