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
    input_keywords?: string[]; // 키워드 정보
    search_query?: string; // 검색 쿼리
    
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
      
      // 선택적 필드들은 null 허용
      main_objectives: plan.main_objectives || null,
      success_metrics: plan.success_metrics || null,
      project_scope_include: plan.project_scope_include || null,
      project_scope_exclude: plan.project_scope_exclude || null,
      market_analysis: plan.market_analysis || null,
      competitors: plan.competitors || null,
      differentiation: plan.differentiation || null,
      swot_strengths: plan.swot_strengths || null,
      swot_weaknesses: plan.swot_weaknesses || null,
      swot_opportunities: plan.swot_opportunities || null,
      swot_threats: plan.swot_threats || null,
      tech_stack: plan.tech_stack || null,
      system_architecture: plan.system_architecture || null,
      database_type: plan.database_type || null,
      development_environment: plan.development_environment || null,
      security_requirements: plan.security_requirements || null,
      project_phases: plan.project_phases || null,
      expected_effects: plan.expected_effects || null,
      business_impact: plan.business_impact || null,
      social_value: plan.social_value || null,
      roi_prediction: plan.roi_prediction || null,
      risk_factors: plan.risk_factors || null,
      risk_response: plan.risk_response || null,
      contingency_plan: plan.contingency_plan || null,
      
      // 키워드 정보 포함
      input_keywords: plan.input_keywords || null,
      search_query: plan.search_query || null
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