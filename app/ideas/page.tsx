'use client';

import { useState, useEffect } from 'react';
import { Calendar, Tag, DollarSign, FileText, Home, Trash2, MoreVertical } from 'lucide-react';
import AuthButton from '../components/AuthButton';
import { createClient } from '@/app/lib/supabase/client';

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
  user_id?: string | null;
  author_email?: string | null;
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<IdeaPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<IdeaPlan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchIdeas();
    
    // 현재 사용자 정보 가져오기
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    
    fetchUser();
  }, []);

  // 외부 클릭으로 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeMenu && !(event.target as Element).closest('.menu-container')) {
        setActiveMenu(null);
      }
    };

    if (activeMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeMenu]);

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
    // 이미 "YYYY.MM.DD HH:MM" 형식인 경우 그대로 반환
    if (dateString.includes(' ') && dateString.includes(':')) {
      return dateString;
    }
    // Date 객체로 파싱 가능한 경우 날짜와 시간 모두 표시
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('ko-KR') + ' ' + date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    // 파싱 불가능한 경우 원본 그대로 반환
    return dateString;
  };

  const formatCost = (cost: number) => {
    return cost.toLocaleString() + '만원';
  };

  // 페이지네이션 관련 계산
  const totalPages = Math.ceil(ideas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentIdeas = ideas.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 현재 사용자가 기획서 소유자인지 확인
  const isOwner = (plan: IdeaPlan) => {
    return currentUser && plan && plan.user_id === currentUser.id;
  };

  const handleDeleteClick = (plan: IdeaPlan) => {
    setSelectedPlan(plan);
    setShowDeleteModal(true);
    setActiveMenu(null);
  };

  const handleDeletePlan = async () => {
    if (!selectedPlan) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/ideas/${selectedPlan.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // 삭제 성공 - 목록에서 제거
        setIdeas(prev => prev.filter(idea => idea.id !== selectedPlan.id));
        
        // 현재 페이지에 아이템이 없으면 이전 페이지로
        const remainingItems = ideas.filter(idea => idea.id !== selectedPlan.id).length;
        const newTotalPages = Math.ceil(remainingItems / itemsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        }
      } else {
        throw new Error(data.error || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('기획서 삭제 실패:', error);
      alert(error instanceof Error ? error.message : '기획서 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setSelectedPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 page-transition">
        {/* 헤더 바 */}
        <header className="bg-white border-b border-slate-200 px-4 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a href="/" className="hover:opacity-80 transition-opacity cursor-pointer">
              <h1 className="text-xl sm:text-2xl font-bold gradient-text">NALO</h1>
            </a>
            <AuthButton />
          </div>
        </header>

        <div className="p-4">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 page-transition no-select">
      {/* 헤더 바 */}
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/" className="hover:opacity-80 transition-opacity cursor-pointer">
            <h1 className="text-xl sm:text-2xl font-bold gradient-text">NALO</h1>
          </a>
          <AuthButton />
        </div>
      </header>

      <div className="max-w-6xl mx-auto pb-16 p-4">

        <header className="mb-6 sm:mb-8 mt-8 sm:mt-12">
          <div className="text-center">
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-800 mb-3 sm:mb-4">
              기획서 저장소
            </h2>
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
          <>
            <div className="grid gap-6">
              {currentIdeas.map((idea, index) => (
              <div key={idea.id} className="card card-hover page-transition mt-6 sm:mt-8 md:mt-12" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg sm:text-xl font-semibold text-slate-800">
                        {idea.project_name}
                      </h3>
                      {isOwner(idea) && (
                        <div className="relative menu-container">
                          <button
                            onClick={() => setActiveMenu(activeMenu === idea.id ? null : idea.id)}
                            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-slate-500" />
                          </button>
                          
                          {/* 메뉴 드롭다운 */}
                          {activeMenu === idea.id && (
                            <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => handleDeleteClick(idea)}
                                  className="w-full px-3 py-2 text-left hover:bg-red-50 flex items-center gap-2 text-red-600 text-sm"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  삭제하기
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12 mb-8">
                <div className="flex items-center gap-2">
                  {/* 이전 페이지 버튼 */}
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === 1 
                        ? 'text-slate-400 cursor-not-allowed' 
                        : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    이전
                  </button>

                  {/* 페이지 번호 */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    // 현재 페이지 주변 5개만 표시
                    const showPage = Math.abs(page - currentPage) <= 2 || page === 1 || page === totalPages;
                    
                    if (!showPage && page === currentPage - 3) {
                      return <span key={page} className="px-2 text-slate-400">...</span>;
                    }
                    if (!showPage && page === currentPage + 3) {
                      return <span key={page} className="px-2 text-slate-400">...</span>;
                    }
                    if (!showPage) {
                      return null;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          page === currentPage
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  {/* 다음 페이지 버튼 */}
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === totalPages 
                        ? 'text-slate-400 cursor-not-allowed' 
                        : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    다음
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 플로팅 네비게이션 - 모바일과 PC 모두 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 z-50">
        <div className="flex justify-center max-w-md mx-auto">
          <a 
            href="/" 
            className="btn-secondary btn-click inline-flex items-center gap-2 px-6 py-3 justify-center"
          >
            <Home className="w-4 h-4" />
            <span className="text-xs">홈으로</span>
          </a>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                기획서를 삭제하시겠습니까?
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                <span className="font-medium">&quot;{selectedPlan.project_name}&quot;</span> 기획서를 삭제하면 복구할 수 없습니다.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedPlan(null);
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleDeletePlan}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? '삭제 중...' : '삭제하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}