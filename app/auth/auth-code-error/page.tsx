'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowLeft, Mail } from 'lucide-react'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-200 text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-slate-800 mb-4">
            인증 오류가 발생했습니다
          </h1>

          {/* Description */}
          <div className="text-slate-600 mb-8 space-y-3">
            <p>로그인 링크가 만료되었거나 올바르지 않습니다.</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-red-800 mb-1">가능한 원인:</p>
                  <ul className="text-red-700 space-y-1">
                    <li>• 이메일 링크가 만료됨 (10분 제한)</li>
                    <li>• 이미 사용된 링크</li>
                    <li>• 잘못된 링크</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Link
              href="/login"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              다시 로그인하기
            </Link>
            
            <Link
              href="/"
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              홈으로 돌아가기
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6 text-sm text-slate-500">
          <p>문제가 계속된다면 새로운 매직 링크를 요청해주세요.</p>
        </div>
      </div>
    </div>
  )
}