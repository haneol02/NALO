'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Lightbulb, Play, Search, Home } from 'lucide-react';

interface SimpleTopic {
  id: string;
  title: string;
  description: string;
  category: string;
  level: number;
  parentId?: string;
  isExpanded?: boolean;
  expandedKeywords?: string[];
  keywords?: string[];
}

interface SimpleTopicExplorerProps {
  initialKeywords: string[];
  onFinalSelection: (context: any, withResearch?: boolean) => void;
  userPrompt?: string;
  isGeneratingIdeas?: boolean; // 아이디어 생성 중 상태
  apiKey?: string; // API 키 추가
}

export default function SimpleTopicExplorer({
  initialKeywords,
  onFinalSelection,
  userPrompt = '',
  isGeneratingIdeas = false,
  apiKey
}: SimpleTopicExplorerProps) {
  const [currentTopics, setCurrentTopics] = useState<SimpleTopic[]>([]);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [currentKeywords, setCurrentKeywords] = useState<string[]>(initialKeywords);
  const [isLoading, setIsLoading] = useState(false);
  const [expandingTopicId, setExpandingTopicId] = useState<string | null>(null);
  const [additionalKeywords, setAdditionalKeywords] = useState<string>('');
  const [topicCounter, setTopicCounter] = useState<number>(1);
  const [hasLoadedTopics, setHasLoadedTopics] = useState<boolean>(false);
  const loadingRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(false);


  // 컴포넌트 마운트 시에만 실행
  useEffect(() => {
    if (mountedRef.current) return; // 이미 마운트됨
    mountedRef.current = true;
    
    const now = Date.now();
    console.log(`[${now}] 컴포넌트 첫 마운트 - 주제 로딩 시작`);
    
    if (!initialKeywords.length && !userPrompt) {
      console.log(`[${now}] 키워드도 프롬프트도 없음 - 스킵`);
      return;
    }
    
    // 함수를 useEffect 내부에서 직접 정의
    const loadTopics = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/topics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: userPrompt || '',
            keywords: initialKeywords,
            level: 1,
            apiKey
          }),
        });

        if (!response.ok) {
          throw new Error('주제 로드 실패');
        }

        const data = await response.json();
        console.log('초기 주제 API 응답:', data);
        
        if (data.success && data.topics) {
          console.log('주제 데이터 설정:', data.topics);
          const numberedTopics = data.topics.map((topic: SimpleTopic, index: number) => ({
            ...topic,
            id: `topic_${index + 1}`,
            level: 1,
            keywords: initialKeywords
          }));
          setCurrentTopics(numberedTopics);
          setTopicCounter(numberedTopics.length + 1);
          setSelectedPath([]);
          setHasLoadedTopics(true); // 로딩 완료 플래그 설정
        } else {
          console.error('유효하지 않은 응답 구조:', data);
          throw new Error('유효하지 않은 응답');
        }
      } catch (error) {
        console.error('초기 주제 로드 실패:', error);
        setCurrentTopics([]);
        setTopicCounter(1);
      } finally {
        setIsLoading(false);
        loadingRef.current = false; // 로딩 완료 후 리셋
      }
    };
    
    loadTopics();
  }, [initialKeywords, userPrompt]); // 의존성 배열에 사용되는 props 추가

  // 주제 상태 모니터링 (디버깅용)
  useEffect(() => {
    console.log('currentTopics 상태 업데이트:', currentTopics);
  }, [currentTopics]);

  const handleDirectIdeaGeneration = (topic: SimpleTopic, withResearch: boolean = false) => {
    // 이미 로딩 중이면 중복 실행 방지
    if (isLoading || isGeneratingIdeas) {
      console.log('이미 아이디어 생성 중이므로 중복 실행 방지');
      return;
    }
    
    const newPath = [...selectedPath, topic.title];
    
    // Enhanced context generation as per improvement plan
    const enhancedContext = {
      // 기존 정보
      keywords: currentKeywords,
      selectedPath: newPath,
      finalTopic: topic.title,
      category: topic.category,
      
      // 추가 컨텍스트 정보
      topicHierarchy: {
        baseTopics: currentTopics.filter(t => !t.parentId).map(t => t.title),
        selectedTopicLevel: topic.level,
        parentTopic: topic.parentId ? 
          currentTopics.find(t => t.id === topic.parentId)?.title : null,
        childTopics: currentTopics.filter(t => t.parentId === topic.id).map(t => t.title)
      },
      
      // 탐색 메타데이터
      explorationMetadata: {
        totalTopicsExplored: currentTopics.length,
        expansionCount: currentTopics.filter(t => t.parentId).length,
        additionalKeywords: additionalKeywords.split(',').map(k => k.trim()).filter(k => k),
        userInteractionPattern: getUserInteractionPattern() // 사용자 탐색 패턴 분석
      }
    };
    
    onFinalSelection(enhancedContext, withResearch);
  };

  const handleTopicExpansion = async (topic: SimpleTopic, customKeywords?: string) => {
    setExpandingTopicId(topic.id);
    
    const additionalPrompt = customKeywords || additionalKeywords;

    try {
      const requestBody = {
        prompt: userPrompt || '',
        keywords: initialKeywords,
        parentTopic: topic.title,
        level: topic.level + 1,
        additionalPrompt: additionalPrompt?.trim() || undefined,
        apiKey
      };

      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('주제 확장 실패');
      }

      const data = await response.json();
      if (data.success && data.topics) {        
        // 기존 주제들에 새로운 확장 주제들을 추가
        const newTopics = data.topics.map((newTopic: SimpleTopic, index: number) => ({
          ...newTopic,
          id: `topic_${topicCounter + index}`,
          parentId: topic.id,
          isExpanded: true,
          level: topic.level + 1,
          expandedKeywords: additionalPrompt ? [additionalPrompt] : null, // 확장 프롬프트 정보 저장
          keywords: initialKeywords // 초기 키워드 유지
        }));
        
        // 선택한 주제의 바로 다음 위치에 확장된 주제들을 삽입
        setCurrentTopics(prev => {
          const topicIndex = prev.findIndex(t => t.id === topic.id);
          const beforeTopics = prev.slice(0, topicIndex + 1);
          const afterTopics = prev.slice(topicIndex + 1);
          return [...beforeTopics, ...newTopics, ...afterTopics];
        });
        setTopicCounter(prev => prev + newTopics.length);
        
        // 확장 프롬프트 초기화
        if (!customKeywords && additionalPrompt?.trim()) {
          setAdditionalKeywords(''); // customKeywords가 없을 때만 초기화
        }
      }
    } catch (error) {
      console.error('주제 확장 실패:', error);
      // 확장 실패 처리 - 더미 데이터 생성하지 않음
      console.error('주제 확장 실패, 빈 값 반환');
    } finally {
      setExpandingTopicId(null);
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  // 사용자 탐색 패턴 분석 함수
  const getUserInteractionPattern = () => {
    const baseTopics = currentTopics.filter(t => !t.parentId);
    const expandedTopics = currentTopics.filter(t => t.parentId);
    
    return {
      explorationDepth: Math.max(...currentTopics.map(t => t.level)) || 1,
      expansionCount: expandedTopics.length,
      preferredCategories: Array.from(new Set(currentTopics.map(t => t.category))),
      hasUsedAdditionalKeywords: additionalKeywords.trim().length > 0,
      totalInteractions: currentTopics.length,
      expansionRate: baseTopics.length > 0 ? expandedTopics.length / baseTopics.length : 0
    };
  };

  // 계층 구조로 주제들을 렌더링
  const renderTopicsHierarchy = () => {
    const baseTopics = currentTopics.filter(topic => !topic.parentId);
    
    return baseTopics.map((baseTopic) => {
      const childTopics = currentTopics.filter(topic => topic.parentId === baseTopic.id);
      // 확장된 키워드를 찾습니다 (맨 처음 하위 주제에서)
      const expandedKeywords = childTopics.length > 0 ? childTopics[0].expandedKeywords : null;
      
      return (
        <div key={baseTopic.id} className="space-y-4">
          {/* 베이스 주제 */}
          <TopicCard
            topic={baseTopic}
            onDirectGenerate={(withResearch) => handleDirectIdeaGeneration(baseTopic, withResearch)}
            onExpand={(keywords) => {
              handleTopicExpansion(baseTopic, keywords);
            }}
            isExpanding={expandingTopicId === baseTopic.id}
            allTopics={currentTopics}
          />
          
          {/* 확장 프롬프트 표시 */}
          {expandedKeywords && expandedKeywords.length > 0 && (
            <div className="ml-4 sm:ml-8 mb-3">
              <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-slate-100 rounded-lg mt-3 sm:mt-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-slate-600 font-medium text-xs">확장 요청:</span>
                </div>
                <p className="text-xs text-slate-700 italic">
                  &quot;{expandedKeywords[0]}&quot;
                </p>
              </div>
            </div>
          )}
          
          {/* 하위 주제들 */}
          {childTopics.length > 0 && (
            <div className="ml-4 sm:ml-8 space-y-3">
              {childTopics.map((childTopic) => (
                <TopicCard
                  key={childTopic.id}
                  topic={childTopic}
                  onDirectGenerate={(withResearch) => handleDirectIdeaGeneration(childTopic, withResearch)}
                  onExpand={(keywords) => {
                    handleTopicExpansion(childTopic, keywords);
                  }}
                  isExpanding={expandingTopicId === childTopic.id}
                  allTopics={currentTopics}
                />
              ))}
            </div>
          )}
        </div>
      );
    });
  };

  if (isLoading && currentTopics.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-slate-600">
            추천 주제를 생성하고 있습니다...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 sm:pb-0">
      {/* 헤더 */}
      <div className="text-center mb-8 mt-6 sm:mt-8 md:mt-12">
        <h2 className="text-base min-[375px]:text-lg sm:text-3xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-2 sm:gap-3 text-center px-4">
          <Lightbulb className="w-6 sm:w-8 h-6 sm:h-8 text-blue-600" />
          <span>프로젝트 아이디어 탐색</span>
        </h2>
        <div className="mb-2"></div>
        <p className="text-xs min-[375px]:text-sm sm:text-lg text-slate-600 text-center px-4">
          원하는 주제로 바로 아이디어 생성하거나,<br className="sm:hidden" />
          <span className="hidden sm:inline"> </span>확장 버튼으로 더 많은 주제를 탐색해보세요
        </p>
      </div>

      {/* 사용자 프롬프트 표시 */}
      {userPrompt && (
        <div className="text-center mb-8">
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-slate-100 rounded-lg mt-4 sm:mt-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-slate-600 font-medium text-sm">〈입력된 요청〉</span>
            </div>
            <p className="text-sm text-slate-800 leading-relaxed text-center font-semibold">
              {userPrompt}
            </p>
          </div>
          
          {/* 화살표 및 설명 */}
          <div className="flex flex-col items-center mt-4 mb-2">
            <div className="flex items-center gap-2 text-slate-500">
              <div className="w-8 h-px bg-slate-300"></div>
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <div className="w-8 h-px bg-slate-300"></div>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">AI가 분석하여 주제를 생성했습니다</p>
          </div>
        </div>
      )}


      {/* 주제 카드들 */}
      <div className="space-y-6 mb-8">
        {renderTopicsHierarchy()}
      </div>

      {/* 데스크톱 네비게이션 */}
      <div className="hidden sm:flex justify-center items-center space-x-4">
        <button
          onClick={handleGoHome}
          className="btn-secondary btn-click px-6 py-3 flex items-center gap-2"
          disabled={isLoading}
        >
          <Home className="w-4 h-4" />
          홈으로
        </button>
        
        {currentTopics.length > 3 && (
          <p className="text-sm text-slate-500">
            {currentTopics.length}개 주제가 생성되었습니다
          </p>
        )}
      </div>

      {/* 모바일 플로팅 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 sm:hidden z-50">
        <div className="flex justify-center max-w-md mx-auto">
          <button
            onClick={handleGoHome}
            className="btn-secondary btn-click inline-flex items-center gap-2 px-6 py-3 justify-center"
            disabled={isLoading}
          >
            <Home className="w-4 h-4" />
            <span className="text-xs">홈으로</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// 주제 카드 컴포넌트
interface TopicCardProps {
  topic: SimpleTopic;
  onDirectGenerate: (withResearch?: boolean) => void;
  onExpand: (keywords?: string) => void;
  isExpanding: boolean;
  allTopics: SimpleTopic[];
}

function TopicCard({ topic, onDirectGenerate, onExpand, isExpanding, allTopics }: TopicCardProps) {
  const [showKeywordInput, setShowKeywordInput] = useState(false);
  const [expandKeywords, setExpandKeywords] = useState('');
  
  const childTopics = allTopics.filter(t => t.parentId === topic.id);
  const topicNumber = topic.id.split('_')[1];
  const hasChildren = childTopics.length > 0;
  
  const handleExpandClick = () => {
    if (showKeywordInput && expandKeywords.trim()) {
      onExpand(expandKeywords.trim());
      setExpandKeywords('');
      setShowKeywordInput(false);
    } else if (!showKeywordInput) {
      setShowKeywordInput(true);
    }
  };
  return (
    <div className={`border-2 rounded-xl bg-white card-hover transition-all duration-200 mt-6 sm:mt-8 md:mt-12 ${
      topic.parentId 
        ? 'border-blue-200 bg-blue-50/30 shadow-sm' 
        : 'border-slate-200 hover:shadow-lg'
    }`}>
      {/* 메인 카드 내용 */}
      <div className="p-4 sm:p-6">
        <div className="flex items-start space-x-3 sm:space-x-4">
          <div className="flex-shrink-0">
            <div className={`w-10 sm:w-12 h-10 sm:h-12 rounded-full flex items-center justify-center ${
              topic.parentId 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-slate-100 text-slate-600'
            }`}>
              <span className="font-bold text-sm sm:text-lg">
                {topicNumber}
              </span>
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className={`text-sm sm:text-xl font-semibold mb-2 ${
              topic.parentId ? 'text-blue-800' : 'text-slate-800'
            }`}>
              {topic.title}
            </h3>
            <p className={`text-xs sm:text-base mb-4 ${
              topic.parentId ? 'text-blue-700' : 'text-slate-600'
            }`}>
              {topic.description}
            </p>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    topic.parentId 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {topic.category}
                  </span>
                  {topic.parentId && (
                    <span className="text-blue-500 text-sm">
                      확장 주제
                    </span>
                  )}
                </div>
                {topic.keywords && topic.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {topic.keywords.map((keyword, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs leading-tight whitespace-nowrap"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 justify-end sm:justify-start">
                <button
                  onClick={() => onDirectGenerate(true)} // 리서치 포함 생성
                  disabled={isExpanding}
                  className="btn-primary btn-click px-3 sm:px-4 py-2 text-xs sm:text-sm flex items-center gap-1 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-3 sm:w-4 h-3 sm:h-4" />
                  <span className="hidden min-[375px]:inline">아이디어 생성</span>
                  <span className="min-[375px]:hidden">생성</span>
                </button>
                {!topic.parentId && !hasChildren && (
                  <button
                    onClick={handleExpandClick}
                    disabled={isExpanding}
                    className="btn-secondary btn-click px-3 sm:px-4 py-2 text-xs sm:text-sm"
                  >
                    {isExpanding ? (
                      <span className="flex items-center gap-1">
                        <div className="animate-spin rounded-full h-3 w-3 border border-slate-500 border-t-transparent"></div>
                        <span className="hidden min-[375px]:inline">확장 중...</span>
                        <span className="min-[375px]:hidden">확장 중</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 sm:gap-2">
                        <Search className="w-3 sm:w-4 h-3 sm:h-4" />
                        <span className="hidden min-[375px]:inline">주제 확장</span>
                        <span className="min-[375px]:hidden">확장</span>
                      </span>
                    )}
                  </button>
                )}
                {hasChildren && (
                  <span className="text-xs sm:text-sm text-slate-500 px-2 sm:px-4 py-2">
                    <span className="hidden min-[375px]:inline">이미 확장됨 ({childTopics.length}개)</span>
                    <span className="min-[375px]:hidden">확장됨</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* 키워드 입력 영역 */}
        {showKeywordInput && !topic.parentId && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex gap-2">
              <textarea
                placeholder="어떤 방향으로 확장하고 싶으신지 자유롭게 설명해주세요 (예: 모바일 앱으로 만들고 싶고, AI 기능을 추가하고 싶어요)"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm min-h-[80px] sm:min-h-[60px] resize-none selectable placeholder:text-xs"
                value={expandKeywords}
                onChange={(e) => setExpandKeywords(e.target.value)}
              />
              <button
                onClick={handleExpandClick}
                disabled={!expandKeywords.trim() || isExpanding}
                className="btn-primary btn-click px-3 py-2 text-xs sm:text-sm flex-shrink-0"
              >
                <span className="hidden min-[375px]:inline">확장하기</span>
                <span className="min-[375px]:hidden">확장</span>
              </button>
              <button
                onClick={() => {
                  setShowKeywordInput(false);
                  setExpandKeywords('');
                }}
                className="btn-secondary btn-click px-3 py-2 text-xs sm:text-sm flex-shrink-0"
              >
                취소
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              원하는 방향을 자연스럽게 설명하면 AI가 더 구체적인 주제로 확장해드립니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
}