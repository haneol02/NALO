'use client';

import { useState, useEffect } from 'react';
import { Calendar, Tag, DollarSign, FileText } from 'lucide-react';

interface IdeaPlan {
  id: string;
  project_name: string;
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
  input_keywords: string[];
  search_query: string;
  created_at: string;
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<IdeaPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    try {
      const response = await fetch('/api/ideas');
      const data = await response.json();
      
      if (data.success) {
        setIdeas(data.ideas);
      }
    } catch (error) {
      console.error('아이디어 조회 실패:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 page-transition">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block relative mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent loading-pulse"></div>
              <div className="absolute inset-2 animate-pulse rounded-full bg-gradient-to-r from-blue-400 to-white opacity-20"></div>
            </div>
            <p className="text-slate-600 loading-pulse">아이디어 목록을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 page-transition no-select">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 sm:mb-8">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <a 
              href="/" 
              className="btn-secondary btn-click inline-flex items-center gap-2 text-sm sm:text-base"
            >
              ← 홈으로
            </a>
            <div></div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl sm:text-4xl font-bold text-slate-800 mb-3 sm:mb-4">
              기획서 저장소
            </h1>
            <div className="mb-2"></div>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto px-4">
              생성된 프로젝트 아이디어들의 상세한 기획서를 확인하세요
            </p>
          </div>
        </header>

        {ideas.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-600" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-700 mb-2">
              저장된 아이디어가 없습니다
            </h2>
            <div className="mb-2"></div>
            <p className="text-slate-500 mb-6">
              먼저 아이디어를 생성해보세요!
            </p>
            <a 
              href="/" 
              className="btn-primary btn-click inline-flex items-center gap-2"
            >
              아이디어 생성하기
            </a>
          </div>
        ) : (
          <div className="grid gap-6">
            {ideas.map((idea, index) => (
              <div key={idea.id} className="card card-hover page-transition" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">
                      {idea.project_name}
                    </h3>
                    <div className="mb-1"></div>
                    <p className="text-sm sm:text-base text-slate-600 mb-3 selectable">
                      {idea.core_idea}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" />
                        <span>{formatDate(idea.created_date)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" />
                        <span>{idea.project_type}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                        <span>총 {formatCost(idea.development_cost + idea.operation_cost + idea.marketing_cost + idea.other_cost)}</span>
                      </div>
                    </div>
                  </div>
                  <a
                    href={`/plan/${idea.id}`}
                    className="btn-secondary btn-click w-full sm:w-auto text-center text-sm sm:text-base"
                  >
                    기획서 보기
                  </a>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {idea.input_keywords && idea.input_keywords.length > 0 ? (
                    idea.input_keywords.map((keyword, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm"
                      >
                        {keyword}
                      </span>
                    ))
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm">
                      키워드 정보 없음
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}