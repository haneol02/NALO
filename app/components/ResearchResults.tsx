'use client';

import { ArrowRight, Home } from 'lucide-react';
import ComprehensiveAnalysis from './research/ComprehensiveAnalysis';
import WikipediaSection from './research/WikipediaSection';
import AcademicSection from './research/AcademicSection';
import PerplexitySection from './research/PerplexitySection';

interface ResearchResultsProps {
  researchData: any;
  topicContext: any;
  onGenerateIdeas: () => void;
  onNewSearch: () => void;
  isGenerating: boolean;
  researchOptions?: {
    includeWikipedia: boolean;
    includeAcademic: boolean;
    includePerplexity: boolean;
  };
}

export default function ResearchResults({
  researchData,
  topicContext,
  onGenerateIdeas,
  onNewSearch,
  isGenerating,
  researchOptions
}: ResearchResultsProps) {
  if (!researchData) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <p className="text-slate-600">리서치 데이터가 없습니다.</p>
      </div>
    );
  }

  const { analysis, sources } = researchData;

  return (
    <div className="max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="text-center mb-8 mt-6 sm:mt-8 md:mt-12">
        <h2 className="text-base min-[375px]:text-lg sm:text-3xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-2 sm:gap-3 text-center px-4">
          <svg className="w-6 sm:w-8 h-6 sm:h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>리서치 결과</span>
          <span className="px-1.5 py-[2.5px] bg-blue-100 text-blue-600 rounded-full text-[10px] font-bold leading-none">BETA</span>
        </h2>
        <div className="mb-2"></div>
        <p className="text-xs min-[375px]:text-sm sm:text-lg text-slate-600 text-center px-4">
          <strong>{topicContext?.finalTopic}</strong>에 대한 종합 리서치 결과입니다
        </p>
      </div>

      {/* 종합 리서치 분석 */}
      <ComprehensiveAnalysis analysis={analysis} />

      {/* Wikipedia 리서치 */}
      <WikipediaSection
        data={sources?.wikipedia || []}
        isIncluded={researchOptions?.includeWikipedia !== false}
      />

      {/* 학술 논문 리서치 */}
      <AcademicSection
        data={sources?.openalex || []}
        isIncluded={researchOptions?.includeAcademic !== false}
      />

      {/* Perplexity 리서치 */}
      <PerplexitySection
        data={sources?.perplexity?.data}
        isIncluded={researchOptions?.includePerplexity === true}
      />

      {/* 액션 버튼 */}
      <div className="mt-8 text-center">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
          <h3 className="text-lg font-bold text-slate-800 mb-3">
            리서치 완료! 이제 아이디어를 생성해보세요
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            위 리서치 결과를 바탕으로 현실적이고 차별화된 프로젝트 아이디어를 생성합니다
          </p>

          <button
            onClick={onGenerateIdeas}
            disabled={isGenerating}
            className="btn-primary btn-click px-6 py-3 text-lg font-semibold flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                아이디어 생성 중...
              </>
            ) : (
              <>
                <ArrowRight className="w-5 h-5" />
                리서치 기반 아이디어 생성
              </>
            )}
          </button>
        </div>
      </div>

      {/* 통합 네비게이션 */}
      <div className="flex justify-center items-center space-x-4 mt-8">
        <button
          onClick={onNewSearch}
          className="btn-secondary btn-click px-6 py-3 flex items-center gap-2"
          disabled={isGenerating}
        >
          <Home className="w-4 h-4" />
          홈으로
        </button>
      </div>
    </div>
  );
}
