'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  AlertTriangle,
  Calendar,
  Tag,
  DollarSign,
  FileText,
  Sparkles,
  Target,
  Wrench,
  Shield,
  TrendingUp,
  Share,
  Rocket,
  Zap,
  Copy,
  MoreHorizontal
} from 'lucide-react';

interface IdeaPlan {
  id: string;
  project_name: string;
  service_summary?: string;
  created_date: string;
  project_type: string;
  core_idea: string;
  background: string;
  target_customer: string;
  problem_to_solve: string;
  proposed_solution: string;
  main_objectives: string;
  success_metrics: string;
  project_scope_include: string;
  project_scope_exclude: string;
  features: any[];
  market_analysis: string;
  competitors: string;
  differentiation: string;
  swot_strengths: string;
  swot_weaknesses: string;
  swot_opportunities: string;
  swot_threats: string;
  tech_stack: string;
  system_architecture: string;
  database_type: string;
  development_environment: string;
  security_requirements: string;
  project_phases: any[];
  expected_effects: string;
  business_impact: string;
  social_value: string;
  roi_prediction: string;
  development_cost: number;
  operation_cost: number;
  marketing_cost: number;
  other_cost: number;
  risk_factors: string;
  risk_response: string;
  contingency_plan: string;
  created_at: string;
}

export default function BusinessPlanPage() {
  const params = useParams();
  const [plan, setPlan] = useState<IdeaPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isToastFading, setIsToastFading] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  useEffect(() => {
    fetchPlan();
  }, [params.id]);

  // 외부 클릭으로 공유 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuOpen && !(event.target as Element).closest('.share-menu-container')) {
        setShareMenuOpen(false);
      }
    };

    if (shareMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [shareMenuOpen]);

  const fetchPlan = async () => {
    try {
      const response = await fetch(`/api/ideas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: params.id }),
      });

      const data = await response.json();

      if (data.success && data.idea) {
        setPlan(data.idea);
      } else {
        setError('기획서를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('기획서 조회 실패:', error);
      setError('기획서를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatCost = (cost: number) => {
    return cost.toLocaleString() + '만원';
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    setShareMenuOpen(false);
    
    try {
      // 모던 브라우저의 Clipboard API 사용
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => {
          setIsToastFading(true);
          setTimeout(() => {
            setCopied(false);
            setIsToastFading(false);
          }, 300);
        }, 2700);
      } else {
        // 폴백: 구형 브라우저나 비보안 컨텍스트를 위한 방법
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          setCopied(true);
          setTimeout(() => {
            setIsToastFading(true);
            setTimeout(() => {
              setCopied(false);
              setIsToastFading(false);
            }, 300);
          }, 2700);
        } catch (err) {
          console.error('폴백 복사 실패:', err);
          alert('링크 복사에 실패했습니다. 수동으로 복사해주세요:\n' + url);
        }
        
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
      // 최종 폴백: 사용자에게 직접 보여주기
      alert('링크 복사에 실패했습니다. 수동으로 복사해주세요:\n' + url);
    }
  };

  const handleNativeShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${plan?.project_name} 기획서 - NALO`,
          text: `${plan?.core_idea}`,
          url: url,
        });
        setShareMenuOpen(false);
      } catch (err) {
        console.log('공유가 취소되었습니다.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-600">기획서를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              기획서를 찾을 수 없습니다
            </h2>
            <div className="mb-2"></div>
            <p className="text-slate-600 mb-8">
              {error || '요청하신 기획서가 존재하지 않거나 삭제되었습니다.'}
            </p>
            <a href="/" className="btn-primary">
              홈으로 돌아가기
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 page-transition no-select">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <a 
              href="/ideas" 
              className="btn-secondary inline-flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start"
            >
              ← 목록으로
            </a>
            <div className="relative w-full sm:w-auto share-menu-container">
              <button
                onClick={() => setShareMenuOpen(!shareMenuOpen)}
                className="btn-outline inline-flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <Share className="w-4 h-4 text-blue-600" />
                공유하기
              </button>
              
              {/* 공유 메뉴 */}
              {shareMenuOpen && (
                <div className="absolute left-0 sm:right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
                  <div className="py-2">
                    <button
                      onClick={handleCopyLink}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700 text-sm"
                    >
                      <Copy className="w-4 h-4" />
                      링크 복사
                    </button>
                    {navigator.share && (
                      <button
                        onClick={handleNativeShare}
                        className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700 text-sm"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                        다른 앱으로 공유
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* 토스트 메시지 */}
          {copied && (
            <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
              isToastFading ? 'animate-fade-out-up' : 'animate-fade-in-down'
            }`}>
              <Copy className="w-4 h-4" />
              <span className="text-sm font-medium">링크가 복사되었습니다</span>
            </div>
          )}
          
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold gradient-text mb-2">
              {plan.project_name}
            </h1>
            <div className="mb-2"></div>
            {plan.service_summary && (
              <p className="text-lg sm:text-xl text-blue-700 font-semibold mb-3 selectable">
                {plan.service_summary}
              </p>
            )}
            <p className="text-base sm:text-lg text-slate-600 mb-4 selectable">
              {plan.core_idea}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm text-slate-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" />
                <span>{formatDate(plan.created_date)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Tag className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" />
                <span>{plan.project_type}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                <span>총 {formatCost(plan.development_cost + plan.operation_cost + plan.marketing_cost + plan.other_cost)}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="space-y-8">
          {/* 1. 기본 정보 */}
          <section className="card">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-6 h-6 text-slate-600" />
              <h2 className="section-title">기본 정보</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">작성일</h3>
                <div className="mb-1"></div>
                <p className="text-slate-600">{plan.created_date}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">프로젝트 유형</h3>
                <div className="mb-1"></div>
                <p className="text-slate-600">{plan.project_type}</p>
              </div>
            </div>
          </section>

          {/* 2. 프로젝트 개요 */}
          <section className="card">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-6 h-6 text-blue-600" />
              <h2 className="section-title">프로젝트 개요</h2>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">핵심 아이디어</h3>
                <div className="mb-1"></div>
                <p className="text-slate-600 leading-relaxed">{plan.core_idea}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">배경 및 동기</h3>
                <div className="mb-1"></div>
                <p className="text-slate-600 leading-relaxed">{plan.background}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">대상 고객/사용자</h3>
                <div className="mb-1"></div>
                <p className="text-slate-600 leading-relaxed">{plan.target_customer}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">해결하려는 문제</h3>
                <p className="text-slate-600 leading-relaxed">{plan.problem_to_solve}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">제안하는 해결책</h3>
                <p className="text-slate-600 leading-relaxed">{plan.proposed_solution}</p>
              </div>
            </div>
          </section>

          {/* 3. 주요 기능 */}
          <section className="card">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              <h2 className="section-title">주요 기능</h2>
            </div>
            {plan.features && plan.features.length > 0 ? (
              <div className="grid gap-4">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-slate-700">
                      {typeof feature === 'string' ? feature : (feature.detail_feature || feature.feature_id || '기능')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">기능 명세 정보가 없습니다.</p>
            )}
          </section>

          {/* SWOT 분석 */}
          <section className="card">
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-6 h-6 text-indigo-600" />
              <h2 className="section-title">SWOT 분석</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-green-600" />
                  <h3 className="font-semibold text-green-800">강점 (Strengths)</h3>
                </div>
                <p className="text-slate-600 leading-relaxed">{plan.swot_strengths}</p>
              </div>
              <div className="p-6 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <h3 className="font-semibold text-red-800">약점 (Weaknesses)</h3>
                </div>
                <p className="text-slate-600 leading-relaxed">{plan.swot_weaknesses}</p>
              </div>
              <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Rocket className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">기회 (Opportunities)</h3>
                </div>
                <p className="text-slate-600 leading-relaxed">{plan.swot_opportunities}</p>
              </div>
              <div className="p-6 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <h3 className="font-semibold text-amber-800">위협 (Threats)</h3>
                </div>
                <p className="text-slate-600 leading-relaxed">{plan.swot_threats}</p>
              </div>
            </div>
          </section>

          {/* 기술적 요구사항 */}
          <section className="card">
            <div className="flex items-center gap-2 mb-6">
              <Wrench className="w-6 h-6 text-violet-600" />
              <h2 className="section-title">기술적 요구사항</h2>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">사용 기술</h3>
                <p className="text-slate-600 leading-relaxed">{plan.tech_stack}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">시스템 아키텍처</h3>
                <p className="text-slate-600 leading-relaxed">{plan.system_architecture}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">데이터베이스</h3>
                <p className="text-slate-600 leading-relaxed">{plan.database_type}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">보안 요구사항</h3>
                <p className="text-slate-600 leading-relaxed">{plan.security_requirements}</p>
              </div>
            </div>
          </section>

          {/* 예산 */}
          <section className="card">
            <div className="flex items-center gap-2 mb-6">
              <DollarSign className="w-6 h-6 text-green-600" />
              <h2 className="section-title">예산</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                  <span className="text-slate-700">개발비</span>
                  <span className="font-semibold text-slate-900">{formatCost(plan.development_cost)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                  <span className="text-slate-700">운영비</span>
                  <span className="font-semibold text-slate-900">{formatCost(plan.operation_cost)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                  <span className="text-slate-700">마케팅비</span>
                  <span className="font-semibold text-slate-900">{formatCost(plan.marketing_cost)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                  <span className="text-slate-700">기타</span>
                  <span className="font-semibold text-slate-900">{formatCost(plan.other_cost)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <span className="font-semibold text-blue-800">총액</span>
                  <span className="font-bold text-xl text-blue-900">
                    {formatCost(plan.development_cost + plan.operation_cost + plan.marketing_cost + plan.other_cost)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 위험 관리 */}
          <section className="card">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-6 h-6 text-red-600" />
              <h2 className="section-title">위험 관리</h2>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">예상 위험요소</h3>
                <p className="text-slate-600 leading-relaxed">{plan.risk_factors}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">위험 대응 방안</h3>
                <p className="text-slate-600 leading-relaxed">{plan.risk_response}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">비상 계획</h3>
                <p className="text-slate-600 leading-relaxed">{plan.contingency_plan}</p>
              </div>
            </div>
          </section>

          {/* 기대효과 및 성과 */}
          <section className="card">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              <h2 className="section-title">기대효과 및 성과</h2>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">예상 효과</h3>
                <p className="text-slate-600 leading-relaxed">{plan.expected_effects}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">비즈니스 임팩트</h3>
                <p className="text-slate-600 leading-relaxed">{plan.business_impact}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">사회적 가치</h3>
                <p className="text-slate-600 leading-relaxed">{plan.social_value}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">ROI 예측</h3>
                <p className="text-slate-600 leading-relaxed">{plan.roi_prediction}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-slate-500 pb-8">
          <p>이 기획서는 NALO AI를 통해 생성되었습니다.</p>
          <div className="mt-2">
            <a href="/" className="text-blue-600 hover:text-blue-700">
              새로운 아이디어 생성하기
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}