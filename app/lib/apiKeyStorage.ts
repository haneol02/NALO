/**
 * API 키를 로컬 스토리지에 안전하게 저장하고 관리하는 유틸리티
 */

const API_KEY_STORAGE_KEY = 'nalo_openai_api_key';

/**
 * API 키를 로컬 스토리지에 저장
 */
export const saveApiKey = (apiKey: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
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
  }
};

/**
 * API 키 유효성 검증 (형식만 체크)
 */
export const validateApiKeyFormat = (apiKey: string): boolean => {
  return apiKey.trim().startsWith('sk-') && apiKey.trim().length > 20;
};
