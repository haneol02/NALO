'use client';

import { useState } from 'react';
import { useIdeaPlan } from '../hooks/useIdeaPlan';
import { 
  FileText, 
  Wrench, 
  Sparkles, 
  Rocket,
  AlertTriangle, 
  Target,
  CheckCircle,
  BarChart3
} from 'lucide-react';

import { Idea } from '@/types';

interface ResultDisplayProps {
  ideas: Idea[];
  onNewGeneration: () => void;
}

export default function ResultDisplay({ ideas, onNewGeneration }: ResultDisplayProps) {
  
  // Use the new business plan hook
  const { 
    generatePlan, 
    getPlan, 
    hasPlan, 
    isGenerating: isGeneratingPlan,
    error: planError 
  } = useIdeaPlan();

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <div key={i} className={`w-3 h-3 rounded-full inline-block mr-1 ${
        i < rating ? 'bg-blue-500' : 'bg-slate-300'
      }`} />
    ));
  };


  // Handle business plan generation for selected idea
  const handleGenerateBusinessPlan = async (idea: Idea, index: number) => {
    if (!idea.id) {
      console.error('아이디어 ID가 없습니다.');
      return;
    }
    
    await generatePlan(idea);
  };


  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl min-[375px]:text-2xl sm:text-3xl font-bold text-slate-800 mb-4 whitespace-nowrap">
          당신만의 상세한 아이디어를 준비했습니다
        </h2>
        <div className="mb-2"></div>
        <p className="text-sm min-[375px]:text-base text-slate-600 text-center">
          생성된 아이디어가 마음에 들면 비즈니스 기획서를 생성하거나,<br className="sm:hidden" />
          <span className="hidden sm:inline"> </span>저장해보세요
        </p>
      </div>

      {/* 아이디어 카드들 */}
      <div className="space-y-8">
        {ideas.map((idea, index) => {
          return (
            <div key={index} className="card card-hover page-transition" style={{ animationDelay: `${index * 0.1}s` }}>
              {/* 카드 헤더 */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      생성된 아이디어
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">
                    {idea.title}
                  </h3>
                  <div className="mb-2"></div>
                </div>
                
              </div>

              {/* 상세 정보 */}
              <div className="mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-1 h-16 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800 mb-2">핵심 요약</h4>
                    <div className="mb-1"></div>
                    {idea.summary && (
                      <p className="text-blue-700 font-medium leading-relaxed mb-2 selectable">
                        {idea.summary}
                      </p>
                    )}
                    <p className="text-slate-700 leading-relaxed mb-4 selectable">
                      {idea.description}
                    </p>
                    {idea.coretech && idea.coretech.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {idea.coretech.map((tech, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                      {idea.estimatedCost && (
                        <span>예상 비용: <strong className="text-blue-600">{idea.estimatedCost}만원</strong></span>
                      )}
                      {idea.developmentTime && (
                        <span>개발 기간: <strong className="text-blue-600">{idea.developmentTime}주</strong></span>
                      )}
                      <span>타겟: <strong className="text-blue-600">{idea.target}</strong></span>
                    </div>

                    {/* 기술 스택 */}
                    {idea.techStack && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Wrench className="w-5 h-5 text-violet-600" />
                          <h5 className="font-semibold text-slate-800">기술 스택</h5>
                        </div>
                        <div className="mb-1"></div>
                        <p className="text-slate-700 bg-slate-50 p-3 rounded-lg selectable">{idea.techStack}</p>
                      </div>
                    )}

                    {/* 핵심 기능 */}
                    {idea.keyFeatures && idea.keyFeatures.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-5 h-5 text-blue-600" />
                          <h5 className="font-semibold text-slate-800">핵심 기능</h5>
                        </div>
                        <div className="mb-1"></div>
                        <ul className="space-y-2">
                          {idea.keyFeatures.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <div className="w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-slate-700 selectable">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 첫 번째 실행 단계 */}
                    {idea.firstStep && (
                      <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Rocket className="w-5 h-5 text-blue-600" />
                          <h5 className="font-semibold text-blue-800">첫 번째 실행 단계</h5>
                        </div>
                        <div className="mb-1"></div>
                        <p className="text-blue-700 selectable">{idea.firstStep}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>


              {/* 실현 가능성 분석 */}
              {(idea.difficulty || idea.marketPotential || idea.competition) && (
                <div className="bg-slate-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-slate-600" />
                    <h4 className="font-semibold text-slate-800">실현 가능성 분석</h4>
                  </div>
                  <div className="mb-1"></div>
                  <div className="grid md:grid-cols-3 gap-6">
                    {idea.difficulty && (
                      <div className="text-center">
                        <div className="text-sm text-slate-600 mb-2">기술 난이도</div>
                        <div className="flex justify-center mb-1">
                          {renderStars(idea.difficulty)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {idea.difficulty === 1 ? '매우 쉬움' : 
                           idea.difficulty === 2 ? '쉬움' :
                           idea.difficulty === 3 ? '보통' :
                           idea.difficulty === 4 ? '어려움' : '매우 어려움'}
                        </div>
                      </div>
                    )}
                    {idea.marketPotential && (
                      <div className="text-center">
                        <div className="text-sm text-slate-600 mb-2">시장 잠재력</div>
                        <div className="flex justify-center mb-1">
                          {renderStars(idea.marketPotential)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {idea.marketPotential === 1 ? '매우 낮음' : 
                           idea.marketPotential === 2 ? '낮음' :
                           idea.marketPotential === 3 ? '보통' :
                           idea.marketPotential === 4 ? '높음' : '매우 높음'}
                        </div>
                      </div>
                    )}
                    {idea.competition && (
                      <div className="text-center">
                        <div className="text-sm text-slate-600 mb-2">경쟁 우위도</div>
                        <div className="flex justify-center mb-1">
                          {renderStars(5 - idea.competition)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {idea.competition === 1 ? '매우 유리' : 
                           idea.competition === 2 ? '유리' :
                           idea.competition === 3 ? '보통' :
                           idea.competition === 4 ? '불리' : '매우 불리'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 추가 분석 */}
              {(idea.challenges || idea.successFactors) && (
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {idea.challenges && idea.challenges.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <h4 className="font-semibold text-red-800">예상 도전과제</h4>
                          </div>
                          <div className="mb-1"></div>
                          <ul className="space-y-2">
                            {idea.challenges.map((challenge, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <div className="w-1 h-1 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-sm text-red-700 selectable">{challenge}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {idea.successFactors && idea.successFactors.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Target className="w-5 h-5 text-green-600" />
                            <h4 className="font-semibold text-green-800">성공 요인</h4>
                          </div>
                          <div className="mb-1"></div>
                          <ul className="space-y-2">
                            {idea.successFactors.map((factor, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <div className="w-1 h-1 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-sm text-green-700 selectable">{factor}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Business Plan Generation Button - 카드 하단 중앙 */}
              {idea.id && (
                <div className="text-center mt-6 pt-6 border-t border-slate-200">
                  {!hasPlan(idea.id) ? (
                    <button
                      onClick={() => handleGenerateBusinessPlan(idea, index)}
                      disabled={isGeneratingPlan(idea.id)}
                      className="btn-plan-generate w-full sm:w-auto"
                    >
                      {isGeneratingPlan(idea.id) ? '기획서 생성 중...' : '비즈니스 기획서 생성하기'}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const planId = getPlan(idea.id!)?.id;
                        if (planId) {
                          window.open(`/plan/${planId}`, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className="btn-secondary w-full sm:w-auto"
                    >
                      기획서 보기
                    </button>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* 액션 버튼들 */}
      <div className="text-center space-y-4">
        <button
          onClick={() => {
            onNewGeneration();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="btn-primary"
        >
          새로운 조건으로 생성하기
        </button>
        
        <div className="text-xs min-[375px]:text-sm text-slate-500 mt-6 text-center">
          <p className="mb-1">
            생성된 아이디어가 마음에 들면 기획서를 생성하거나<br className="sm:hidden" />
            <span className="hidden sm:inline"> </span>친구들과 공유해보세요
          </p>
          <p>
            다른 아이디어가 필요하시면<br className="sm:hidden" />
            <span className="hidden sm:inline"> </span>새로운 주제로 다시 생성해보세요
          </p>
        </div>
      </div>
    </div>
  );
}