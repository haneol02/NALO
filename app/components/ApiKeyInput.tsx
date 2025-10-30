'use client';

import { useState, useEffect } from 'react';
import {
  saveApiKey, getApiKey, removeApiKey, validateApiKeyFormat, isApiKeyVerified,
  savePerplexityApiKey, getPerplexityApiKey, removePerplexityApiKey, validatePerplexityApiKeyFormat, isPerplexityApiKeyVerified
} from '@/app/lib/apiKeyStorage';

interface ApiKeyInputProps {
  onApiKeyChange?: (hasKey: boolean) => void;
}

export default function ApiKeyInput({ onApiKeyChange }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // Perplexity API 관련 상태
  const [perplexityApiKey, setPerplexityApiKey] = useState('');
  const [isEditingPerplexity, setIsEditingPerplexity] = useState(false);
  const [hasStoredPerplexityKey, setHasStoredPerplexityKey] = useState(false);
  const [perplexityError, setPerplexityError] = useState('');

  useEffect(() => {
    const storedKey = getApiKey();
    if (storedKey) {
      setHasStoredKey(true);
      onApiKeyChange?.(true);
    } else {
      setIsEditing(true);
      onApiKeyChange?.(false);
    }

    // Perplexity API 키 로드
    const storedPerplexityKey = getPerplexityApiKey();
    if (storedPerplexityKey) {
      setHasStoredPerplexityKey(true);
    } else {
      setIsEditingPerplexity(true);
    }
  }, [onApiKeyChange]);

  const handleSave = async () => {
    setError('');

    if (!apiKey.trim()) {
      setError('API 키를 입력해주세요');
      return;
    }

    if (!validateApiKeyFormat(apiKey)) {
      setError('올바른 OpenAI API 키 형식이 아닙니다 (sk-로 시작해야 함)');
      return;
    }

    // 기존 키와 동일하고 이미 검증되었으면 검증 스킵
    const existingKey = getApiKey();
    if (existingKey === apiKey.trim() && isApiKeyVerified()) {
      console.log('이미 검증된 키입니다. 검증을 스킵합니다.');
      setHasStoredKey(true);
      setIsEditing(false);
      setApiKey('');
      onApiKeyChange?.(true);
      return;
    }

    // API 키 검증
    setIsValidating(true);
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('유효하지 않은 API 키입니다. 다시 확인해주세요.');
        } else if (response.status === 429) {
          setError('API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setError('API 키 검증 중 오류가 발생했습니다.');
        }
        setIsValidating(false);
        return;
      }

      // 검증 성공 - 검증 기록과 함께 저장
      saveApiKey(apiKey.trim(), true);
      setHasStoredKey(true);
      setIsEditing(false);
      setApiKey('');
      onApiKeyChange?.(true);
    } catch (error) {
      setError('API 키 검증 중 네트워크 오류가 발생했습니다.');
      console.error('API key validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemove = () => {
    if (confirm('저장된 API 키를 삭제하시겠습니까?')) {
      removeApiKey();
      setHasStoredKey(false);
      setIsEditing(true);
      setApiKey('');
      onApiKeyChange?.(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
  };

  const handleCancel = () => {
    if (hasStoredKey) {
      setIsEditing(false);
      setApiKey('');
      setError('');
    }
  };

  // Perplexity API 키 관련 핸들러
  const [isValidatingPerplexity, setIsValidatingPerplexity] = useState(false);

  const handleSavePerplexity = async () => {
    setPerplexityError('');

    if (!perplexityApiKey.trim()) {
      setPerplexityError('Perplexity API 키를 입력해주세요');
      return;
    }

    if (!validatePerplexityApiKeyFormat(perplexityApiKey)) {
      setPerplexityError('올바른 Perplexity API 키 형식이 아닙니다 (pplx-로 시작해야 함)');
      return;
    }

    // 기존 키와 동일하고 이미 검증되었으면 검증 스킵
    const existingKey = getPerplexityApiKey();
    if (existingKey === perplexityApiKey.trim() && isPerplexityApiKeyVerified()) {
      console.log('이미 검증된 Perplexity 키입니다. 검증을 스킵합니다.');
      setHasStoredPerplexityKey(true);
      setIsEditingPerplexity(false);
      setPerplexityApiKey('');
      return;
    }

    // API 키 검증
    setIsValidatingPerplexity(true);
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'user',
              content: 'hi'
            }
          ],
          max_tokens: 10,
          temperature: 0
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setPerplexityError('유효하지 않은 API 키입니다. 다시 확인해주세요.');
        } else if (response.status === 429) {
          setPerplexityError('API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setPerplexityError('API 키 검증 중 오류가 발생했습니다.');
        }
        setIsValidatingPerplexity(false);
        return;
      }

      // 검증 성공 - 검증 기록과 함께 저장
      savePerplexityApiKey(perplexityApiKey.trim(), true);
      setHasStoredPerplexityKey(true);
      setIsEditingPerplexity(false);
      setPerplexityApiKey('');
    } catch (error) {
      setPerplexityError('API 키 검증 중 네트워크 오류가 발생했습니다.');
      console.error('Perplexity API key validation error:', error);
    } finally {
      setIsValidatingPerplexity(false);
    }
  };

  const handleRemovePerplexity = () => {
    if (confirm('저장된 Perplexity API 키를 삭제하시겠습니까?')) {
      removePerplexityApiKey();
      setHasStoredPerplexityKey(false);
      setIsEditingPerplexity(true);
      setPerplexityApiKey('');
    }
  };

  const handleEditPerplexity = () => {
    setIsEditingPerplexity(true);
    setPerplexityError('');
  };

  const handleCancelPerplexity = () => {
    if (hasStoredPerplexityKey) {
      setIsEditingPerplexity(false);
      setPerplexityApiKey('');
      setPerplexityError('');
    }
  };

  if (hasStoredKey && !isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex-1">
            <span className="text-sm text-green-700">✓ OpenAI API 키가 저장되어 있습니다</span>
          </div>
          <button
            onClick={handleEdit}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            변경
          </button>
          <button
            onClick={handleRemove}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            삭제
          </button>
        </div>

        {/* Perplexity API 키 입력 - OpenAI 키 저장 후 표시 */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 mb-2">Perplexity API (선택사항)</div>

          {hasStoredPerplexityKey && !isEditingPerplexity ? (
            <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex-1">
                <span className="text-sm text-purple-700">✓ Perplexity API 키가 저장되어 있습니다</span>
              </div>
              <button
                onClick={handleEditPerplexity}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                변경
              </button>
              <button
                onClick={handleRemovePerplexity}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                삭제
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={perplexityApiKey}
                  onChange={(e) => setPerplexityApiKey(e.target.value)}
                  placeholder="Perplexity API 키를 입력하세요 (pplx-...)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  onKeyDown={(e) => e.key === 'Enter' && handleSavePerplexity()}
                />
                <button
                  onClick={handleSavePerplexity}
                  disabled={isValidatingPerplexity}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:bg-purple-400 disabled:cursor-not-allowed"
                >
                  {isValidatingPerplexity ? '검증 중...' : '저장'}
                </button>
                {hasStoredPerplexityKey && (
                  <button
                    onClick={handleCancelPerplexity}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
                  >
                    취소
                  </button>
                )}
              </div>
              {perplexityError && (
                <p className="text-sm text-red-600">{perplexityError}</p>
              )}
              <p className="text-xs text-gray-500">
                리서치 시 실시간 웹 검색을 위한 선택적 기능입니다. 리서치 단계에서 사용 여부를 선택할 수 있습니다.
                <a
                  href="https://www.perplexity.ai/settings/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline ml-1"
                >
                  API 키 발급받기 →
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="OpenAI API 키를 입력하세요 (sk-...)"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <button
          onClick={handleSave}
          disabled={isValidating}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {isValidating ? '검증 중...' : '저장'}
        </button>
        {hasStoredKey && (
          <button
            onClick={handleCancel}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
          >
            취소
          </button>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <p className="text-xs text-gray-500">
        API 키는 브라우저에만 저장되며 서버로 전송되지 않습니다.
        <a
          href="https://platform.openai.com/api-keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline ml-1"
        >
          API 키 발급받기 →
        </a>
      </p>
    </div>
  );
}
