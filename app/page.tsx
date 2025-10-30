'use client';

import { useState, useEffect } from 'react';
import IdeaGenerator from './components/IdeaGenerator';
import SimpleTopicExplorer from './components/SimpleTopicExplorer';
import ResultDisplay from './components/ResultDisplay';
import ResearchResults from './components/ResearchResults';
import MindmapViewer from './components/MindmapViewer';
import AuthButton from './components/AuthButton';
import ApiKeyInput from './components/ApiKeyInput';
import { AlertTriangle, Frown, Search } from 'lucide-react';
import { getApiKey, getPerplexityApiKey } from '@/app/lib/apiKeyStorage';

import { Idea } from '@/types';

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<'input' | 'topics' | 'mindmap' | 'research' | 'results'>('input');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtractingKeywords, setIsExtractingKeywords] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [topicContext, setTopicContext] = useState<any>(null);
  const [researchData, setResearchData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [generatedPlanId, setGeneratedPlanId] = useState<string | null>(null);
  const [showPlanCompleteModal, setShowPlanCompleteModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false); // 기본값 false로 변경
  const [currentResearchMessage, setCurrentResearchMessage] = useState<string>('리서치 중...');

  // API 키가 있는지 확인하여 초기 표시 여부 결정
  useEffect(() => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setShowApiSettings(true); // API 키가 없으면 설정창 표시
    }
  }, []);

  const handleStartTopicExploration = async (prompt: string) => {
    console.log('=== 주제 탐색 시작 ===');
    console.log('사용자 프롬프트:', prompt);
    
    setUserPrompt(prompt);
    setCurrentStep('topics');
    setError(null);
  };

  const handleMindmapGeneration = async (prompt: string) => {
    console.log('=== 마인드맵 생성 시작 ===');
    console.log('사용자 프롬프트:', prompt);
    
    setUserPrompt(prompt);
    setCurrentStep('mindmap');
    setError(null);
  };

  const handleDirectIdeaGeneration = async (prompt: string) => {
    console.log('=== 직접 아이디어 생성 시작 ===');
    console.log('사용자 프롬프트:', prompt);

    const apiKey = getApiKey();
    if (!apiKey) {
      setError('API 키가 설정되지 않았습니다. 홈 화면에서 API 키를 입력해주세요.');
      return;
    }

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
          prompt: prompt,
          apiKey
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


  const handleTopicSelected = (context: any, withResearch: boolean = false) => {
    console.log('=== 최종 주제 선택됨 ===');
    console.log('선택된 컨텍스트:', context);
    console.log('리서치 포함 여부:', withResearch);
    console.log('리서치 옵션:', context.researchOptions);

    setTopicContext(context);

    if (withResearch) {
      // 리서치 단계로 이동
      handleStartResearch(context);
    } else {
      // 바로 아이디어 생성
      handleGenerateIdeas(context, false);
    }
  };

  const handleStartResearch = async (context: any) => {
    console.log('=== 리서치 시작 ===');
    setCurrentStep('research');
    setIsResearching(true);
    setError(null);
    setResearchData(null);
    setResearchLogs([]);

    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error('API 키가 설정되지 않았습니다. 홈 화면에서 API 키를 입력해주세요.');
      }

      // 리서치 옵션 준비
      const researchOptions = context.researchOptions || {
        includeWikipedia: true,
        includeAcademic: true,
        includePerplexity: false
      };

      // 랜덤 리서치 메시지 배열
      const researchMessages = [
        '📊 주제를 분석하고 있어요...',
        '🔍 최적의 키워드를 찾고 있어요...',
        '📚 Wikipedia에서 정보를 수집 중이에요...',
        '📄 최신 논문을 검색하고 있어요...',
        '🌐 웹에서 관련 정보를 찾고 있어요...',
        '🧠 AI가 데이터를 분석 중이에요...',
        '✨ 인사이트를 도출하고 있어요...',
        '🎯 핵심 정보를 정리하고 있어요...',
        '⚡ 거의 다 됐어요...',
        '🚀 마무리 작업 중이에요...'
      ];

      // 랜덤 메시지 표시 인터벌
      const messageInterval = setInterval(() => {
        const randomMessage = researchMessages[Math.floor(Math.random() * researchMessages.length)];
        setCurrentResearchMessage(randomMessage);
      }, 2000); // 2초마다 메시지 변경

      // Perplexity API 키 추가
      if (researchOptions.includePerplexity) {
        const perplexityApiKey = getPerplexityApiKey();
        if (perplexityApiKey) {
          researchOptions.perplexityApiKey = perplexityApiKey;
        }
      }

      // API 호출 시작
      const researchResponse = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: context.finalTopic,
          includeAcademic: researchOptions.includeAcademic,
          apiKey,
          researchOptions
        }),
      });

      // 인터벌 정리
      clearInterval(messageInterval);

      if (!researchResponse.ok) {
        throw new Error('리서치 API 호출에 실패했습니다.');
      }

      const researchResult = await researchResponse.json();

      if (researchResult.success) {
        setCurrentResearchMessage('✅ 리서치 완료!');
        setResearchData(researchResult.data);
      } else {
        throw new Error(researchResult.error || '리서치에 실패했습니다.');
      }
    } catch (error) {
      console.error('리서치 오류:', error);
      clearInterval(messageInterval);
      setCurrentResearchMessage('❌ 리서치 중 오류 발생');
      setError(error instanceof Error ? error.message : '리서치 중 오류가 발생했습니다.');
    } finally {
      setIsResearching(false);
    }
  };

  const handleGenerateWithResearch = () => {
    if (topicContext && researchData) {
      handleGenerateIdeas(topicContext, true);
    }
  };

  const handleGenerateIdeas = async (context?: any, withResearch: boolean = false) => {
    console.log('=== 아이디어 생성 요청 시작 (새 플로우) ===');
    console.log('handleGenerateIdeas 호출됨 - 스택 트레이스:', new Error().stack);
    console.log('현재 isGenerating 상태:', isGenerating);
    console.log('리서치 포함 여부:', withResearch);
    
    const contextToUse = context || topicContext;
    if (!contextToUse) {
      setError('주제 정보가 없습니다.');
      return;
    }
    
    // 이미 생성 중이면 중복 실행 방지
    if (isGenerating) {
      console.log('이미 생성 중이므로 중복 실행 방지');
      return;
    }
    
    setIsGenerating(true);
    setCurrentStep('results');
    setError(null);

    // 리서치 데이터 사용 (이미 리서치가 완료된 경우)
    const researchDataToUse = withResearch ? researchData : null;
    
    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error('API 키가 설정되지 않았습니다. 홈 화면에서 API 키를 입력해주세요.');
      }

      // 아이디어 생성 (리서치 결과 포함)
      const response = await fetch('/api/ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalPrompt: userPrompt,
          keywords: selectedKeywords,
          finalTopic: contextToUse.finalTopic || contextToUse.selectedPath?.join(' → ') || '',
          topicContext: contextToUse,
          researchData: researchDataToUse, // 리서치 결과 추가
          apiKey
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
      console.log('리서치 데이터 포함 여부:', !!researchDataToUse);
      
      // Add unique IDs and keywords to ideas for business plan generation
      const ideasWithIds = data.ideas?.map((idea: any, index: number) => ({
        ...idea,
        id: `idea_${Date.now()}_${index}`,
        // 키워드 정보 추가 - 개별 아이디어의 키워드 우선, 없으면 전체 키워드 또는 선택된 키워드 사용
        keywords: idea.keywords || data.keywords || selectedKeywords,
        searchQuery: contextToUse.finalTopic || '',
        input_keywords: idea.keywords || data.keywords || selectedKeywords,
        search_query: contextToUse.finalTopic || '',
        researchData: researchDataToUse // 리서치 데이터를 아이디어에 포함
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
    setResearchData(null);
    setError(null);
    setUserPrompt('');
  };

  const handleBackToResearch = () => {
    setCurrentStep('research');
  };

  const handleMindmapToPlan = async (mindmapData: { nodes: any[]; edges: any[]; focusNode?: any }) => {
    console.log('=== 마인드맵에서 기획서 생성 시작 (개선된 버전) ===');
    console.log('마인드맵 데이터:', mindmapData);
    
    // 포커스 노드가 있는지 확인
    const isFocusedGeneration = mindmapData.focusNode !== undefined;
    if (isFocusedGeneration) {
      console.log(`포커스 노드: "${mindmapData.focusNode.data.label}"`);
      console.log(`포함 노드 수: ${mindmapData.nodes.length} (전체 마인드맵의 일부)`);
    }
    
    setIsGenerating(true);
    setError(null);

    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error('API 키가 설정되지 않았습니다. 홈 화면에서 API 키를 입력해주세요.');
      }

      // 새로운 마인드맵 전용 API 호출
      const response = await fetch('/api/mindmap/to-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mindmapData: {
            nodes: mindmapData.nodes,
            edges: mindmapData.edges
          },
          originalPrompt: userPrompt,
          focusNode: mindmapData.focusNode,
          isFocusedGeneration: isFocusedGeneration,
          apiKey
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('마인드맵 기획서 생성 API 에러:', errorData);
        const detailMessage = errorData.details ? ` (${errorData.details})` : '';
        throw new Error((errorData.error || '마인드맵 기획서 생성에 실패했습니다.') + detailMessage);
      }

      const data = await response.json();
      console.log('=== 마인드맵 기획서 생성 결과 ===');
      console.log('기획서 ID:', data.planId);
      console.log('토큰 사용량:', data.tokensUsed);
      
      // 기획서가 생성되었으므로 완료 모달 표시
      if (data.planId) {
        console.log(`기획서 생성 완료! 완료 모달 표시`);
        setGeneratedPlanId(data.planId);
        setShowPlanCompleteModal(true);
        return;
      }

      // fallback: 아이디어 형태로 표시 (기존 방식)
      const ideasWithIds = [{
        id: `mindmap_plan_${Date.now()}`,
        title: data.ideaData?.title || '마인드맵 기반 프로젝트',
        summary: data.ideaData?.summary || data.plan?.service_summary || '',
        description: data.ideaData?.description || data.plan?.problem_to_solve || '',
        coretech: data.ideaData?.coretech || data.plan?.tech_stack || '',
        target: data.ideaData?.target || data.plan?.target_customer || '',
        originalPrompt: userPrompt,
        keywords: data.ideaData?.keywords || [],
        input_keywords: data.ideaData?.keywords || [],
        search_query: userPrompt,
        mindmapData: mindmapData,
        planId: data.planId
      }];
      
      setIdeas(ideasWithIds);
      setCurrentStep('results');
    } catch (error) {
      console.error('마인드맵 기획서 생성 에러:', error);
      setError(error instanceof Error ? error.message : '마인드맵 기획서 생성 중 오류가 발생했습니다.');
      setIdeas([]);
      setCurrentStep('results');
    } finally {
      setIsGenerating(false);
    }
  };

  // 마인드맵 데이터를 텍스트로 변환하는 헬퍼 함수
  const convertMindmapToText = (mindmapData: { nodes: any[]; edges: any[] }) => {
    const { nodes, edges } = mindmapData;
    
    // 루트 노드 찾기
    const rootNode = nodes.find(node => node.data.type === 'root') || nodes[0];
    const result: string[] = [];
    
    // 노드들을 계층 구조로 변환
    const visited = new Set();
    const buildHierarchy = (nodeId: string, level: number = 0) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;
      
      const indent = '  '.repeat(level);
      result.push(`${indent}- ${node.data.label} (${node.data.type})`);
      if (node.data.description) {
        result.push(`${indent}  ${node.data.description}`);
      }
      
      // 자식 노드들 찾기
      const childEdges = edges.filter(edge => edge.source === nodeId);
      childEdges.forEach(edge => {
        buildHierarchy(edge.target, level + 1);
      });
    };
    
    buildHierarchy(rootNode.id);
    return result.join('\n');
  };

  return (
    <main className="min-h-screen page-transition no-select">
      {/* Header */}
      <header className={`
        relative px-4 bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden
        transition-all duration-700 ease-in-out
        ${currentStep === 'input' 
          ? 'text-center py-12 sm:py-20' 
          : 'py-3 sm:py-4'
        }
      `}>
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent"></div>
        
        {currentStep === 'input' ? (
          // 메인 페이지 헤더 (기존 스타일)
          <>
            {/* Auth Button - Fixed positioned */}
            <div className="absolute top-4 right-4 z-10">
              <AuthButton />
            </div>
            
            <div className="relative max-w-4xl mx-auto">
              <div className="mb-12"></div>
              
              <div className="space-y-4 sm:space-y-6">
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-black mb-2 sm:mb-4 tracking-tight">
                  <span className="gradient-text">NALO</span>
                </h1>
                <div className="mb-2"></div>
                <p className="text-sm min-[375px]:text-base min-[425px]:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-slate-700 mb-2 sm:mb-3 font-bold tracking-tight">
                  날로 먹는 아이디어 기획
                </p>
                <div className="max-w-2xl mx-auto">
                  <p className="text-xs min-[375px]:text-sm min-[425px]:text-base sm:text-lg text-slate-600 leading-relaxed text-center px-4">
                    AI 리서치와 마인드맵으로 아이디어를 구체화하세요
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
          </>
        ) : (
          // 컴팩트 헤더 (한 줄 레이아웃)
          <div className="relative max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <a href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity cursor-pointer">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  <span className="gradient-text">NALO</span>
                </h1>
                <div className="hidden sm:block w-px h-6 bg-slate-300"></div>
                <p className="hidden sm:block text-sm text-slate-600 font-medium">
                  날로 먹는 아이디어 기획
                </p>
              </a>
              <div className="flex items-center gap-3">
                <p className="hidden md:block text-xs text-slate-500">
                  AI 리서치 & 마인드맵
                </p>
                <AuthButton />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mindmap - Full Screen */}
      {currentStep === 'mindmap' && (
        <>
          <MindmapViewer
            initialPrompt={userPrompt}
            onGeneratePlan={handleMindmapToPlan}
            onBack={handleNewSearch}
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

      {/* 기획서 생성 중 모달 */}
      {isGenerating && currentStep === 'mindmap' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="inline-block relative mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
                <div className="absolute inset-2 animate-pulse rounded-full bg-gradient-to-r from-purple-400 to-white opacity-20"></div>
              </div>
              
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                기획서 생성 중...
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                마인드맵을 분석하여 상세한 프로젝트 기획서를 작성하고 있습니다.
              </p>
              
              {/* 진행 단계 표시 */}
              <div className="flex justify-center items-center gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"
                    style={{
                      animationDelay: `${i * 0.3}s`
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 기획서 생성 완료 모달 */}
      {showPlanCompleteModal && generatedPlanId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="inline-block relative mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                기획서 생성 완료!
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                마인드맵을 기반으로 상세한 프로젝트 기획서가 생성되었습니다.
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    window.open(`/plan/${generatedPlanId}`, '_blank');
                    setShowPlanCompleteModal(false);
                    setGeneratedPlanId(null);
                  }}
                  className="btn-primary px-6 py-3 rounded-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  새 탭에서 보기
                </button>
                <button
                  onClick={() => {
                    setShowPlanCompleteModal(false);
                    setGeneratedPlanId(null);
                  }}
                  className="btn-secondary px-6 py-3 rounded-lg"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {currentStep !== 'mindmap' && (
        <div className="max-w-6xl mx-auto px-4 pb-8 sm:pb-16">
        {currentStep === 'input' && (
          <>
            <div className="max-w-2xl mx-auto mb-8 mt-6">
              {showApiSettings ? (
                <div className="space-y-3">
                  <ApiKeyInput onApiKeyChange={setHasApiKey} />
                  <button
                    onClick={() => setShowApiSettings(false)}
                    className="text-sm text-slate-500 hover:text-slate-700 mx-auto block"
                  >
                    API 설정 숨기기
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowApiSettings(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm mx-auto block transition-colors"
                >
                  API 설정 보기
                </button>
              )}
            </div>
            <IdeaGenerator
              onSearch={handleStartTopicExploration}
              isLoading={isGenerating}
              selectedKeywords={selectedKeywords}
              onDirectGeneration={handleDirectIdeaGeneration}
              onMindmapGeneration={handleMindmapGeneration}
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
              isGeneratingIdeas={isGenerating}
              apiKey={getApiKey() || undefined}
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

        {currentStep === 'research' && (
          <>
            {isResearching ? (
              // 리서치 로딩 상태
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
                    <div className="animate-spin rounded-full h-20 w-20 border-4 border-green-500 border-t-transparent loading-pulse"></div>
                    <div className="absolute inset-2 animate-pulse rounded-full bg-gradient-to-r from-green-400 to-white opacity-20"></div>
                  </div>
                  
                  <h3 className="text-lg min-[375px]:text-xl font-semibold text-slate-700 mb-2 text-center loading-pulse">
                    시장 리서치를 수행하고 있습니다
                  </h3>

                  {/* 실시간 로그 */}
                  <div className="mt-6 max-w-2xl mx-auto">
                    <div className="text-base text-slate-700 text-center font-medium animate-pulse">
                      {currentResearchMessage}
                    </div>
                  </div>
                  
                  {/* 진행 단계 표시 */}
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <div className="flex gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full bg-green-400 animate-pulse`}
                          style={{
                            animationDelay: `${i * 0.2}s`
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : researchData ? (
              // 리서치 결과 표시
              <ResearchResults
                researchData={researchData}
                topicContext={topicContext}
                onGenerateIdeas={handleGenerateWithResearch}
                onNewSearch={handleNewSearch}
                isGenerating={isGenerating}
                researchOptions={topicContext?.researchOptions}
              />
            ) : null}
            
            {error && !isResearching && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6 mt-6 max-w-4xl mx-auto shadow-sm">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-red-800 font-semibold mb-2">리서치 중 오류가 발생했습니다</h3>
                    <p className="text-red-700 leading-relaxed">{error}</p>
                    <div className="mt-4 space-x-3">
                      <button
                        onClick={() => handleStartResearch(topicContext)}
                        className="btn-secondary"
                        disabled={isResearching}
                      >
                        다시 시도
                      </button>
                      <button
                        onClick={handleNewSearch}
                        className="btn-primary"
                      >
                        새로운 검색
                      </button>
                    </div>
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
                  <div className="flex justify-center">
                    <button
                      onClick={handleNewSearch}
                      className="btn-primary"
                    >
                      홈으로 돌아가기
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        </div>
      )}

    </main>
  );
}