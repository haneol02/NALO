import { googleCustomSearch, extractTrendsFromGoogleResults, checkGoogleApiUsage, incrementGoogleApiUsage } from './google-search';

export interface TrendData {
  keyword: string;
  category: string;
  source: string;
  searchVolume?: number;
}

// 카테고리별 검색 키워드 매핑
const SEARCH_KEYWORDS = {
  '개발/기술': ['새로운 프로그래밍', '개발 도구', '신기술 트렌드', '웹개발 트렌드', 'AI 개발'],
  '비즈니스': ['스타트업 트렌드', '새로운 비즈니스', '사업 아이디어', '창업 트렌드', '부업 아이디어'],
  '콘텐츠': ['콘텐츠 마케팅', '영상 제작', '블로그 트렌드', 'SNS 콘텐츠', '유튜브 트렌드'],
  '라이프스타일': ['라이프스타일 트렌드', '건강 관리', '취미 활동', '생활 편의', '웰빙 트렌드'],
  '교육': ['온라인 교육', '에듀테크', '학습 방법', '교육 기술', '스킬 개발'],
  '금융': ['핀테크', '투자 트렌드', '암호화폐', '개인 금융', '재테크'],
  '헬스케어': ['헬스케어 기술', '의료 IT', '건강 관리', '웰니스', '디지털 헬스'],
  '기타': ['신사업 아이템', '혁신 기술', '미래 트렌드', '새로운 서비스', '글로벌 트렌드']
} as const;

export async function collectTrends(): Promise<TrendData[]> {
  console.log('🔍 Collecting trends from real sources only...');
  
  try {
    const allTrends: TrendData[] = [];
    
    // 실제 검색만 시도
    console.log('🔍 실제 검색 API 호출 시작...');
    const realTrends = await searchRealTrends();
    
    if (realTrends.length > 0) {
      console.log(`✅ 실제 검색에서 ${realTrends.length}개 트렌드 수집 성공`);
      allTrends.push(...realTrends);
    } else {
      console.log('❌ 모든 검색 API에서 데이터를 가져오지 못했습니다.');
      throw new Error('No trends found from any search API');
    }
    
    // 중복 제거 및 정렬 (실제 데이터만)
    const uniqueTrends = deduplicateTrends(allTrends)
      .sort((a, b) => (b.searchVolume || 0) - (a.searchVolume || 0))
      .slice(0, 15);
    
    console.log(`✨ ${uniqueTrends.length}개 실제 트렌드 준비 완료`);
    
    return uniqueTrends;
    
  } catch (error) {
    console.error('💥 트렌드 수집 실패:', error);
    throw error; // 에러를 상위로 전파
  }
}

async function searchRealTrends(): Promise<TrendData[]> {
  const trends: TrendData[] = [];
  
  try {
    // Google Custom Search API 사용량 체크
    const googleUsage = checkGoogleApiUsage();
    console.log(`📊 Google API 사용량: ${googleUsage.used}/100 (남은 횟수: ${googleUsage.remaining})`);
    
    if (!googleUsage.canUse) {
      throw new Error('Google API 일일 사용량을 초과했습니다.');
    }
    
    // 트렌드 검색 질의 생성
    const trendQuery = '한국 트렌드 2025 인기 키워드 새로운 기술';
    
    console.log(`🔍 Google에서 "${trendQuery}" 검색 중...`);
    
    const googleResults = await googleCustomSearch(trendQuery);
    
    if (googleResults.length > 0) {
      const extractedTrends = extractTrendsFromGoogleResults(googleResults, '전체');
      trends.push(...extractedTrends);
      incrementGoogleApiUsage();
      console.log(`✅ Google에서 ${extractedTrends.length}개 트렌드 추출 완료`);
    } else {
      throw new Error('Google 검색에서 결과를 찾을 수 없습니다.');
    }
    
    console.log(`🎯 총 ${trends.length}개 실제 트렌드 수집 완료`);
    return trends;
    
  } catch (error) {
    console.error('💥 Google 검색 실패:', error);
    throw error;
  }
}

function generateDynamicTrends(): TrendData[] {
  const currentHour = new Date().getHours();
  const currentDay = new Date().getDay();
  
  // 시간대별 트렌드
  const timeBasedTrends = [
    { keyword: 'AI 자동화', category: '개발/기술', searchVolume: 600 + currentHour * 10 },
    { keyword: '스마트워크', category: '비즈니스', searchVolume: 500 + currentHour * 8 },
    { keyword: '디지털노마드', category: '라이프스타일', searchVolume: 400 + currentHour * 6 },
  ];
  
  // 요일별 트렌드
  const dayBasedTrends = [
    { keyword: currentDay < 2 ? '주말창업' : '온라인마케팅', category: '비즈니스', searchVolume: 450 },
    { keyword: currentDay < 5 ? '재택근무' : '부업아이템', category: '비즈니스', searchVolume: 380 },
  ];
  
  return [...timeBasedTrends, ...dayBasedTrends].map(trend => ({
    ...trend,
    source: 'dynamic'
  }));
}

function extractTrendsFromResults(results: any[], category: string): TrendData[] {
  const trends: TrendData[] = [];

  results.forEach(result => {
    const title = result.title || '';
    const snippet = result.snippet || '';
    
    // 타이틀과 스니펫에서 트렌드 키워드 추출
    const keywords = extractKeywords(title + ' ' + snippet);
    
    keywords.forEach(keyword => {
      if (keyword.length >= 2 && keyword.length <= 20) {
        trends.push({
          keyword,
          category,
          source: 'ddgs',
          searchVolume: Math.floor(Math.random() * 1000) + 100 // 임시 검색량
        });
      }
    });
  });

  return trends;
}

function extractKeywords(text: string): string[] {
  // 간단한 키워드 추출 로직
  const words = text
    .replace(/[^\w\s가-힣]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 2)
    .filter(word => !/^\d+$/.test(word)); // 숫자만으로 된 단어 제외

  // 빈도 기반으로 키워드 선택
  const frequency: { [key: string]: number } = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.keys(frequency)
    .filter(word => frequency[word] >= 1)
    .slice(0, 5); // 상위 5개만
}

function deduplicateTrends(trends: TrendData[]): TrendData[] {
  const seen = new Set<string>();
  return trends.filter(trend => {
    const key = `${trend.keyword}-${trend.category}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// 목업 데이터 제거 - 오직 실제 Google 검색 결과만 사용

// 메모리 캐시
let trendsCache: TrendData[] = [];
let lastCacheTime = 0;
let lastError: string | null = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30분

export async function getTrendKeywords(): Promise<TrendData[]> {
  try {
    const now = Date.now();
    
    // 캐시가 유효한지 확인
    if (trendsCache.length > 0 && (now - lastCacheTime) < CACHE_DURATION) {
      console.log(`🗃️ 캐시에서 ${trendsCache.length}개 트렌드 반환 (${Math.round((CACHE_DURATION - (now - lastCacheTime)) / 1000)}초 남음)`);
      return trendsCache;
    }

    console.log('🔄 새로운 트렌드 수집 시작...');
    trendsCache = await collectTrends();
    lastCacheTime = now;
    lastError = null; // 성공시 에러 초기화
    
    return trendsCache;

  } catch (error) {
    console.error('❌ 트렌드 수집 실패:', error);
    lastError = error instanceof Error ? error.message : 'Unknown error';
    throw error; // 에러를 상위로 전파하여 클라이언트에 표시
  }
}

export function getLastTrendError(): string | null {
  return lastError;
}