'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { Mail, ArrowLeft, Eye, EyeOff, User, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      if (isSignUp) {
        // 회원가입 유효성 검사
        if (password.length < 6) {
          setError('비밀번호는 6자 이상이어야 합니다.')
          setIsLoading(false)
          return
        }

        // 회원가입
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        })

        console.log('회원가입 결과:', { error, data })

        if (error) {
          if (error.message.includes('already registered')) {
            setError('이미 등록된 이메일입니다. 로그인을 시도해보세요.')
          } else {
            setError(`회원가입 오류: ${error.message}`)
          }
        } else {
          // 회원가입 성공 - 이메일 인증 여부에 따라 다른 메시지
          if (data.user && !data.user.email_confirmed_at) {
            setMessage('회원가입이 완료되었습니다! 이메일을 확인하여 계정을 인증해주세요. 인증 후 로그인할 수 있습니다.')
          } else {
            setMessage('회원가입이 완료되었습니다! 이제 로그인할 수 있습니다.')
            // 이메일 인증이 비활성화된 경우에만 자동 로그인 모드로 전환
            setTimeout(() => {
              setIsSignUp(false)
              setMessage('이제 로그인해주세요!')
            }, 2000)
          }
        }
      } else {
        // 로그인
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        console.log('로그인 결과:', { error, data })

        if (error) {
          console.error('로그인 에러 세부사항:', error)
          if (error.message.includes('Email not confirmed')) {
            setError('이메일 인증이 필요합니다. 매직 링크를 사용해주세요.')
          } else if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_grant')) {
            setError('이메일 또는 비밀번호가 올바르지 않습니다.')
          } else if (error.message.includes('signup_disabled')) {
            setError('회원가입이 비활성화되어 있습니다.')
          } else {
            setError(`로그인 오류: ${error.message}`)
          }
        } else {
          router.push('/')
        }
      }
    } catch (err) {
      setError('예상치 못한 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMagicLink = async () => {
    if (!email) {
      setError('이메일을 먼저 입력하세요.')
      return
    }

    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error('매직 링크 에러:', error)
        setError(`매직 링크 전송 실패: ${error.message}`)
      } else {
        setMessage('매직 링크를 이메일로 보냈습니다! 이메일을 확인하여 링크를 클릭하세요. (유효시간: 10분)')
      }
    } catch (err) {
      console.error('매직 링크 예외:', err)
      setError('매직 링크 전송에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      {/* Header */}
      <header className="p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>홈으로 돌아가기</span>
          </Link>
          <h1 className="text-2xl font-bold gradient-text">NALO</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            {/* Title */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                {isSignUp ? '회원가입' : '로그인'}
              </h2>
              <p className="text-slate-600">
                {isSignUp ? 'NALO에 가입하여 나만의 기획서를 관리하세요' : 'NALO에 오신 것을 환영합니다'}
              </p>
            </div>

            {/* Messages */}
            {message && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-green-700 text-sm">{message}</p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  이메일
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="비밀번호를 입력하세요"
                    required={!isSignUp || password.length > 0}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {isSignUp && (
                  <p className="text-xs text-slate-500 mt-1">
                    6자 이상 입력하세요
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                )}
                {isSignUp ? '회원가입' : '로그인'}
              </button>
            </form>

            {/* Magic Link */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">또는</span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleMagicLink}
                disabled={isLoading || !email}
                className="w-full mt-4 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 py-3 rounded-lg font-medium transition-colors"
              >
                매직 링크로 로그인
              </button>
              <p className="text-xs text-slate-500 text-center mt-2">
                비밀번호 없이 이메일로 간편 로그인
              </p>
            </div>

            {/* Toggle Sign Up/Login */}
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError('')
                  setMessage('')
                  setPassword('')
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {isSignUp ? '이미 계정이 있으신가요? 로그인하기' : '계정이 없으신가요? 회원가입하기'}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-slate-500">
            <p>NALO - 날로 먹는 프로젝트 기획</p>
            <p className="mt-1">AI가 도와주는 스마트한 프로젝트 기획 솔루션</p>
          </div>
        </div>
      </div>
    </div>
  )
}