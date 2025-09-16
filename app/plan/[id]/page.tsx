'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/client';
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
  MoreHorizontal,
  BarChart3,
  CheckCircle,
  Home,
  ArrowLeft,
  Download,
  Trash2
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
  key_features?: string[];
  difficulty?: number;
  market_potential?: number;
  competition?: number;
  challenges?: string[];
  success_factors?: string[];
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
  input_keywords?: string[];
  search_query?: string;
  user_id?: string | null;
  author_email?: string | null;
}

export default function BusinessPlanPage() {
  const params = useParams();
  const [plan, setPlan] = useState<IdeaPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isToastFading, setIsToastFading] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const fetchPlan = useCallback(async () => {
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
  }, [params.id]);

  useEffect(() => {
    fetchPlan();
    
    // 현재 사용자 정보 가져오기
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    
    fetchUser();
  }, [fetchPlan]);

  // 외부 클릭으로 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuOpen && !(event.target as Element).closest('.share-menu-container')) {
        setShareMenuOpen(false);
      }
      if (downloadMenuOpen && !(event.target as Element).closest('.download-menu-container')) {
        setDownloadMenuOpen(false);
      }
      if (moreMenuOpen && !(event.target as Element).closest('.more-menu-container')) {
        setMoreMenuOpen(false);
      }
    };

    if (shareMenuOpen || downloadMenuOpen || moreMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [shareMenuOpen, downloadMenuOpen, moreMenuOpen]);

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

  const handleExportPDF = async () => {
    if (!plan) return;
    
    setIsGeneratingPDF(true);
    setDownloadMenuOpen(false);
    
    try {
      // 동적으로 라이브러리 import
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).jsPDF;
      
      // PDF로 변환할 컨테이너 선택
      const element = document.getElementById('pdf-content');
      if (!element) {
        throw new Error('PDF 컨텐츠를 찾을 수 없습니다.');
      }
      
      // 페이지 헤더바만 숨기기
      const pageHeader = document.querySelector('body > div > header') as HTMLElement;
      const originalPageHeaderDisplay = pageHeader?.style.display;
      
      if (pageHeader) pageHeader.style.display = 'none';
      
      // PDF용 임시 컨테이너 생성
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = `
        padding: 10px;
        background: white;
        position: absolute;
        top: -10000px;
        left: -10000px;
        width: ${element.scrollWidth}px;
      `;
      
      // 원본 내용 복사 (그라데이션 텍스트만 처리)
      const clonedElement = element.cloneNode(true) as HTMLElement;
      
      // 그라데이션 텍스트를 일반 텍스트로 변환
      const gradientTexts = clonedElement.querySelectorAll('.gradient-text-black, .gradient-text');
      gradientTexts.forEach((el) => {
        (el as HTMLElement).style.cssText = `
          color: #1e293b !important;
          background: none !important;
          -webkit-background-clip: unset !important;
          background-clip: unset !important;
          -webkit-text-fill-color: unset !important;
        `;
        el.classList.remove('gradient-text-black', 'gradient-text');
      });
      
      tempContainer.appendChild(clonedElement);
      document.body.appendChild(tempContainer);
      
      // 캔버스로 변환
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        height: tempContainer.scrollHeight,
        width: tempContainer.scrollWidth,
      });
      
      // 임시 컨테이너 제거
      document.body.removeChild(tempContainer);
      
      // 페이지 헤더바 복구
      if (pageHeader) pageHeader.style.display = originalPageHeaderDisplay || '';
      
      const imgData = canvas.toDataURL('image/png');
      
      // PDF 생성 (좌우 여백만 적용)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // 좌우 여백만
      const imgWidth = pdfWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let remainingHeight = imgHeight;
      let sourceY = 0;
      let isFirstPage = true;
      
      while (remainingHeight > 0) {
        if (!isFirstPage) {
          pdf.addPage();
        }
        
        // 현재 페이지에 들어갈 높이 계산
        const currentPageHeight = Math.min(pdfHeight, remainingHeight);
        
        // 캔버스에서 해당 부분만 잘라내기 위한 임시 캔버스 생성
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        if (tempCtx) {
          tempCanvas.width = canvas.width;
          tempCanvas.height = (currentPageHeight * canvas.width) / imgWidth;
          
          // 원본 캔버스에서 해당 부분을 복사
          tempCtx.drawImage(
            canvas,
            0, // sx
            (sourceY * canvas.width) / imgWidth, // sy - 소스에서 잘라낼 Y 위치
            canvas.width, // sWidth
            tempCanvas.height, // sHeight
            0, // dx
            0, // dy
            canvas.width, // dWidth
            tempCanvas.height // dHeight
          );
          
          const pageImgData = tempCanvas.toDataURL('image/png');
          
          // PDF에 페이지별 이미지 추가 (상하 여백 없음)
          pdf.addImage(pageImgData, 'PNG', margin, 0, imgWidth, currentPageHeight);
        }
        
        sourceY += currentPageHeight;
        remainingHeight -= currentPageHeight;
        isFirstPage = false;
      }
      
      // PDF 다운로드
      const fileName = `${plan.project_name}_기획서.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('PDF 생성 중 오류:', error);
      alert('PDF 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!plan) return;
    
    setDownloadMenuOpen(false);
    
    // 마크다운 형식으로 변환
    const markdown = generateMarkdown(plan);
    
    // 다운로드
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${plan.project_name}_기획서.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeletePlan = async () => {
    if (!plan) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/ideas/${plan.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // 삭제 성공 - 목록 페이지로 리다이렉트
        window.location.href = '/ideas';
      } else {
        throw new Error(data.error || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('기획서 삭제 실패:', error);
      alert(error instanceof Error ? error.message : '기획서 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const generateMarkdown = (plan: IdeaPlan): string => {
    return `# ${plan.project_name}

${plan.service_summary ? `> ${plan.service_summary}\n` : ''}

**작성일**: ${formatDate(plan.created_date)}  
**프로젝트 유형**: ${plan.project_type}  
**총 예산**: ${formatCost(plan.development_cost + plan.operation_cost + plan.marketing_cost + plan.other_cost)}

${plan.input_keywords && plan.input_keywords.length > 0 ? `**키워드**: ${plan.input_keywords.map(k => `\`${k}\``).join(', ')}\n` : ''}

## 📋 프로젝트 개요

### 핵심 아이디어
${plan.core_idea || '데이터 없음'}

### 배경 및 동기
${plan.background || '데이터 없음'}

### 대상 고객/사용자
${plan.target_customer || '데이터 없음'}

### 해결하려는 문제
${plan.problem_to_solve || '데이터 없음'}

### 제안하는 해결책
${plan.proposed_solution || '데이터 없음'}

## 🎯 프로젝트 목표

### 주요 목표
${plan.main_objectives || '데이터 없음'}

### 성공 지표
${plan.success_metrics || '데이터 없음'}

## 📌 프로젝트 범위

### 포함 사항
${plan.project_scope_include || '데이터 없음'}

### 제외 사항
${plan.project_scope_exclude || '데이터 없음'}

## ✨ 주요 기능

${plan.features && plan.features.length > 0 ? 
  plan.features.map((feature, index) => 
    `${index + 1}. ${typeof feature === 'string' ? feature : (feature.detail_feature || feature.feature_id || '기능')}`
  ).join('\n') : 
  '기능 명세 정보가 없습니다.'
}

${plan.key_features && plan.key_features.length > 0 ? `
### 핵심 기능
${plan.key_features.map((feature, index) => `${index + 1}. ${feature}`).join('\n')}
` : ''}

## 📊 실현 가능성 분석

${plan.difficulty ? `**기술 난이도**: ${getDifficultyText(plan.difficulty)} (${plan.difficulty}/5)\n` : ''}
${plan.market_potential ? `**시장 잠재력**: ${getMarketPotentialText(plan.market_potential)} (${plan.market_potential}/5)\n` : ''}
${plan.competition ? `**경쟁 우위도**: ${getCompetitionText(plan.competition)} (${5 - plan.competition}/5)\n` : ''}

${plan.challenges && plan.challenges.length > 0 ? `
### ⚠️ 예상 도전과제
${plan.challenges.map(challenge => `- ${challenge}`).join('\n')}
` : ''}

${plan.success_factors && plan.success_factors.length > 0 ? `
### ✅ 성공 요인
${plan.success_factors.map(factor => `- ${factor}`).join('\n')}
` : ''}

## 📈 시장 분석

### 시장 분석
${plan.market_analysis || '데이터 없음'}

### 경쟁사 분석
${plan.competitors || '데이터 없음'}

### 차별화 포인트
${plan.differentiation || '데이터 없음'}

## 🔍 SWOT 분석

### 강점 (Strengths)
${plan.swot_strengths || '데이터 없음'}

### 약점 (Weaknesses)
${plan.swot_weaknesses || '데이터 없음'}

### 기회 (Opportunities)
${plan.swot_opportunities || '데이터 없음'}

### 위협 (Threats)
${plan.swot_threats || '데이터 없음'}

## 🛠 기술적 요구사항

### 사용 기술
${plan.tech_stack || '데이터 없음'}

### 시스템 아키텍처
${plan.system_architecture || '데이터 없음'}

### 데이터베이스
${plan.database_type || '데이터 없음'}

### 개발 환경
${plan.development_environment || '데이터 없음'}

### 보안 요구사항
${plan.security_requirements || '데이터 없음'}

${plan.project_phases && plan.project_phases.length > 0 ? `
## 📅 프로젝트 단계

${plan.project_phases.map((phase, index) => {
  if (typeof phase === 'string') {
    return `### ${index + 1}. ${phase}`;
  } else {
    return `### ${index + 1}. ${phase.phase || `${index + 1}단계`}
${phase.duration ? `**기간**: ${phase.duration}\n` : ''}
${phase.tasks ? `**주요 작업**: ${Array.isArray(phase.tasks) ? phase.tasks.join(', ') : phase.tasks}\n` : ''}
${phase.deliverables ? `**결과물**: ${Array.isArray(phase.deliverables) ? phase.deliverables.join(', ') : phase.deliverables}\n` : ''}`;
  }
}).join('\n\n')}
` : ''}

## 💰 예산

| 항목 | 금액 |
|------|------|
| 개발비 | ${formatCost(plan.development_cost)} |
| 운영비 | ${formatCost(plan.operation_cost)} |
| 마케팅비 | ${formatCost(plan.marketing_cost)} |
| 기타 | ${formatCost(plan.other_cost)} |
| **총액** | **${formatCost(plan.development_cost + plan.operation_cost + plan.marketing_cost + plan.other_cost)}** |

## 🛡️ 위험 관리

### 예상 위험요소
${plan.risk_factors || '데이터 없음'}

### 위험 대응 방안
${plan.risk_response || '데이터 없음'}

### 비상 계획
${plan.contingency_plan || '데이터 없음'}

## 📊 기대효과 및 성과

### 예상 효과
${plan.expected_effects || '데이터 없음'}

### 비즈니스 임팩트
${plan.business_impact || '데이터 없음'}

### 사회적 가치
${plan.social_value || '데이터 없음'}

### ROI 예측
${plan.roi_prediction || '데이터 없음'}

---

*이 기획서는 NALO AI를 통해 생성되었습니다.*`;
  };

  const getDifficultyText = (difficulty: number): string => {
    const texts = ['', '매우 쉬움', '쉬움', '보통', '어려움', '매우 어려움'];
    return texts[difficulty] || '보통';
  };

  const getMarketPotentialText = (potential: number): string => {
    const texts = ['', '매우 낮음', '낮음', '보통', '높음', '매우 높음'];
    return texts[potential] || '보통';
  };

  const getCompetitionText = (competition: number): string => {
    const texts = ['', '매우 유리', '유리', '보통', '불리', '매우 불리'];
    return texts[competition] || '보통';
  };

  // 현재 사용자가 기획서 소유자인지 확인
  const isOwner = () => {
    return currentUser && plan && plan.user_id === currentUser.id;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* 헤더 바 */}
        <header className="bg-white border-b border-slate-200 px-4 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-center">
            <h1 className="text-xl sm:text-2xl font-bold gradient-text">NALO</h1>
          </div>
        </header>

        <div className="p-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-slate-600">기획서를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* 헤더 바 */}
        <header className="bg-white border-b border-slate-200 px-4 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-center">
            <h1 className="text-xl sm:text-2xl font-bold gradient-text">NALO</h1>
          </div>
        </header>

        <div className="p-4">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 page-transition no-select">
      {/* 헤더 바 */}
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <h1 className="text-xl sm:text-2xl font-bold gradient-text">NALO</h1>
        </div>
      </header>

      <div className="w-full max-w-4xl mx-auto p-4" id="pdf-content">

        {/* Header - 데스크톱용 */}
        <header className="mb-8 mt-8 sm:mt-12">
          
          {/* 토스트 메시지 */}
          {copied && (
            <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
              isToastFading ? 'animate-fade-out-up' : 'animate-fade-in-down'
            }`}>
              <Copy className="w-4 h-4" />
              <span className="text-sm font-medium">링크가 복사되었습니다</span>
            </div>
          )}

          {/* PDF 생성 중 오버레이 */}
          {isGeneratingPDF && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center">
              <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4">
                <div className="text-center">
                  <div className="inline-block relative mb-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                    <div className="absolute inset-2 animate-pulse rounded-full bg-gradient-to-r from-blue-400 to-white opacity-20"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    PDF 생성 중
                  </h3>
                  <p className="text-sm text-slate-600">
                    기획서를 PDF로 변환하고 있습니다.<br />
                    잠시만 기다려주세요.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="text-3xl sm:text-4xl text-slate-400 font-light">&lt;</span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black gradient-text-black">
                {plan.project_name}
              </h1>
              <span className="text-3xl sm:text-4xl text-slate-400 font-light">&gt;</span>
            </div>
            {plan.service_summary && (
              <p className="text-base sm:text-xl text-blue-700 font-semibold mb-3 selectable">
                {plan.service_summary}
              </p>
            )}
            <p className="text-sm sm:text-lg text-slate-600 mb-4 selectable">
              {plan.core_idea}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-500">
              <div className="flex items-center justify-center gap-1.5">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" />
                <span>{formatDate(plan.created_date)}</span>
              </div>
              {(plan.user_id || plan.author_email) && (
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>작성자: {plan.author_email || (plan.user_id?.substring(0, 8) + '...')}</span>
                </div>
              )}
              <div className="flex items-center justify-center gap-1.5">
                <Tag className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" />
                <span>{plan.project_type}</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                <span>총 {formatCost(plan.development_cost + plan.operation_cost + plan.marketing_cost + plan.other_cost)}</span>
              </div>
            </div>
            {/* 키워드 표시 */}
            {plan.input_keywords && plan.input_keywords.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {plan.input_keywords.map((keyword, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="space-y-8">
          {/* 1. 기본 정보 */}
          <section className="card">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-6 h-6 text-slate-600" />
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800">기본 정보</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">작성일</h3>
                <div className="mb-1"></div>
                <p className="text-xs sm:text-sm text-slate-600">{formatDate(plan.created_date)}</p>
              </div>
              {(plan.user_id || plan.author_email) && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-2">작성자</h3>
                  <div className="mb-1"></div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <p className="text-xs sm:text-sm text-slate-600">{plan.author_email || (plan.user_id?.substring(0, 8) + '...')}</p>
                  </div>
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">프로젝트 유형</h3>
                <div className="mb-1"></div>
                <p className="text-xs sm:text-sm text-slate-600">{plan.project_type}</p>
              </div>
            </div>

            {/* 핵심 기능 */}
            {plan.key_features && plan.key_features.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  핵심 기능
                </h3>
                <div className="space-y-3">
                  {plan.key_features.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-slate-700 selectable">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 실현 가능성 분석 */}
            {(plan.difficulty || plan.market_potential || plan.competition) && (
              <div className="mb-8">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  실현 가능성 분석
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {plan.difficulty && (
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-sm text-slate-600 mb-2">기술 난이도</div>
                      <div className="flex justify-center mb-2">
                        {Array.from({ length: 5 }, (_, i) => (
                          <div key={i} className={`w-3 h-3 rounded-full inline-block mr-1 ${
                            i < (plan.difficulty || 0) ? 'bg-blue-500' : 'bg-slate-300'
                          }`} />
                        ))}
                      </div>
                      <div className="text-xs text-slate-500">
                        {(plan.difficulty || 0) === 1 ? '매우 쉬움' : 
                         (plan.difficulty || 0) === 2 ? '쉬움' :
                         (plan.difficulty || 0) === 3 ? '보통' :
                         (plan.difficulty || 0) === 4 ? '어려움' : '매우 어려움'}
                      </div>
                    </div>
                  )}
                  {plan.market_potential && (
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-sm text-slate-600 mb-2">시장 잠재력</div>
                      <div className="flex justify-center mb-2">
                        {Array.from({ length: 5 }, (_, i) => (
                          <div key={i} className={`w-3 h-3 rounded-full inline-block mr-1 ${
                            i < (plan.market_potential || 0) ? 'bg-blue-500' : 'bg-slate-300'
                          }`} />
                        ))}
                      </div>
                      <div className="text-xs text-slate-500">
                        {(plan.market_potential || 0) === 1 ? '매우 낮음' : 
                         (plan.market_potential || 0) === 2 ? '낮음' :
                         (plan.market_potential || 0) === 3 ? '보통' :
                         (plan.market_potential || 0) === 4 ? '높음' : '매우 높음'}
                      </div>
                    </div>
                  )}
                  {plan.competition && (
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-sm text-slate-600 mb-2">경쟁 우위도</div>
                      <div className="flex justify-center mb-2">
                        {Array.from({ length: 5 }, (_, i) => (
                          <div key={i} className={`w-3 h-3 rounded-full inline-block mr-1 ${
                            i < (5 - (plan.competition || 0)) ? 'bg-blue-500' : 'bg-slate-300'
                          }`} />
                        ))}
                      </div>
                      <div className="text-xs text-slate-500">
                        {(plan.competition || 0) === 1 ? '매우 유리' : 
                         (plan.competition || 0) === 2 ? '유리' :
                         (plan.competition || 0) === 3 ? '보통' :
                         (plan.competition || 0) === 4 ? '불리' : '매우 불리'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 예상 도전과제와 성공 요인 */}
            {(plan.challenges || plan.success_factors) && (
              <div className="grid md:grid-cols-2 gap-6">
                {plan.challenges && plan.challenges.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                    <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      예상 도전과제
                    </h4>
                    <ul className="space-y-2">
                      {plan.challenges.map((challenge: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div className="w-1 h-1 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-red-700 selectable">{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {plan.success_factors && plan.success_factors.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      성공 요인
                    </h4>
                    <ul className="space-y-2">
                      {plan.success_factors.map((factor: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div className="w-1 h-1 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-green-700 selectable">{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* 2. 프로젝트 개요 */}
          <section className="card">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800">프로젝트 개요</h2>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">핵심 아이디어</h3>
                <div className="mb-1"></div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{plan.core_idea || '데이터 없음'}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">배경 및 동기</h3>
                <div className="mb-1"></div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{plan.background || '데이터 없음'}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">대상 고객/사용자</h3>
                <div className="mb-1"></div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{plan.target_customer || '데이터 없음'}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">해결하려는 문제</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{plan.problem_to_solve || '데이터 없음'}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">제안하는 해결책</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{plan.proposed_solution || '데이터 없음'}</p>
              </div>
            </div>
          </section>

          {/* 3. 주요 목표 */}
          <section className="card">
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-6 h-6 text-purple-600" />
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800">프로젝트 목표</h2>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">주요 목표</h3>
                <div className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {plan.main_objectives || '데이터 없음'}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">성공 지표</h3>
                <div className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {plan.success_metrics || '데이터 없음'}
                </div>
              </div>
            </div>
          </section>

          {/* 4. 프로젝트 범위 */}
          <section className="card">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-6 h-6 text-orange-600" />
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800">프로젝트 범위</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-green-600" />
                  <h3 className="font-semibold text-green-800">포함 사항</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{plan.project_scope_include || '데이터 없음'}</p>
              </div>
              <div className="p-6 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <h3 className="font-semibold text-red-800">제외 사항</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{plan.project_scope_exclude || '데이터 없음'}</p>
              </div>
            </div>
          </section>

          {/* 5. 주요 기능 */}
          <section className="card">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800">주요 기능</h2>
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

          {/* 6. 시장 분석 */}
          <section className="card">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800">시장 분석</h2>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">시장 분석</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{plan.market_analysis || '데이터 없음'}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">경쟁사 분석</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{plan.competitors || '데이터 없음'}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">차별화 포인트</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{plan.differentiation || '데이터 없음'}</p>
              </div>
            </div>
          </section>

          {/* SWOT 분석 */}
          <section className="card">
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-6 h-6 text-indigo-600" />
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800">SWOT 분석</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-green-600" />
                  <h3 className="font-semibold text-green-800">강점 (Strengths)</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{plan.swot_strengths || '데이터 없음'}</p>
              </div>
              <div className="p-6 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <h3 className="font-semibold text-red-800">약점 (Weaknesses)</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{plan.swot_weaknesses || '데이터 없음'}</p>
              </div>
              <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Rocket className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">기회 (Opportunities)</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{plan.swot_opportunities || '데이터 없음'}</p>
              </div>
              <div className="p-6 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <h3 className="font-semibold text-amber-800">위협 (Threats)</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{plan.swot_threats || '데이터 없음'}</p>
              </div>
            </div>
          </section>

          {/* 기술적 요구사항 */}
          <section className="card">
            <div className="flex items-center gap-2 mb-6">
              <Wrench className="w-6 h-6 text-violet-600" />
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800">기술적 요구사항</h2>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">사용 기술</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{plan.tech_stack || '데이터 없음'}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">시스템 아키텍처</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{plan.system_architecture || '데이터 없음'}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">데이터베이스</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{plan.database_type || '데이터 없음'}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">개발 환경</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{plan.development_environment || '데이터 없음'}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">보안 요구사항</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{plan.security_requirements || '데이터 없음'}</p>
              </div>
            </div>
          </section>

          {/* 프로젝트 단계 */}
          {plan.project_phases && plan.project_phases.length > 0 && (
            <section className="card">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-6 h-6 text-blue-600" />
                <h2 className="text-lg sm:text-xl font-semibold text-slate-800">프로젝트 단계</h2>
              </div>
              <div className="space-y-4">
                {plan.project_phases.map((phase, index) => (
                  <div key={index} className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-800 mb-2">
                      {typeof phase === 'string' ? phase : (phase.phase || `${index + 1}단계`)}
                    </h3>
                    {typeof phase === 'object' && (
                      <div className="space-y-3">
                        {phase.duration && (
                          <div>
                            <span className="text-sm font-medium text-slate-600">기간: </span>
                            <span className="text-slate-700">{phase.duration}</span>
                          </div>
                        )}
                        {phase.tasks && (
                          <div>
                            <span className="text-sm font-medium text-slate-600">주요 작업: </span>
                            <span className="text-slate-700">
                              {Array.isArray(phase.tasks) ? phase.tasks.join(', ') : phase.tasks}
                            </span>
                          </div>
                        )}
                        {phase.deliverables && (
                          <div>
                            <span className="text-sm font-medium text-slate-600">결과물: </span>
                            <span className="text-slate-700">
                              {Array.isArray(phase.deliverables) ? phase.deliverables.join(', ') : phase.deliverables}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 예산 */}
          <section className="card">
            <div className="flex items-center gap-2 mb-6">
              <DollarSign className="w-6 h-6 text-green-600" />
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800">예산</h2>
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
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800">위험 관리</h2>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">예상 위험요소</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{plan.risk_factors || '데이터 없음'}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">위험 대응 방안</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{plan.risk_response || '데이터 없음'}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">비상 계획</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{plan.contingency_plan || '데이터 없음'}</p>
              </div>
            </div>
          </section>

          {/* 기대효과 및 성과 */}
          <section className="card">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800">기대효과 및 성과</h2>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">예상 효과</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{plan.expected_effects || '데이터 없음'}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">비즈니스 임팩트</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{plan.business_impact || '데이터 없음'}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">사회적 가치</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{plan.social_value || '데이터 없음'}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">ROI 예측</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{plan.roi_prediction || '데이터 없음'}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-slate-500 pb-20 sm:pb-8">
          <p>이 기획서는 NALO AI를 통해 생성되었습니다.</p>
          <div className="mt-2">
            <a href="/" className="text-blue-600 hover:text-blue-700">
              새로운 아이디어 생성하기
            </a>
          </div>
        </footer>
      </div>

      {/* 플로팅 네비게이션 - 모바일 최적화 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 z-50">
        <div className="flex justify-center gap-3 max-w-sm mx-auto">
          <a 
            href="/ideas" 
            className="btn-secondary inline-flex items-center gap-2 px-4 py-2.5 flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">목록으로</span>
          </a>
          <a 
            href="/" 
            className="btn-secondary inline-flex items-center gap-2 px-4 py-2.5 flex-shrink-0"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium">홈으로</span>
          </a>
          <div className="relative more-menu-container flex-shrink-0">
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              disabled={isGeneratingPDF || isDeleting}
              className="btn-outline inline-flex items-center gap-2 px-4 py-2.5"
            >
              <MoreHorizontal className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">더보기</span>
            </button>
            
            {/* 더보기 메뉴 */}
            {moreMenuOpen && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-52 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
                <div className="py-2">
                  {/* 저장 옵션들 */}
                  <div className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    저장
                  </div>
                  <button
                    onClick={() => {
                      setMoreMenuOpen(false);
                      handleExportPDF();
                    }}
                    disabled={isGeneratingPDF}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">PDF로 저장</span>
                  </button>
                  <button
                    onClick={() => {
                      setMoreMenuOpen(false);
                      handleExportMarkdown();
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">마크다운 저장</span>
                  </button>
                  
                  {/* 구분선 */}
                  <div className="border-t border-slate-200 my-2"></div>
                  
                  {/* 공유 옵션들 */}
                  <div className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    공유
                  </div>
                  <button
                    onClick={() => {
                      setMoreMenuOpen(false);
                      handleCopyLink();
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700"
                  >
                    <Copy className="w-4 h-4" />
                    <span className="text-sm">링크 복사</span>
                  </button>
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button
                      onClick={() => {
                        setMoreMenuOpen(false);
                        handleNativeShare();
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700"
                    >
                      <Share className="w-4 h-4" />
                      <span className="text-sm">다른 앱으로 공유</span>
                    </button>
                  )}
                  
                  {/* 삭제 옵션 - 소유자에게만 표시 */}
                  {isOwner() && (
                    <>
                      <div className="border-t border-slate-200 my-2"></div>
                      <div className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        관리
                      </div>
                      <button
                        onClick={() => {
                          setMoreMenuOpen(false);
                          setShowDeleteModal(true);
                        }}
                        disabled={isDeleting}
                        className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-3 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">{isDeleting ? '삭제 중...' : '기획서 삭제'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
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
                <span className="font-medium">&quot;{plan?.project_name}&quot;</span> 기획서를 삭제하면 복구할 수 없습니다.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
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