'use client'

import { useAuth } from '@/app/lib/auth/AuthProvider'
import { User, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function AuthButton() {
  const [authReady, setAuthReady] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // useAuth 훅을 항상 호출하도록 수정
  const authData = useAuth()
  const { user, loading, signIn, signOut } = authData || { 
    user: null, 
    loading: false, 
    signIn: () => {}, 
    signOut: () => {} 
  }

  useEffect(() => {
    // 컴포넌트가 마운트되면 인증 준비 완료
    const timer = setTimeout(() => {
      setAuthReady(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  if (!authReady || loading) {
    return (
      <div className="animate-pulse" data-testid="auth-button">
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-2" data-testid="auth-button">
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm text-blue-700 font-medium">
            {user.user_metadata?.name || user.email?.split('@')[0] || '사용자'}
          </span>
        </div>
        <button
          onClick={signOut}
          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          title="로그아웃"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={signIn}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
      data-testid="auth-button"
    >
      <User className="w-4 h-4" />
      로그인
    </button>
  )
}