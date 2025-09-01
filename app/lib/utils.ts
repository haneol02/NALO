import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 토큰 사용량 추정
export function estimateTokens(text: string): number {
  // 대략적인 토큰 추정 (영어 기준 4글자 = 1토큰, 한글은 더 효율적)
  return Math.ceil(text.length / 3);
}

// 날짜 포맷팅
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// 숫자 포맷팅 (천 단위 콤마)
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(num);
}

// 개발 기간 포맷팅
export function formatDuration(weeks: number): string {
  if (weeks < 4) {
    return `${weeks}주`;
  } else if (weeks < 52) {
    const months = Math.round(weeks / 4.33);
    return `${months}개월`;
  } else {
    const years = Math.round(weeks / 52);
    return `${years}년`;
  }
}

// 난이도/점수 텍스트 변환
export function getDifficultyText(score: number): string {
  const levels = ['매우 쉬움', '쉬움', '보통', '어려움', '매우 어려움'];
  return levels[score - 1] || '보통';
}

export function getMarketPotentialText(score: number): string {
  const levels = ['매우 낮음', '낮음', '보통', '높음', '매우 높음'];
  return levels[score - 1] || '보통';
}

export function getCompetitionText(score: number): string {
  const levels = ['매우 낮음', '낮음', '보통', '높음', '매우 높음'];
  return levels[score - 1] || '보통';
}

// 로컬 스토리지 헬퍼
export const localStorage = {
  get<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error getting localStorage key "${key}":`, error);
      return defaultValue;
    }
  },

  set(key: string, value: any): void {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  },
};

// 디바운스 함수
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 랜덤 아이디 생성
export function generateId(length: number = 8): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

// URL 안전한 텍스트 변환
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// 에러 메시지 한글화
export function getErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  
  const message = error?.message || error?.error || '알 수 없는 오류가 발생했습니다.';
  
  // 일반적인 에러 메시지 번역
  const translations: { [key: string]: string } = {
    'Network Error': '네트워크 오류가 발생했습니다.',
    'Unauthorized': '인증이 필요합니다.',
    'Forbidden': '접근이 거부되었습니다.',
    'Not Found': '요청한 리소스를 찾을 수 없습니다.',
    'Internal Server Error': '서버 내부 오류가 발생했습니다.',
    'Service Unavailable': '서비스를 일시적으로 사용할 수 없습니다.',
  };
  
  return translations[message] || message;
}

// 성능 측정 헬퍼
export class PerformanceMonitor {
  private static timers: { [key: string]: number } = {};
  
  static start(label: string): void {
    this.timers[label] = Date.now();
  }
  
  static end(label: string): number {
    const startTime = this.timers[label];
    if (!startTime) {
      console.warn(`No timer found for label: ${label}`);
      return 0;
    }
    
    const duration = Date.now() - startTime;
    delete this.timers[label];
    
    console.log(`⏱️ ${label}: ${duration}ms`);
    return duration;
  }
}