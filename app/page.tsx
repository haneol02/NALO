'use client';

import { useState } from 'react';
import IdeaGenerator from './components/IdeaGenerator';
import SearchResults from './components/SearchResults';
import ResultDisplay from './components/ResultDisplay';

import { Idea } from '@/types';

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<'input' | 'search' | 'results'>('input');
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusArea, setFocusArea] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [qualityScore, setQualityScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleSearchKeywords = async (keywords: string[]) => {
    console.log('=== 키워드 검색 요청 시작 ===');
    console.log('선택된 키워드:', keywords);
    
    setIsGenerating(true);
    setSelectedKeywords(keywords);
    setError(null);
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keywords }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '검색에 실패했습니다.');
      }

      const data = await response.json();
      console.log('검색 결과:', data);
      
      setSearchResults(data.results || []);
      setSearchQuery(data.searchQuery || '');
      setFocusArea(data.focusArea || '');
      setKeywords(data.keywords || []);
      setQualityScore(data.qualityScore || 0);
      setCurrentStep('search');
    } catch (error) {
      console.error('검색 에러:', error);
      setError(error instanceof Error ? error.message : '검색 중 오류가 발생했습니다.');
      setSearchResults([]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateIdeas = async () => {
    console.log('=== 아이디어 생성 요청 시작 ===');
    
    setIsGenerating(true);
    setCurrentStep('results');
    setError(null);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          keywords: selectedKeywords,
          searchResults: searchResults,
          searchQuery: searchQuery
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
      
      setIdeas(data.ideas || []);
    } catch (error) {
      console.error('아이디어 생성 에러:', error);
      setError(error instanceof Error ? error.message : '아이디어 생성 중 오류가 발생했습니다.');
      setIdeas([]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBackToSearch = () => {
    setCurrentStep('search');
  };

  const handleNewSearch = () => {
    setCurrentStep('input');
    setIdeas([]);
    setSearchResults([]);
    setSelectedKeywords([]);
    setSearchQuery('');
    setFocusArea('');
    setKeywords([]);
    setQualityScore(0);
    setError(null);
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="text-center py-16 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">NALO</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-700 mb-2 font-medium">
            날로 먹는 프로젝트 기획
          </p>
          <p className="text-lg text-slate-600 mb-8">
            키워드 입력 → 검색 결과 확인 → 아이디어 생성 → 상세 기획서
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        {currentStep === 'input' && (
          <>
            <IdeaGenerator 
              onSearch={handleSearchKeywords}
              isLoading={isGenerating}
              selectedKeywords={selectedKeywords}
            />
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6 max-w-4xl mx-auto">
                <div className="flex items-start gap-2">
                  <span className="text-red-500 text-xl">⚠️</span>
                  <div>
                    <h3 className="text-red-800 font-semibold mb-1">오류가 발생했습니다</h3>
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {currentStep === 'search' && (
          <>
            <SearchResults 
              searchQuery={searchQuery}
              searchResults={searchResults}
              selectedKeywords={selectedKeywords}
              focusArea={focusArea}
              keywords={keywords}
              qualityScore={qualityScore}
              onGenerateIdeas={handleGenerateIdeas}
              onBackToInput={handleNewSearch}
              isLoading={isGenerating}
            />
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                <div className="flex items-start gap-2">
                  <span className="text-red-500 text-xl">⚠️</span>
                  <div>
                    <h3 className="text-red-800 font-semibold mb-1">오류가 발생했습니다</h3>
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {currentStep === 'results' && isGenerating && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-6"></div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              아이디어를 생성하고 있습니다
            </h3>
            <p className="text-slate-500">
              검색 결과를 바탕으로 최적의 아이디어를 준비 중입니다.
            </p>
          </div>
        )}

        {currentStep === 'results' && !isGenerating && (
          <>
            {ideas.length > 0 ? (
              <ResultDisplay 
                ideas={ideas}
                onBackToSearch={handleBackToSearch}
                onNewGeneration={handleNewSearch}
              />
            ) : (
              <div className="text-center py-16">
                <div className="max-w-2xl mx-auto">
                  <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">😵</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-4">
                    아이디어 생성에 실패했습니다
                  </h3>
                  <p className="text-slate-600 mb-8">
                    죄송합니다. 아이디어를 생성할 수 없었습니다. 다른 키워드로 다시 시도해보세요.
                  </p>
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-2">
                        <span className="text-red-500 text-xl">⚠️</span>
                        <div>
                          <h4 className="text-red-800 font-semibold mb-1">오류 정보</h4>
                          <p className="text-red-700 text-sm">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="space-x-4">
                    <button
                      onClick={handleBackToSearch}
                      className="btn-secondary"
                    >
                      검색 결과로 돌아가기
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