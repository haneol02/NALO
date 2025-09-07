'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '../supabase/client'

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    let mounted = true
    
    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (error) {
          console.warn('인증 초기화 오류:', error.message)
          setAuthError(error.message)
        } else {
          setUser(session?.user ?? null)
          setAuthError(null)
        }
      } catch (error) {
        if (!mounted) return
        
        console.warn('인증 서비스 초기화 실패:', error)
        setAuthError('인증 서비스에 연결할 수 없습니다.')
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    try {
      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
        if (mounted) {
          setUser(session?.user ?? null)
          setAuthError(null)
          setLoading(false)
        }
      })

      return () => {
        mounted = false
        subscription?.unsubscribe()
      }
    } catch (error) {
      console.warn('인증 상태 변경 리스너 설정 실패:', error)
      if (mounted) {
        setLoading(false)
      }
      return () => {
        mounted = false
      }
    }
  }, [supabase.auth])

  const signIn = async () => {
    try {
      // 로그인 페이지로 리다이렉트
      window.location.href = '/login'
    } catch (error) {
      console.warn('로그인 리다이렉트 실패:', error)
      // 환경 변수가 없는 경우 경고만 표시
      alert('로그인 기능이 현재 사용할 수 없습니다. 환경 설정을 확인해주세요.')
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.warn('로그아웃 오류:', error.message)
      } else {
        window.location.reload()
      }
    } catch (error) {
      console.warn('로그아웃 실패:', error)
      // 강제로 페이지 새로고침
      window.location.reload()
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}