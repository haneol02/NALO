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