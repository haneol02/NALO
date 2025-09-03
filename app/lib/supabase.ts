import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 데이터베이스 헬퍼 함수들
export const dbHelpers = {
  // 트렌드 키워드 저장
  async saveTrendKeywords(keywords: { keyword: string; category: string; source: string; searchVolume?: number }[]) {
    const dbKeywords = keywords.map(k => ({
      keyword: k.keyword,
      category: k.category,
      source: k.source,
      search_volume: k.searchVolume || 0
    }));
    
    const { data, error } = await supabase
      .from('trends')
      .upsert(dbKeywords, { onConflict: 'keyword' });
    
    if (error) throw error;
    return data;
  },

  // 최신 트렌드 키워드 조회
  async getTrendKeywords(limit = 20) {
    const { data, error } = await supabase
      .from('trends')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  // 아이디어 저장 (캐싱용)
  async saveIdea(idea: {
    input_keywords: string[];
    category: string;
    title: string;
    description: string;
    difficulty: number;
    market_potential: number;
    estimated_cost: number;
    development_time: number;
    first_step: string;
  }) {
    const { data, error } = await supabase
      .from('ideas')
      .insert(idea)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // 아이디어 기획서 저장 (단순화된 구조)
  async saveIdeaPlan(plan: {
    project_name: string;
    service_summary?: string;
    created_date: string;
    project_type: string;
    core_idea: string;
    background: string;
    target_customer: string;
    problem_to_solve: string;
    proposed_solution: string;
    features: string[]; // JSON 배열을 문자열 배열로
    development_cost: number;
    operation_cost: number;
    marketing_cost: number;
    other_cost: number;
    idea_id?: string; // 아이디어 ID 연결용
    
    // 하위 호환성을 위한 선택적 필드들 (기본값으로 처리)
    main_objectives?: string;
    success_metrics?: string;
    project_scope_include?: string;
    project_scope_exclude?: string;
    market_analysis?: string;
    competitors?: string;
    differentiation?: string;
    swot_strengths?: string;
    swot_weaknesses?: string;
    swot_opportunities?: string;
    swot_threats?: string;
    tech_stack?: string;
    system_architecture?: string;
    database_type?: string;
    development_environment?: string;
    security_requirements?: string;
    project_phases?: any[];
    expected_effects?: string;
    business_impact?: string;
    social_value?: string;
    roi_prediction?: string;
    risk_factors?: string;
    risk_response?: string;
    contingency_plan?: string;
  }) {
    // 누락된 필드들에 기본값 추가
    const completeData = {
      ...plan,
      // 필수 필드들은 그대로 유지
      project_name: plan.project_name,
      created_date: plan.created_date,
      project_type: plan.project_type,
      core_idea: plan.core_idea,
      background: plan.background,
      target_customer: plan.target_customer,
      problem_to_solve: plan.problem_to_solve,
      proposed_solution: plan.proposed_solution,
      features: plan.features,
      development_cost: plan.development_cost,
      operation_cost: plan.operation_cost,
      marketing_cost: plan.marketing_cost,
      other_cost: plan.other_cost,
      
      // 선택적 필드들의 기본값 설정
      main_objectives: plan.main_objectives || "프로젝트의 주요 목표를 달성하여 사용자 만족도를 높이고 비즈니스 가치를 창출합니다",
      success_metrics: plan.success_metrics || "사용자 증가율, 매출 증대, 사용자 만족도 개선",
      project_scope_include: plan.project_scope_include || "핵심 기능 구현, 사용자 인터페이스 개발, 기본적인 관리 기능",
      project_scope_exclude: plan.project_scope_exclude || "고급 분석 기능, 3rd party 통합, 모바일 앱 개발",
      market_analysis: plan.market_analysis || "해당 시장은 지속적인 성장세를 보이고 있으며 디지털 전환 트렌드에 따라 수요가 증가하고 있습니다",
      competitors: plan.competitors || "기존 경쟁사들과 차별화된 접근 방식을 통해 경쟁력을 확보할 수 있습니다",
      differentiation: plan.differentiation || "사용자 중심의 직관적인 인터페이스와 효율적인 기능 구성을 통한 차별화",
      swot_strengths: plan.swot_strengths || "혁신적인 아이디어와 기술적 전문성",
      swot_weaknesses: plan.swot_weaknesses || "초기 단계의 브랜드 인지도 부족",
      swot_opportunities: plan.swot_opportunities || "디지털 전환 가속화와 시장 성장",
      swot_threats: plan.swot_threats || "경쟁사의 시장 진입과 기술 발전 속도",
      tech_stack: plan.tech_stack || "현대적인 웹 기술 스택을 활용한 안정적인 시스템 구축",
      system_architecture: plan.system_architecture || "확장 가능한 클라우드 기반 시스템 아키텍처",
      database_type: plan.database_type || "PostgreSQL 또는 MongoDB를 활용한 데이터 관리",
      development_environment: plan.development_environment || "Git 기반 협업과 CI/CD 파이프라인 구축",
      security_requirements: plan.security_requirements || "데이터 암호화, 접근 권한 관리, 보안 모니터링",
      project_phases: plan.project_phases || [
        {
          phase: "1단계: 기획 및 설계",
          tasks: "요구사항 분석, 시스템 설계, UI/UX 디자인",
          start_date: "프로젝트 시작일",
          end_date: "4주 후",
          manager: "프로젝트 매니저",
          status: "계획"
        },
        {
          phase: "2단계: 개발",
          tasks: "핵심 기능 개발, API 구현, 프론트엔드 개발",
          start_date: "5주 차",
          end_date: "12주 후",
          manager: "개발팀 리드",
          status: "계획"
        },
        {
          phase: "3단계: 테스트 및 배포",
          tasks: "QA 테스트, 성능 최적화, 배포 및 모니터링",
          start_date: "13주 차",
          end_date: "16주 후",
          manager: "QA 리드",
          status: "계획"
        }
      ],
      expected_effects: plan.expected_effects || "사용자 경험 개선을 통한 만족도 증대 및 비즈니스 목표 달성",
      business_impact: plan.business_impact || "운영 효율성 증대와 수익성 개선에 기여",
      social_value: plan.social_value || "디지털 혁신을 통한 사회적 가치 창출",
      roi_prediction: plan.roi_prediction || "1년 내 투자 대비 150% 수익률 달성 목표",
      risk_factors: plan.risk_factors || "기술적 복잡성, 시장 변화, 경쟁 심화 등의 위험 요소",
      risk_response: plan.risk_response || "단계적 개발과 지속적인 모니터링을 통한 리스크 관리",
      contingency_plan: plan.contingency_plan || "대안 기술 스택 준비 및 예비 리소스 확보"
    };

    const { data, error } = await supabase
      .from('idea_plans')
      .insert(completeData)
      .select()
      .single();
    
    if (error) {
      console.error('기획서 DB 저장 오류:', error);
      throw error;
    }
    
    console.log('기획서 DB 저장 성공:', data.id);
    return data;
  },

  // 비슷한 아이디어 조회 (캐싱용)
  async getSimilarIdeas(keywords: string[], limit = 5) {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .contains('input_keywords', keywords)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  // 저장된 아이디어 기획서 조회
  async getIdeaPlans(limit = 20) {
    const { data, error } = await supabase
      .from('idea_plans')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  // 특정 아이디어 기획서 조회
  async getIdeaPlan(id: string) {
    const { data, error } = await supabase
      .from('idea_plans')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // 사용량 로그 저장
  async logUsage(log: {
    api_type: 'openai' | 'ddgs' | 'supabase';
    tokens_used?: number;
    success: boolean;
  }) {
    const { data, error } = await supabase
      .from('usage_logs')
      .insert(log);
    
    if (error) throw error;
    return data;
  },

  // 피드백 저장
  async saveFeedback(feedback: {
    idea_id: string;
    rating: number;
    comment?: string;
  }) {
    const { data, error } = await supabase
      .from('feedback')
      .insert(feedback);
    
    if (error) throw error;
    return data;
  },

  // 일일 토큰 사용량 조회
  async getDailyTokenUsage() {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('usage_logs')
      .select('tokens_used')
      .eq('api_type', 'openai')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);
    
    if (error) throw error;
    
    const totalTokens = data?.reduce((sum, log) => sum + (log.tokens_used || 0), 0) || 0;
    return totalTokens;
  },
};

export default supabase;