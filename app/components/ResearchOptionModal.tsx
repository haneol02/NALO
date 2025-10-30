'use client';

import { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { getPerplexityApiKey, getUsePerplexityResearch } from '@/app/lib/apiKeyStorage';

interface ResearchOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: ResearchOptions) => void;
  topicTitle: string;
}

export interface ResearchOptions {
  includeWikipedia: boolean;
  includeAcademic: boolean;
  includePerplexity: boolean;
}

export default function ResearchOptionModal({
  isOpen,
  onClose,
  onConfirm,
  topicTitle
}: ResearchOptionModalProps) {
  const hasPerplexityKey = !!getPerplexityApiKey();
  const usePerplexityByDefault = getUsePerplexityResearch();

  const [options, setOptions] = useState<ResearchOptions>({
    includeWikipedia: true,
    includeAcademic: true,
    includePerplexity: hasPerplexityKey && usePerplexityByDefault
  });

  if (!isOpen) return null;

  const handleToggle = (key: keyof ResearchOptions) => {
    setOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleConfirm = () => {
    onConfirm(options);
    onClose();
  };

  const handleSkipResearch = () => {
    onConfirm({
      includeWikipedia: false,
      includeAcademic: false,
      includePerplexity: false
    });
    onClose();
  };

  const anyOptionSelected = options.includeWikipedia || options.includeAcademic || options.includePerplexity;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">
              리서치 옵션 선택
            </h3>
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-blue-600">{topicTitle}</span>에 대한 리서치 방법을 선택하세요
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 리서치 옵션들 */}
        <div className="space-y-3 mb-6">
          {/* Wikipedia */}
          <div
            onClick={() => handleToggle('includeWikipedia')}
            className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
              options.includeWikipedia
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${options.includeWikipedia ? 'text-blue-600' : 'text-slate-400'}`}>
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-800 mb-1">Wikipedia</h4>
                <p className="text-sm text-slate-600">
                  일반적인 배경 지식과 개념 정의를 제공합니다
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">무료</span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">빠름</span>
                </div>
              </div>
            </div>
          </div>

          {/* 학술 논문 */}
          <div
            onClick={() => handleToggle('includeAcademic')}
            className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
              options.includeAcademic
                ? 'border-purple-500 bg-purple-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${options.includeAcademic ? 'text-purple-600' : 'text-slate-400'}`}>
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-800 mb-1">학술 논문</h4>
                <p className="text-sm text-slate-600">
                  학술적 근거와 최신 연구 동향을 파악합니다
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">무료</span>
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">심층</span>
                </div>
              </div>
            </div>
          </div>

          {/* Perplexity */}
          <div
            onClick={() => hasPerplexityKey && handleToggle('includePerplexity')}
            className={`p-4 border-2 rounded-xl transition-all ${
              !hasPerplexityKey
                ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
                : options.includePerplexity
                ? 'border-orange-500 bg-orange-50 cursor-pointer'
                : 'border-slate-200 hover:border-slate-300 cursor-pointer'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${
                !hasPerplexityKey ? 'text-slate-400' : options.includePerplexity ? 'text-orange-600' : 'text-slate-400'
              }`}>
                {hasPerplexityKey ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-slate-800">Perplexity AI</h4>
                  <Sparkles className="w-4 h-4 text-orange-500" />
                </div>
                <p className="text-sm text-slate-600">
                  실시간 웹 검색으로 최신 트렌드와 뉴스를 분석합니다
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {hasPerplexityKey ? (
                    <>
                      <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">프리미엄</span>
                      <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">실시간</span>
                    </>
                  ) : (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">API 키 필요</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 안내 메시지 */}
        {!anyOptionSelected && (
          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              리서치 없이 바로 생성하면 품질이 낮을 수 있습니다
            </p>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSkipResearch}
            className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium transition-colors"
          >
            리서치 건너뛰기
          </button>
          <button
            onClick={handleConfirm}
            disabled={!anyOptionSelected}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {anyOptionSelected ? '리서치 시작' : '옵션을 선택하세요'}
          </button>
        </div>

        {/* 예상 시간 표시 */}
        {anyOptionSelected && (
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500">
              예상 소요 시간: {
                options.includePerplexity ? '약 2-3분' :
                (options.includeWikipedia && options.includeAcademic) ? '약 1-2분' :
                '약 30초-1분'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
