import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from './lib/auth/AuthProvider';
import ErrorBoundary from './components/ErrorBoundary';
import AutoRecovery from './components/AutoRecovery';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NALO(날로) - 날로 먹는 아이디어 기획",
  description: "AI 리서치와 마인드맵으로 아이디어를 구체화하는 플랫폼. 완전 무료로 당신의 프로젝트를 시작하세요.",
  keywords: "아이디어 리서치, 마인드맵, 브레인스토밍, AI 기획, 주제 탐색, 프로젝트 아이디어, 창업 아이디어, 무료 서비스",
  authors: [{ name: "NALO Team" }],
  openGraph: {
    title: "NALO(날로) - 날로 먹는 아이디어 기획",
    description: "AI 리서치와 마인드맵으로 아이디어를 구체화하는 플랫폼",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "NALO(날로) - 날로 먹는 아이디어 기획",
    description: "AI 리서치와 마인드맵으로 아이디어를 구체화하는 플랫폼",
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