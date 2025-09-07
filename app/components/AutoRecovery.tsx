'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'

interface AutoRecoveryProps {
  children: React.ReactNode
}

export default function AutoRecovery({ children }: AutoRecoveryProps) {
  const [hasError, setHasError] = useState(false)
  const [isRecovering, setIsRecovering] = useState(false)
  const [errorCount, setErrorCount] = useState(0)
  const [lastErrorTime, setLastErrorTime] = useState<number>(0)

  useEffect(() => {
    let errorDetected = false
    const MAX_ERRORS = 3
    const ERROR_RESET_TIME = 10000 // 10초 후 에러 카운트 초기화
    const RECOVERY_DELAY = 2000 // 2초 후 자동 새로고침

    // JavaScript 에러 감지
    const handleError = (event: ErrorEvent) => {
      console.error('JavaScript 오류 감지:', event.error)
      
      // SyntaxError 특별 처리
      if (event.error?.name === 'SyntaxError' || event.message?.includes('SyntaxError')) {
        console.warn('SyntaxError 감지 - 자동 복구 시작')
        triggerRecovery()
        return
      }

      // 일반 에러 처리
      if (!errorDetected) {
        errorDetected = true
        checkAndRecover()
      }
    }

    // 미처리된 Promise 에러 감지
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('미처리된 Promise 에러 감지:', event.reason)
      if (!errorDetected) {
        errorDetected = true
        checkAndRecover()
      }
    }

    // 에러 빈도 확인 후 복구 결정
    const checkAndRecover = () => {
      const now = Date.now()
      
      // 10초 이내에 발생한 에러가 아니면 카운트 초기화
      if (now - lastErrorTime > ERROR_RESET_TIME) {
        setErrorCount(1)
      } else {
        setErrorCount(prev => prev + 1)
      }
      
      setLastErrorTime(now)
      
      // 에러가 너무 많이 발생하면 복구 시도
      setErrorCount(currentCount => {
        if (currentCount >= MAX_ERRORS) {
          console.warn(`${MAX_ERRORS}개 이상의 에러 감지 - 자동 복구 시작`)
          triggerRecovery()
          return 0 // 카운트 초기화
        }
        return currentCount
      })
    }

    // 복구 시작
    const triggerRecovery = () => {
      if (isRecovering) return // 이미 복구 중이면 무시
      
      setHasError(true)
      setIsRecovering(true)
      
      console.log('페이지 자동 복구 시작...')
      
      setTimeout(() => {
        window.location.reload()
      }, RECOVERY_DELAY)
    }

    // 컴포넌트 로딩 실패 감지 (DOM 검사)
    const checkComponentHealth = () => {
      try {
        // 주요 컴포넌트들이 로드되었는지 확인
        const authButton = document.querySelector('[data-testid="auth-button"]')
        const mainContent = document.querySelector('main')
        const buttons = document.querySelectorAll('button')
        const hasReactContent = document.querySelector('[data-reactroot]') || 
                               document.querySelector('#__next') ||
                               document.querySelectorAll('div').length > 5

        // 콘솔에서 에러 메시지 확인
        const hasConsoleErrors = window.console && 
                                typeof window.console.error === 'function'

        // SyntaxError 특별 검사 - 전역 오류 객체가 있는지
        const hasSyntaxError = window.onerror !== null

        console.log('컴포넌트 건강 상태 체크:', {
          authButton: !!authButton,
          mainContent: !!mainContent,
          buttonCount: buttons.length,
          hasReactContent: !!hasReactContent,
          totalDivElements: document.querySelectorAll('div').length
        })

        // 주요 컴포넌트가 5초 후에도 없으면 문제가 있다고 판단
        if (!authButton && !mainContent && buttons.length === 0) {
          console.warn('주요 컴포넌트 로딩 실패 감지 - 복구 시작')
          triggerRecovery()
          return
        }

        // React 컨텐츠가 전혀 없으면 문제
        if (!hasReactContent) {
          console.warn('React 컨텐츠 로딩 실패 감지 - 복구 시작')
          triggerRecovery()
          return
        }

        // 빈 페이지 감지
        const bodyContent = document.body.textContent || ''
        if (bodyContent.trim().length < 10) {
          console.warn('빈 페이지 감지 - 복구 시작')
          triggerRecovery()
          return
        }

        console.log('페이지 상태 정상')
      } catch (error) {
        console.error('페이지 건강 상태 체크 중 오류:', error)
        triggerRecovery()
      }
    }

    // 이벤트 리스너 등록
    window.addEventListener('error', handleError, true)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    // 5초 후 컴포넌트 상태 검사
    const healthCheckTimer = setTimeout(checkComponentHealth, 5000)

    // 정리 함수
    return () => {
      window.removeEventListener('error', handleError, true)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      clearTimeout(healthCheckTimer)
    }
  }, [isRecovering, lastErrorTime])

  // 복구 중 표시
  if (hasError && isRecovering) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="inline-block relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
            <div className="absolute inset-2 animate-pulse rounded-full bg-gradient-to-r from-blue-400 to-white opacity-20"></div>
          </div>
          
          <h2 className="text-xl font-semibold text-slate-700 mb-2">
            페이지를 복구하고 있습니다
          </h2>
          
          <p className="text-slate-500 text-sm mb-4">
            일시적인 오류가 감지되어 자동으로 새로고침됩니다...
          </p>
          
          <div className="flex justify-center items-center gap-2">
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"
                  style={{
                    animationDelay: `${i * 0.2}s`
                  }}
                ></div>
              ))}
            </div>
          </div>

          {/* 수동 새로고침 버튼 */}
          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            지금 새로고침
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}