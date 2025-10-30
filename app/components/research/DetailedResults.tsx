'use client';

import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, BookOpen, FileText, Globe, TrendingUp } from 'lucide-react';

interface DetailedResultsProps {
  sources: any;
  summary: any;
  researchOptions: any;
}

export default function DetailedResults({ sources, summary, researchOptions }: DetailedResultsProps) {
  const [showDetailedResults, setShowDetailedResults] = useState(false);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 sm:p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2">
          <Search className="w-5 h-5" />
          세부 리서치 결과
        </h3>
        <button
          onClick={() => setShowDetailedResults(!showDetailedResults)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm font-medium"
        >
          {showDetailedResults ? (
            <>
              <ChevronUp className="w-4 h-4" />
              접기
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              펼치기
            </>
          )}
        </button>
      </div>

      {!showDetailedResults && (
        <p className="text-sm text-slate-600">
          각 리서치 소스별 상세 결과를 확인하려면 펼치기 버튼을 클릭하세요.
        </p>
      )}

      {showDetailedResults && (
        <div>
          <h4 className="text-base font-bold text-blue-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            데이터 요약
          </h4>

          {/* 리서치 소스 표시 */}
          <div className="mb-4 pb-4 border-b border-blue-200">
            <div className="text-sm font-medium text-blue-800 mb-2">리서치 소스</div>
            <div className="flex flex-wrap gap-2">
              {researchOptions?.includeWikipedia && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  Wikipedia
                </span>
              )}
              {researchOptions?.includeAcademic && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  학술 논문
                </span>
              )}
              {researchOptions?.includePerplexity && (
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Perplexity AI
                </span>
              )}
            </div>
          </div>

          {/* 검색 통계 */}
          <div className="bg-white rounded p-3 mb-4">
            <h4 className="text-sm font-bold text-blue-800 mb-2">검색 통계</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <p>• Wikipedia 검색: {sources?.wikipedia?.totalSearches || 0}회 시도 ({summary?.foundWikipedia || 0}개 발견)</p>
              <p>• 학술논문 검색: {sources?.openalex?.totalSearches || 0}회 시도 ({summary?.totalPapers || 0}개 논문)</p>
              {researchOptions?.includePerplexity && (
                <p>• Perplexity AI: 실시간 웹 리서치 {sources?.perplexity?.success ? '성공' : '미실행'}</p>
              )}
            </div>
          </div>

          {/* 수집된 데이터 수 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {researchOptions?.includeWikipedia !== false && (
              <div className="text-center bg-white rounded p-3">
                <div className="text-2xl font-bold text-blue-600">
                  {summary?.foundWikipedia || 0}
                </div>
                <div className="text-xs text-slate-600">Wikipedia 결과</div>
              </div>
            )}

            {researchOptions?.includeAcademic !== false && (
              <>
                <div className="text-center bg-white rounded p-3">
                  <div className="text-2xl font-bold text-blue-600">
                    {summary?.foundAcademic || 0}
                  </div>
                  <div className="text-xs text-slate-600">학술 검색 성공</div>
                </div>

                <div className="text-center bg-white rounded p-3">
                  <div className="text-2xl font-bold text-blue-600">
                    {summary?.totalPapers || 0}
                  </div>
                  <div className="text-xs text-slate-600">관련 논문 수</div>
                </div>
              </>
            )}

            <div className="text-center bg-white rounded p-3">
              <div className="text-2xl font-bold text-blue-600">
                {summary?.totalSearches || 0}
              </div>
              <div className="text-xs text-slate-600">총 검색 시도</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
