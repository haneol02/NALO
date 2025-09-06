'use client';

import { useState } from 'react';
import IdeaGenerator from './components/IdeaGenerator';
import SimpleTopicExplorer from './components/SimpleTopicExplorer';
import ResultDisplay from './components/ResultDisplay';
import { AlertTriangle, Frown } from 'lucide-react';

import { Idea } from '@/types';

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<'input' | 'topics' | 'results'>('input');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtractingKeywords, setIsExtractingKeywords] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [topicContext, setTopicContext] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [userPrompt, setUserPrompt] = useState<string>('');

  const handleStartTopicExploration = async (prompt: string) => {
    console.log('=== 주제 탐색 시작 ===');
    console.log('사용자 프롬프트:', prompt);
    
    setUserPrompt(prompt);
    setCurrentStep('topics');
    setError(null);
  };

  const handleDirectIdeaGeneration = async (prompt: string) => {
    console.log('=== 직접 아이디어 생성 시작 ===');
    console.log('사용자 프롬프트:', prompt);
    
    setCurrentStep('results');
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: prompt
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('아이디어 생성 API 에러:', errorData);
        const detailMessage = errorData.details ? ` (${errorData.details})` : '';
        throw new Error((errorData.error || '아이디어 생성에 실패했습니다.') + detailMessage);
      }

      const data = await response.json();
      console.log('=== 생성 결과 ===');
      console.log('생성된 아이디어 수:', data.ideas?.length || 0);
      console.log('참고 키워드:', data.keywords || []);
      console.log('사용된 토큰:', data.tokensUsed || 0);
      
      // Add unique IDs to ideas for business plan generation
      const ideasWithIds = data.ideas?.map((idea: any, index: number) => ({
        ...idea,
        id: idea.id || `idea_${Date.now()}_${index}`,
        originalPrompt: prompt,
        keywords: idea.keywords || data.keywords || [],
        input_keywords: idea.keywords || data.keywords || [],
        search_query: prompt
      })) || [];
      
      setIdeas(ideasWithIds);
      setSelectedKeywords(data.keywords || []);
    } catch (error) {
      console.error('아이디어 생성 에러:', error);
      setError(error instanceof Error ? error.message : '아이디어 생성 중 오류가 발생했습니다.');
      setIdeas([]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTopicSelected = (context: any) => {
    console.log('=== 최종 주제 선택됨 ===');
    console.log('선택된 컨텍스트:', context);
    
    setTopicContext(context);
    handleGenerateIdeas(context);
  };

  const handleGenerateIdeas = async (context?: any) => {
    console.log('=== 아이디어 생성 요청 시작 (새 플로우) ===');
    
    const contextToUse = context || topicContext;
    if (!contextToUse) {
      setError('주제 정보가 없습니다.');
      return;
    }
    
    setIsGenerating(true);
    setCurrentStep('results');
    setError(null);
    
    try {
      // Use new /api/ideas endpoint that only generates ideas without business plans
      const response = await fetch('/api/ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          originalPrompt: userPrompt,
          keywords: selectedKeywords,
          finalTopic: contextToUse.finalTopic || contextToUse.selectedPath?.join(' → ') || '',
          topicContext: contextToUse
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('아이디어 생성 API 에러:', errorData);
        const detailMessage = errorData.details ? ` (${errorData.details})` : '';
        throw new Error((errorData.error || '아이디어 생성에 실패했습니다.') + detailMessage);
      }

      const data = await response.json();
      console.log('=== 생성 결과 (아이디어만) ===');
      console.log('생성된 아이디어 수:', data.ideas?.length || 0);
      console.log('사용된 토큰:', data.tokensUsed || 0);
      
      // Add unique IDs and keywords to ideas for business plan generation
      const ideasWithIds = data.ideas?.map((idea: any, index: number) => ({
        ...idea,
        id: `idea_${Date.now()}_${index}`,
        // 키워드 정보 추가 - 개별 아이디어의 키워드 우선, 없으면 전체 키워드 또는 선택된 키워드 사용
        keywords: idea.keywords || data.keywords || selectedKeywords,
        searchQuery: contextToUse.finalTopic || '',
        input_keywords: idea.keywords || data.keywords || selectedKeywords,
        search_query: contextToUse.finalTopic || ''
      })) || [];
      
      setIdeas(ideasWithIds);
    } catch (error) {
      console.error('아이디어 생성 에러:', error);
      setError(error instanceof Error ? error.message : '아이디어 생성 중 오류가 발생했습니다.');
      setIdeas([]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBackToTopics = () => {
    setCurrentStep('topics');
  };

  const handleNewSearch = () => {
    setCurrentStep('input');
    setIdeas([]);
    setSelectedKeywords([]);
    setTopicContext(null);
    setError(null);
    setUserPrompt('');
  };

  return (
    <main className="min-h-screen page-transition no-select">
      {/* Header */}
      <header className="relative text-center py-12 sm:py-20 px-4 bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent"></div>
        
        <div className="relative max-w-4xl mx-auto">
          <div className="mb-12"></div>
          
          <div className="space-y-4 sm:space-y-6">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black mb-2 sm:mb-4 tracking-tight">
              <span className="gradient-text">NALO</span>
            </h1>
            <div className="mb-2"></div>
            <p className="text-sm min-[375px]:text-base min-[425px]:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-slate-700 mb-2 sm:mb-3 font-bold tracking-tight">
              날로 먹는 프로젝트 기획
            </p>
            <div className="max-w-2xl mx-auto">
              <p className="text-xs min-[375px]:text-sm min-[425px]:text-base sm:text-lg text-slate-600 leading-relaxed text-center px-4">
                AI가 도와주는 스마트한 프로젝트 기획 솔루션
              </p>
              <div className="flex items-center justify-center gap-1 min-[375px]:gap-2 sm:gap-3 mt-4 text-[9px] min-[375px]:text-[10px] sm:text-sm text-slate-500 px-4 flex-wrap">
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 min-[375px]:w-1.5 min-[375px]:h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full"></div>
                  <span>문장 입력</span>
                </div>
                <div className="w-2 min-[375px]:w-3 sm:w-4 h-px bg-slate-300"></div>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 min-[375px]:w-1.5 min-[375px]:h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></div>
                  <span>AI 분석</span>
                </div>
                <div className="w-2 min-[375px]:w-3 sm:w-4 h-px bg-slate-300"></div>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 min-[375px]:w-1.5 min-[375px]:h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full"></div>
                  <span>기획서 완성</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pb-8 sm:pb-16">
        {currentStep === 'input' && (
          <>
            <IdeaGenerator 
              onSearch={handleStartTopicExploration}
              isLoading={isGenerating}
              selectedKeywords={selectedKeywords}
              onDirectGeneration={handleDirectIdeaGeneration}
            />
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6 mt-6 max-w-4xl mx-auto shadow-sm">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-red-800 font-semibold mb-2">오류가 발생했습니다</h3>
                    <p className="text-red-700 leading-relaxed">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {currentStep === 'topics' && (
          <>
            <SimpleTopicExplorer 
              initialKeywords={selectedKeywords}
              onFinalSelection={handleTopicSelected}
              userPrompt={userPrompt}
            />
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6 mt-6 max-w-4xl mx-auto shadow-sm">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-red-800 font-semibold mb-2">오류가 발생했습니다</h3>
                    <p className="text-red-700 leading-relaxed">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {currentStep === 'results' && isGenerating && (
          <div className="text-center py-16 relative">
            {/* 파티클 효과 */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="particle"
                  style={{
                    width: `${Math.random() * 8 + 4}px`,
                    height: `${Math.random() * 8 + 4}px`,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`
                  }}
                ></div>
              ))}
            </div>
            
            {/* 중앙 로딩 스피너 */}
            <div className="relative z-10">
              <div className="inline-block relative mb-8">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-500 border-t-transparent loading-pulse"></div>
                <div className="absolute inset-2 animate-pulse rounded-full bg-gradient-to-r from-blue-400 to-white opacity-20"></div>
              </div>
              
              <h3 className="text-lg min-[375px]:text-xl font-semibold text-slate-700 mb-2 text-center loading-pulse">
                아이디어를 생성하고 있습니다
              </h3>
              <div className="mb-2"></div>
              <p className="text-xs min-[375px]:text-sm sm:text-base text-slate-500 text-center">
                AI가 최적의 아이디어를 준비 중입니다...
              </p>
              
              {/* 진행 단계 표시 */}
              <div className="flex justify-center items-center gap-2 mt-6">
                <div className="flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full bg-blue-400 animate-pulse`}
                      style={{
                        animationDelay: `${i * 0.2}s`
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'results' && !isGenerating && (
          <>
            {ideas.length > 0 ? (
              <ResultDisplay 
                ideas={ideas}
                onNewGeneration={handleNewSearch}
                keywords={selectedKeywords}
              />
            ) : (
              <div className="text-center py-16">
                <div className="max-w-2xl mx-auto">
                  <div className="w-24 h-24 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Frown className="w-12 h-12 text-red-600" />
                  </div>
                  <h3 className="text-xl min-[375px]:text-2xl font-bold text-slate-800 mb-4 text-center">
                    아이디어 생성에 실패했습니다
                  </h3>
                  <div className="mb-2"></div>
                  <p className="text-sm min-[375px]:text-base text-slate-600 mb-8 text-center">
                    죄송합니다. 아이디어를 생성할 수 없었습니다.<br className="sm:hidden" />
                    <span className="hidden sm:inline"> </span>다른 키워드로 다시 시도해보세요.
                  </p>
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <div>
                          <h4 className="text-red-800 font-semibold mb-1">오류 정보</h4>
                          <p className="text-red-700 text-sm">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="space-x-4">
                    <button
                      onClick={handleBackToTopics}
                      className="btn-secondary"
                    >
                      주제 선택으로 돌아가기
                    </button>
                    <button
                      onClick={handleNewSearch}
                      className="btn-primary"
                    >
                      새로운 키워드로 시도
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </main>
  );
}