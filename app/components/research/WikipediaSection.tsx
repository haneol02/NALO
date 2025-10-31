'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

interface WikipediaSectionProps {
  data: any[];
  isIncluded: boolean;
  searchKeywords?: string[];
}

export default function WikipediaSection({ data, isIncluded, searchKeywords }: WikipediaSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isIncluded) {
    return null;
  }

  const successfulResults = Array.isArray(data) ? data.filter((r: any) => r?.success && r?.data) : [];

  if (successfulResults.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border-2 border-green-200 rounded-xl p-4 sm:p-6 mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="text-lg font-bold text-green-900">
              Wikipedia 리서치
            </h3>
            <p className="text-sm text-green-700">
              {successfulResults.length}개의 문서 발견
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-green-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-green-600" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-6 space-y-4">
          {/* 검색 키워드 표시 */}
          {searchKeywords && searchKeywords.length > 0 && (
            <div className="bg-green-100 rounded-lg p-3 border border-green-300">
              <p className="text-xs font-semibold text-green-800 mb-2">사용된 검색 키워드:</p>
              <div className="flex flex-wrap gap-2">
                {searchKeywords.map((keyword, idx) => (
                  <span key={idx} className="px-2 py-1 bg-white text-green-700 rounded text-xs font-medium border border-green-200">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {successfulResults.map((result, index) => (
            <div key={index} className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="mb-2">
                <h4 className="font-semibold text-green-900 text-base mb-1">
                  {result.data.title}
                </h4>
                <p className="text-xs text-green-600">
                  검색 키워드: <span className="font-medium">{result.keyword}</span>
                </p>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed mb-3 break-words">
                {result.data.extract}
              </p>

              {result.data.url && (
                <a
                  href={result.data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-600 hover:text-green-700 underline inline-flex items-center gap-1"
                >
                  Wikipedia에서 보기
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
