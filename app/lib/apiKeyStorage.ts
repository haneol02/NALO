/**
 * API 키를 로컬 스토리지에 안전하게 저장하고 관리하는 유틸리티
 */

const API_KEY_STORAGE_KEY = 'nalo_openai_api_key';
const API_KEY_VERIFIED_STORAGE_KEY = 'nalo_openai_api_key_verified';
const PERPLEXITY_API_KEY_STORAGE_KEY = 'nalo_perplexity_api_key';
const PERPLEXITY_API_KEY_VERIFIED_STORAGE_KEY = 'nalo_perplexity_api_key_verified';
const USE_PERPLEXITY_RESEARCH_KEY = 'nalo_use_perplexity_research';

/**
 * API 키를 로컬 스토리지에 저장
 */
export const saveApiKey = (apiKey: string, verified: boolean = false): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    if (verified) {
      localStorage.setItem(API_KEY_VERIFIED_STORAGE_KEY, JSON.stringify({
        verified: true,
        verifiedAt: new Date().toISOString()
      }));
    }
  }
};

/**
 * 로컬 스토리지에서 API 키 가져오기
 */
export const getApiKey = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  }
  return null;
};

/**
 * API 키 삭제
 */
export const removeApiKey = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    localStorage.removeItem(API_KEY_VERIFIED_STORAGE_KEY);
  }
};

/**
 * API 키 유효성 검증 (형식만 체크)
 */
export const validateApiKeyFormat = (apiKey: string): boolean => {
  return apiKey.trim().startsWith('sk-') && apiKey.trim().length > 20;
};

/**
 * OpenAI API 키 검증 여부 확인
 */
export const isApiKeyVerified = (): boolean => {
  if (typeof window !== 'undefined') {
    const verifiedData = localStorage.getItem(API_KEY_VERIFIED_STORAGE_KEY);
    if (verifiedData) {
      try {
        const parsed = JSON.parse(verifiedData);
        return parsed.verified === true;
      } catch {
        return false;
      }
    }
  }
  return false;
};

/**
 * Perplexity API 키를 로컬 스토리지에 저장
 */
export const savePerplexityApiKey = (apiKey: string, verified: boolean = false): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PERPLEXITY_API_KEY_STORAGE_KEY, apiKey);
    if (verified) {
      localStorage.setItem(PERPLEXITY_API_KEY_VERIFIED_STORAGE_KEY, JSON.stringify({
        verified: true,
        verifiedAt: new Date().toISOString()
      }));
    }
  }
};

/**
 * 로컬 스토리지에서 Perplexity API 키 가져오기
 */
export const getPerplexityApiKey = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(PERPLEXITY_API_KEY_STORAGE_KEY);
  }
  return null;
};

/**
 * Perplexity API 키 삭제
 */
export const removePerplexityApiKey = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(PERPLEXITY_API_KEY_STORAGE_KEY);
    localStorage.removeItem(PERPLEXITY_API_KEY_VERIFIED_STORAGE_KEY);
  }
};

/**
 * Perplexity 리서치 사용 여부 저장
 */
export const saveUsePerplexityResearch = (usePerplexity: boolean): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USE_PERPLEXITY_RESEARCH_KEY, String(usePerplexity));
  }
};

/**
 * Perplexity 리서치 사용 여부 가져오기
 */
export const getUsePerplexityResearch = (): boolean => {
  if (typeof window !== 'undefined') {
    const value = localStorage.getItem(USE_PERPLEXITY_RESEARCH_KEY);
    return value === 'true';
  }
  return false;
};

/**
 * Perplexity API 키 유효성 검증 (형식만 체크)
 */
export const validatePerplexityApiKeyFormat = (apiKey: string): boolean => {
  return apiKey.trim().startsWith('pplx-') && apiKey.trim().length > 20;
};

/**
 * Perplexity API 키 검증 여부 확인
 */
export const isPerplexityApiKeyVerified = (): boolean => {
  if (typeof window !== 'undefined') {
    const verifiedData = localStorage.getItem(PERPLEXITY_API_KEY_VERIFIED_STORAGE_KEY);
    if (verifiedData) {
      try {
        const parsed = JSON.parse(verifiedData);
        return parsed.verified === true;
      } catch {
        return false;
      }
    }
  }
  return false;
};
