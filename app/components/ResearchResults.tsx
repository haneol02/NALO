'use client';

import { useState, useEffect } from 'react';
import { Search, FileText, BookOpen, TrendingUp, Lightbulb, ArrowRight, Home, ChevronDown, ChevronUp, Eye, ExternalLink, Target, BarChart3, Building2, Globe } from 'lucide-react';

interface ResearchResultsProps {
  researchData: any;
  topicContext: any;
  onGenerateIdeas: () => void;
  onNewSearch: () => void;
  isGenerating: boolean;
}

export default function ResearchResults({ 
  researchData, 
  topicContext, 
  onGenerateIdeas, 
  onNewSearch,
  isGenerating 
}: ResearchResultsProps) {
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  
  // 컴포넌트 마운트시 초기화
  useEffect(() => {
    setShowDetailedResults(false);
  }, []);
  
  // 조기 리턴으로 렌더링 사이클 최적화
  if (!researchData) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <p className="text-slate-600">리서치 데이터가 없습니다.</p>
      </div>
    );
  }

  const { analysis, sources, summary } = researchData;

  return (
    <div className="max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="text-center mb-8 mt-6 sm:mt-8 md:mt-12">
        <h2 className="text-base min-[375px]:text-lg sm:text-3xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-2 sm:gap-3 text-center px-4">
          <Search className="w-6 sm:w-8 h-6 sm:h-8 text-blue-600" />
          <span>리서치 결과</span>
          <span className="px-1.5 py-[2.5px] bg-blue-100 text-blue-600 rounded-full text-[10px] font-bold leading-none">BETA</span>
        </h2>
        <div className="mb-2"></div>
        <p className="text-xs min-[375px]:text-sm sm:text-lg text-slate-600 text-center px-4">
          <strong>{topicContext?.finalTopic}</strong>에 대한 시장 조사 결과입니다
        </p>
      </div>

      {/* 요약 정보 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 sm:p-6 mb-6">
        <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          핵심 인사이트
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {summary?.foundWikipedia || 0}
            </div>
            <div className="text-xs text-slate-600">Wikipedia 결과</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {summary?.foundAcademic || 0}
            </div>
            <div className="text-xs text-slate-600">학술 검색 성공</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {summary?.totalPapers || 0}
            </div>
            <div className="text-xs text-slate-600">관련 논문 수</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {summary?.totalSearches || 0}
            </div>
            <div className="text-xs text-slate-600">총 검색 시도</div>
          </div>
        </div>

        {/* 검색 키워드 표시 */}
        {summary?.searchKeywords && (
          <div className="bg-white rounded-lg p-3 border border-blue-200 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">사용된 검색 키워드</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {summary.searchKeywords.english?.map((keyword: string, index: number) => (
                <span key={`en-${index}`} className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  <Globe className="w-3 h-3 inline mr-1" />
                  {keyword}
                </span>
              ))}
              {summary.searchKeywords.related?.slice(0, 3).map((keyword: string, index: number) => (
                <span key={`rel-${index}`} className="px-2 py-1 bg-green-100 text-green-700 rounded">
                  <ExternalLink className="w-3 h-3 inline mr-1" />
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 새로운 심층 분석 결과 */}
        {analysis?.recommendedStrategy && (
          <div className="bg-white rounded-lg p-4 border border-blue-200 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-sm font-medium text-slate-600 mb-1">시장 규모</div>
                <div className="text-lg font-bold text-blue-600 capitalize">{analysis.marketSize}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-slate-600 mb-1">경쟁 수준</div>
                <div className="text-lg font-bold text-blue-600 capitalize">{analysis.competitionLevel}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-slate-600 mb-1">트렌드</div>
                <div className="text-lg font-bold text-blue-600 capitalize">{analysis.trendDirection}</div>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-3 mb-3">
              <div className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                추천 전략
              </div>
              <p className="text-sm text-blue-700 leading-relaxed">{analysis.recommendedStrategy}</p>
            </div>
            
            {analysis.differentiationOpportunities?.length > 0 && (
              <div className="mb-3">
                <div className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  차별화 기회
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.differentiationOpportunities.map((opportunity: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                      {opportunity}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="font-semibold text-slate-600">구현 복잡도:</span>
                <span className={`ml-1 px-2 py-1 rounded capitalize ${
                  analysis.implementationComplexity === 'high' ? 'bg-red-100 text-red-700' :
                  analysis.implementationComplexity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {analysis.implementationComplexity}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-600">출시 예상:</span>
                <span className="ml-1 text-slate-700">{analysis.timeToMarket}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-600">필요 리소스:</span>
                <span className="ml-1 text-slate-700">{analysis.resourceRequirements?.slice(0, 2).join(', ')}</span>
              </div>
            </div>
          </div>
        )}

        {/* 기존 간단한 추천 접근법 (새 분석이 없을 경우) */}
        {analysis?.recommendedApproach && !analysis?.recommendedStrategy && (
          <div className="bg-white rounded-lg p-3 border border-blue-200 mb-4">
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>추천 접근법:</strong> {analysis.recommendedApproach}
            </p>
          </div>
        )}

        {/* 자세히 보기 버튼 */}
        <div className="text-center">
          <button
            onClick={() => setShowDetailedResults(!showDetailedResults)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            {showDetailedResults ? '간단히 보기' : '자세한 검색 결과 보기'}
            {showDetailedResults ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* 자세한 검색 결과 (토글) */}
      {showDetailedResults && (
        <div className="mt-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Search className="w-5 h-5" />
              상세 검색 결과
            </h3>
            
            {/* Wikipedia 결과들 */}
            {sources?.wikipedia?.results && sources.wikipedia.results.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-green-600" />
                  Wikipedia 검색 결과 ({sources.wikipedia.results.length}개)
                </h4>
                <div className="space-y-3">
                  {sources.wikipedia.results.map((result: any, index: number) => (
                    <div key={index} className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded">
                          {result.keyword}
                        </span>
                        {result.data?.found && (
                          <span className="text-xs text-green-600">✓ 발견</span>
                        )}
                      </div>
                      {result.data?.found ? (
                        <div>
                          <p className="text-sm text-slate-700 mb-1">
                            <strong>{result.data?.title}</strong>
                          </p>
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {result.data?.summary}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">검색 결과 없음</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* OpenAlex 결과들 */}
            {sources?.openalex?.results && sources.openalex.results.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  학술논문 검색 결과 ({sources.openalex.results.length}개)
                </h4>
                <div className="space-y-3">
                  {sources.openalex.results.map((result: any, index: number) => (
                    <div key={index} className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {result.keyword}
                        </span>
                        <span className="text-xs text-slate-600">
                          {result.data?.papers?.length || 0}개 논문
                        </span>
                      </div>
                      {result.data?.papers && result.data.papers.length > 0 ? (
                        <div className="space-y-2">
                          {result.data.papers.slice(0, 2).map((paper: any, paperIndex: number) => (
                            <div key={paperIndex} className="text-xs">
                              <p className="font-medium text-slate-700 line-clamp-1">
                                {paper.title}
                              </p>
                              <p className="text-slate-500">
                                {paper.authors?.slice(0, 2).join(', ')} ({paper.year})
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">관련 논문 없음</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 검색 통계 */}
            <div className="mt-6 bg-blue-50 p-3 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">검색 통계</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p>• Wikipedia 검색: {sources?.wikipedia?.totalSearches || 0}회 시도</p>
                <p>• 학술논문 검색: {sources?.openalex?.totalSearches || 0}회 시도</p>
                <p>• 최적 Wikipedia 키워드: {summary?.bestResults?.wikipediaKeyword || '없음'}</p>
                <p>• 최적 논문 키워드: {summary?.bestResults?.openalexKeyword || '없음'}</p>
              </div>
            </div>

            {/* 심층 분석 데이터 (새 분석 시스템) */}
            {analysis?.detailedAnalysis && (
              <div className="mt-6 space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    논문 트렌드 분석
                  </h4>
                  {analysis.detailedAnalysis.paperTrends?.yearTrends && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-green-700 mb-2">연도별 논문 수:</div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(analysis.detailedAnalysis.paperTrends.yearTrends)
                          .sort(([a], [b]) => b.localeCompare(a))
                          .slice(0, 5)
                          .map(([year, count]) => (
                          <span key={year} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                            {year}: {String(count)}개
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {analysis.detailedAnalysis.paperTrends?.commonKeywords?.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-green-700 mb-2">주요 연구 키워드:</div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.detailedAnalysis.paperTrends.commonKeywords.slice(0, 6).map((item: any, index: number) => (
                          <span key={index} className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs">
                            {item.keyword} ({item.frequency})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    경쟁 환경 분석
                  </h4>
                  {analysis.detailedAnalysis.competitorLandscape?.commonTools?.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-purple-700 mb-2">자주 언급되는 도구/플랫폼:</div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.detailedAnalysis.competitorLandscape.commonTools.map((tool: any, index: number) => (
                          <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                            {tool.name} ({tool.mentions}회)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {analysis.detailedAnalysis.competitorLandscape?.commonMethods?.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-purple-700 mb-2">주요 접근 방법론:</div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.detailedAnalysis.competitorLandscape.commonMethods.map((method: any, index: number) => (
                          <span key={index} className="px-2 py-1 bg-purple-200 text-purple-800 rounded text-xs">
                            {method.name} ({method.mentions}회)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-amber-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    시장 상황 요약
                  </h4>
                  <div className="text-xs text-amber-700 space-y-1">
                    <p>• 시장 규모: <strong>{analysis.marketSize}</strong> (총 {analysis.detailedAnalysis.marketContext?.totalPapers || 0}개 논문 기준)</p>
                    <p>• 최근 활동: {analysis.detailedAnalysis.marketContext?.recentActivity || 0}개 논문 (최근 2년)</p>
                    <p>• 트렌드 방향: <strong>{analysis.trendDirection}</strong></p>
                    <p>• Wikipedia 문서화: {analysis.detailedAnalysis.marketContext?.hasWikipediaPresence ? '있음' : '없음'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 상세 리서치 결과 */}
      <div className="space-y-6">
        {/* Wikipedia 결과 */}
        {sources?.wikipedia?.success && sources.wikipedia.best?.found && (
          <div className="bg-white border-2 border-slate-200 rounded-xl p-4 sm:p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-600" />
              기본 정보 (Wikipedia)
            </h3>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">
                {sources.wikipedia.best?.mainPage?.title}
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                {sources.wikipedia.best?.mainPage?.summary?.substring(0, 300)}...
              </p>
              
              {sources.wikipedia.best?.relatedTopics?.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-green-700 mb-2">관련 주제:</div>
                  <div className="flex flex-wrap gap-2">
                    {sources.wikipedia.best.relatedTopics.slice(0, 3).map((topic: any, index: number) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        {topic.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* OpenAlex 결과 */}
        {sources?.openalex?.success && sources.openalex.best?.found && (
          <div className="bg-white border-2 border-slate-200 rounded-xl p-4 sm:p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              학술 동향 (OpenAlex)
            </h3>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm font-semibold text-purple-700">논문 수</div>
                  <div className="text-lg font-bold text-purple-600">
                    {sources.openalex.best?.papers?.length || 0}개
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-semibold text-purple-700">평균 인용수</div>
                  <div className="text-lg font-bold text-purple-600">
                    {sources.openalex.best?.trends?.avgCitations?.toFixed(1) || '0'}회
                  </div>
                </div>
              </div>
              
              {sources.openalex.best?.trends?.concepts?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-purple-700 mb-2">주요 연구 분야:</div>
                  <div className="flex flex-wrap gap-2">
                    {sources.openalex.best.trends.concepts.slice(0, 5).map((concept: any, index: number) => (
                      <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                        {concept.name} ({concept.frequency})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 주요 인사이트 */}
        {analysis?.keyInsights?.length > 0 && (
          <div className="bg-white border-2 border-slate-200 rounded-xl p-4 sm:p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              핵심 발견사항
            </h3>
            
            <div className="space-y-3">
              {analysis.keyInsights.map((insight: any, index: number) => (
                <div key={index} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="text-xs font-semibold text-amber-700 mb-1">
                    {insight.source}
                  </div>
                  <p className="text-sm text-slate-700">
                    {insight.insight}
                  </p>
                  {insight.trendingConcepts && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {insight.trendingConcepts.map((concept: string, idx: number) => (
                        <span key={idx} className="px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded text-xs">
                          {concept}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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