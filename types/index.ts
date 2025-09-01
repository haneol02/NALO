export interface Idea {
  id?: string;
  title: string;
  description: string;
  detailedDescription?: string;
  target: string;
  estimatedCost: number; // 만원 단위
  developmentTime: number; // 주 단위
  difficulty: number; // 1-5 점수
  marketPotential: number; // 1-5 점수
  competition: number; // 1-5 점수
  firstStep: string;
  techStack?: string;
  keyFeatures?: string[];
  challenges?: string[];
  successFactors?: string[];
  createdAt?: Date;
}

export interface TrendKeyword {
  id?: string;
  keyword: string;
  searchVolume?: number;
  category: string;
  source: string;
  createdAt?: Date;
}

export interface GenerateRequest {
  categories: string[];
  customInput: string;
}

export interface GenerateResponse {
  success: boolean;
  ideas: Idea[];
  tokensUsed?: number;
  error?: string;
}

export interface UsageLog {
  id?: string;
  apiType: 'openai' | 'ddgs' | 'supabase';
  tokensUsed?: number;
  success: boolean;
  createdAt?: Date;
}

export interface Feedback {
  id?: string;
  ideaId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt?: Date;
}

export const CATEGORIES = [
  '개발/기술',
  '비즈니스', 
  '콘텐츠',
  '라이프스타일',
  '교육',
  '금융',
  '헬스케어',
  '기타'
] as const;

export type Category = typeof CATEGORIES[number];