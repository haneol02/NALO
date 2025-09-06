'use client'

import { useAuth } from '@/app/lib/auth/AuthProvider'
import { User, LogOut } from 'lucide-react'

export default function AuthButton() {
  const { user, loading, signIn, signOut } = useAuth()

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
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
    >
      <User className="w-4 h-4" />
      로그인
    </button>
  )
}