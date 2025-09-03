'use client';

import { useState } from 'react';
import ShareButton from './ShareButton';

interface Idea {
  title: string;
  summary?: string;
  description: string;
  coretech?: string[];
  detailedDescription?: string;
  target: string;
  estimatedCost?: number;
  developmentTime?: number;
  difficulty?: number;
  marketPotential?: number;
  competition?: number;
  firstStep?: string;
  techStack?: string;
  keyFeatures?: string[];
  challenges?: string[];
  successFactors?: string[];
}

interface ResultDisplayProps {
  ideas: Idea[];
  onBackToSearch: () => void;
  onNewGeneration: () => void;
}

export default function ResultDisplay({ ideas, onBackToSearch, onNewGeneration }: ResultDisplayProps) {
  const [savedIdeas, setSavedIdeas] = useState<Set<number>>(new Set());
  const [expandedIdeas, setExpandedIdeas] = useState<Set<number>>(new Set());
  const [loadingDetails, setLoadingDetails] = useState<Set<number>>(new Set());
  const [detailedDescriptions, setDetailedDescriptions] = useState<Map<number, string>>(new Map());
  const [detailedProjects, setDetailedProjects] = useState<Map<number, any>>(new Map());

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <div key={i} className={`w-3 h-3 rounded-full inline-block mr-1 ${
        i < rating ? 'bg-blue-500' : 'bg-slate-300'
      }`} />
    ));
  };

  const toggleExpanded = async (index: number) => {
    const isCurrentlyExpanded = expandedIdeas.has(index);
    
    if (!isCurrentlyExpanded) {
      // 확장할 때 - 상세 설명이 없으면 생성
      if (!detailedDescriptions.has(index) && !detailedProjects.has(index)) {
        setLoadingDetails(prev => {
          const newSet = new Set(prev);
          newSet.add(index);
          return newSet;
        });
        
        try {
          const response = await fetch('/api/generate-details', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              idea: ideas[index]
            }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log('상세 기획서 응답 데이터:', data);
            
            // detailedProject 객체가 있는 경우 구조화된 형태로 저장
            if (data.detailedProject) {
              setDetailedProjects(prev => new Map(prev.set(index, data.detailedProject)));
            } else if (data.detailedDescription) {
              setDetailedDescriptions(prev => new Map(prev.set(index, data.detailedDescription)));
            } else {
              console.warn('예상하지 못한 응답 형식:', data);
              setDetailedDescriptions(prev => new Map(prev.set(index, JSON.stringify(data, null, 2))));
            }
          } else {
            // 에러 발생시 기본 설명 사용
            const fallbackDescription = `${ideas[index].title}에 대한 상세한 프로젝트 기획입니다. 현재 상세 정보를 생성 중이거나 일시적으로 사용할 수 없습니다. 나중에 다시 시도해주세요.`;
            setDetailedDescriptions(prev => new Map(prev.set(index, fallbackDescription)));
          }
        } catch (error) {
          console.error('Error loading details:', error);
          const fallbackDescription = `${ideas[index].title}에 대한 상세한 프로젝트 기획입니다. 현재 상세 정보를 생성 중이거나 일시적으로 사용할 수 없습니다. 나중에 다시 시도해주세요.`;
          setDetailedDescriptions(prev => new Map(prev.set(index, fallbackDescription)));
        } finally {
          setLoadingDetails(prev => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
          });
        }
      }
    }

    setExpandedIdeas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleSaveIdea = (index: number) => {
    setSavedIdeas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });

    // 로컬 스토리지에 저장 (실제 구현시)
    const saved = localStorage.getItem('saved-ideas') || '[]';
    const savedList = JSON.parse(saved);
    
    if (!savedIdeas.has(index)) {
      savedList.push({ ...ideas[index], savedAt: new Date().toISOString() });
      localStorage.setItem('saved-ideas', JSON.stringify(savedList));
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">
          당신만의 아이디어 {ideas.length}개를 준비했습니다
        </h2>
        <p className="text-slate-600">
          각 아이디어를 클릭해서 자세한 정보를 확인하고, 마음에 드는 것을 저장해보세요
        </p>
      </div>

      {/* 아이디어 카드들 */}
      <div className="space-y-8">
        {ideas.map((idea, index) => {
          const isExpanded = expandedIdeas.has(index);
          return (
            <div key={index} className="card hover:shadow-lg transition-all duration-300">
              {/* 카드 헤더 */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1" onClick={() => toggleExpanded(index)}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      추천 #{index + 1}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 hover:text-blue-600 transition-colors cursor-pointer">
                    {idea.title}
                  </h3>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveIdea(index);
                    }}
                    className={`
                      px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium
                      ${savedIdeas.has(index) 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }
                    `}
                    title={savedIdeas.has(index) ? '저장됨' : '저장하기'}
                  >
                    {savedIdeas.has(index) ? '저장됨' : '저장'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(index);
                    }}
                    className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center gap-1"
                    disabled={loadingDetails.has(index)}
                  >
                    {loadingDetails.has(index) ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
                        생성중
                      </>
                    ) : (
                      <>{isExpanded ? '간단히' : '자세히'}</>
                    )}
                  </button>
                  <ShareButton idea={idea} />
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-1 h-16 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800 mb-2">핵심 요약</h4>
                    {idea.summary && (
                      <p className="text-blue-700 font-medium leading-relaxed mb-2">
                        {idea.summary}
                      </p>
                    )}
                    <p className="text-slate-700 leading-relaxed mb-4">
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
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      {idea.estimatedCost && (
                        <span>예상 비용: <strong className="text-blue-600">{idea.estimatedCost}만원</strong></span>
                      )}
                      {idea.developmentTime && (
                        <span>개발 기간: <strong className="text-blue-600">{idea.developmentTime}주</strong></span>
                      )}
                      <span>타겟: <strong className="text-blue-600">{idea.target}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 확장된 정보 */}
              {isExpanded && (
                <div className="space-y-6">
                  {/* 상세 설명 */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-2">상세 기획서</h4>
                        {loadingDetails.has(index) ? (
                          <div className="flex items-center gap-2 text-slate-500">
                            <div className="animate-spin rounded-full h-4 w-4 border border-slate-400 border-t-transparent"></div>
                            상세한 프로젝트 기획서를 생성하고 있습니다...
                          </div>
                        ) : detailedProjects.has(index) ? (
                          <div className="space-y-6">
                            {(() => {
                              const project = detailedProjects.get(index);
                              return (
                                <div className="space-y-4">
                                  <div className="bg-blue-50 p-4 rounded-lg">
                                    <h5 className="font-semibold text-blue-800 mb-2">프로젝트 개요</h5>
                                    <p className="text-blue-700 mb-1"><strong>제목:</strong> {project.title}</p>
                                    <p className="text-blue-700 mb-1"><strong>부제:</strong> {project.subtitle}</p>
                                    <p className="text-blue-700"><strong>핵심 가치:</strong> {project.coreValue}</p>
                                  </div>
                                  
                                  {project.coreFeatures && (
                                    <div>
                                      <h5 className="font-semibold text-slate-800 mb-2">핵심 기능</h5>
                                      <ul className="list-disc list-inside space-y-1 text-slate-700">
                                        {project.coreFeatures.map((feature: string, idx: number) => (
                                          <li key={idx}>{feature}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  
                                  {project.techStack && (
                                    <div>
                                      <h5 className="font-semibold text-slate-800 mb-2">기술 스택</h5>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <p className="font-medium text-slate-700">프론트엔드</p>
                                          <p className="text-sm text-slate-600">{project.techStack.frontend?.join(', ')}</p>
                                        </div>
                                        <div>
                                          <p className="font-medium text-slate-700">백엔드</p>
                                          <p className="text-sm text-slate-600">{project.techStack.backend?.join(', ')}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {project.developmentPhases && (
                                    <div>
                                      <h5 className="font-semibold text-slate-800 mb-2">개발 일정</h5>
                                      <div className="space-y-4">
                                        {project.developmentPhases.map((phase: any, idx: number) => (
                                          <div key={idx} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                                            <div className="flex justify-between items-start mb-2">
                                              <h6 className="font-semibold text-blue-800">{phase.phase}</h6>
                                              <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                                {phase.duration}
                                              </span>
                                            </div>
                                            {phase.tasks && (
                                              <div className="mb-2">
                                                <p className="text-sm font-medium text-blue-700 mb-1">주요 작업:</p>
                                                <ul className="text-sm text-blue-600 space-y-1">
                                                  {phase.tasks.map((task: string, taskIdx: number) => (
                                                    <li key={taskIdx} className="flex items-start gap-2">
                                                      <span className="w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                                                      {task}
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}
                                            {phase.deliverables && (
                                              <div className="mb-2">
                                                <p className="text-sm font-medium text-blue-700 mb-1">산출물:</p>
                                                <div className="flex flex-wrap gap-1">
                                                  {phase.deliverables.map((deliverable: string, delIdx: number) => (
                                                    <span key={delIdx} className="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded">
                                                      {deliverable}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                            {phase.milestones && (
                                              <div>
                                                <p className="text-sm font-medium text-blue-700 mb-1">마일스톤:</p>
                                                <div className="flex flex-wrap gap-1">
                                                  {phase.milestones.map((milestone: string, msIdx: number) => (
                                                    <span key={msIdx} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                                      📍 {milestone}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {project.estimatedCosts && (
                                    <div className="bg-slate-50 p-4 rounded-lg">
                                      <h5 className="font-semibold text-slate-800 mb-2">예상 비용</h5>
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <p>개발: {project.estimatedCosts.development}만원</p>
                                        <p>인프라: {project.estimatedCosts.infrastructure}만원</p>
                                        <p>마케팅: {project.estimatedCosts.marketing}만원</p>
                                        <p className="font-semibold">총계: {project.estimatedCosts.total}만원</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="text-slate-700 leading-relaxed whitespace-pre-line">
                            {detailedDescriptions.get(index) || '상세 정보를 불러오는 중입니다...'}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {idea.techStack && (
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <h4 className="font-semibold text-slate-800 mb-2">기술 스택</h4>
                          <p className="text-slate-700">{idea.techStack}</p>
                        </div>
                      </div>
                    )}

                    {idea.keyFeatures && idea.keyFeatures.length > 0 && (
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <h4 className="font-semibold text-slate-800 mb-2">핵심 기능</h4>
                          <ul className="space-y-2">
                            {idea.keyFeatures.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <div className="w-1 h-1 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-slate-700">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 실현 가능성 분석 */}
                  {(idea.difficulty || idea.marketPotential || idea.competition) && (
                    <div className="bg-slate-50 rounded-lg p-6">
                      <h4 className="font-semibold text-slate-800 mb-4">실현 가능성 분석</h4>
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

                  {/* 실행 계획 */}
                  {idea.firstStep && (
                    <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <h4 className="font-semibold text-slate-800 mb-3">첫 번째 실행 단계</h4>
                          <p className="text-slate-700 leading-relaxed">
                            {idea.firstStep}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 추가 분석 */}
                  {(idea.challenges || idea.successFactors) && (
                    <div className="grid md:grid-cols-2 gap-6">
                      {idea.challenges && idea.challenges.length > 0 && (
                        <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-slate-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <h4 className="font-semibold text-slate-800 mb-3">예상 과제</h4>
                              <ul className="space-y-2">
                                {idea.challenges.map((challenge, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <div className="w-1 h-1 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                                    <span className="text-sm text-slate-700">{challenge}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {idea.successFactors && idea.successFactors.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <h4 className="font-semibold text-slate-800 mb-3">성공 요인</h4>
                              <ul className="space-y-2">
                                {idea.successFactors.map((factor, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <div className="w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                    <span className="text-sm text-slate-700">{factor}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 액션 버튼들 */}
      <div className="text-center space-y-4">
        <div className="space-x-4">
          <button
            onClick={onBackToSearch}
            className="btn-secondary"
          >
            검색 결과로 돌아가기
          </button>
          
          <button
            onClick={() => {
              onNewGeneration();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="btn-primary"
          >
            새로운 조건으로 생성하기
          </button>
        </div>
        
        <div className="text-sm text-slate-500 mt-6">
          <p>마음에 드는 아이디어가 있다면 친구들과 공유해보세요</p>
          <p>더 많은 아이디어가 필요하시면 새로운 키워드로 다시 검색해보세요</p>
        </div>
      </div>
    </div>
  );
}