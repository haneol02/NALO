'use client';

import { useState, useEffect } from 'react';
import { saveApiKey, getApiKey, removeApiKey, validateApiKeyFormat } from '@/app/lib/apiKeyStorage';

interface ApiKeyInputProps {
  onApiKeyChange?: (hasKey: boolean) => void;
}

export default function ApiKeyInput({ onApiKeyChange }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const storedKey = getApiKey();
    if (storedKey) {
      setHasStoredKey(true);
      onApiKeyChange?.(true);
    } else {
      setIsEditing(true);
      onApiKeyChange?.(false);
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

      // 검증 성공
      saveApiKey(apiKey.trim());
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

  if (hasStoredKey && !isEditing) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex-1">
          <span className="text-sm text-green-700">✓ API 키가 저장되어 있습니다</span>
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
