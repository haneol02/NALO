import { search } from 'duck-duck-scrape';
import { dbHelpers } from './supabase';

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
  const allTrends: TrendData[] = [];

  try {
    // 각 카테고리별로 트렌드 수집
    const categoryEntries = Object.entries(SEARCH_KEYWORDS);
    for (let catIndex = 0; catIndex < categoryEntries.length; catIndex++) {
      const [category, keywords] = categoryEntries[catIndex];
      
      // 카테고리 간에도 대기 시간 추가
      if (catIndex > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // 카테고리당 1개 키워드만 검색 (API 호출 제한 강화)
      const selectedKeywords = keywords.slice(0, 1);
      
      for (let i = 0; i < selectedKeywords.length; i++) {
        const keyword = selectedKeywords[i];
        try {
          // 첫 번째 요청이 아닌 경우 더 긴 대기
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
          
          const searchResults = await search(keyword);

          // 검색 결과에서 트렌드 키워드 추출
          const trends = extractTrendsFromResults(searchResults.results, category);
          allTrends.push(...trends);

        } catch (error) {
          console.error(`Error searching for ${keyword}:`, error);
          
          // Rate limit 에러인 경우 더 긴 대기
          if (error instanceof Error && error.message.includes('anomaly')) {
            console.log(`Rate limit detected for "${keyword}", waiting 10 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 10000));
          } else {
            // 일반 에러인 경우 짧은 대기
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
    }

    // 중복 제거 및 정리
    const uniqueTrends = deduplicateTrends(allTrends);
    
    // 수집된 트렌드가 없으면 기본 트렌드 반환
    if (uniqueTrends.length === 0) {
      console.log('No trends collected due to rate limits, using mock data');
      return getMockTrends();
    }
    
    // 데이터베이스에 저장
    if (uniqueTrends.length > 0) {
      await dbHelpers.saveTrendKeywords(uniqueTrends);
      
      // 사용량 로그
      await dbHelpers.logUsage({
        api_type: 'ddgs',
        success: true,
      });
    }

    return uniqueTrends;

  } catch (error) {
    // 에러 로그
    await dbHelpers.logUsage({
      api_type: 'ddgs',
      success: false,
    });

    console.error('Error collecting trends:', error);
    
    // 실패시 목업 데이터 반환
    return getMockTrends();
  }
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

function getMockTrends(): TrendData[] {
  return [
    { keyword: 'AI도구', category: '개발/기술', source: 'mock' },
    { keyword: '원격근무', category: '비즈니스', source: 'mock' },
    { keyword: '지속가능성', category: '라이프스타일', source: 'mock' },
    { keyword: 'NFT', category: '개발/기술', source: 'mock' },
    { keyword: '메타버스', category: '개발/기술', source: 'mock' },
    { keyword: '부업', category: '비즈니스', source: 'mock' },
    { keyword: '헬스테크', category: '헬스케어', source: 'mock' },
    { keyword: '펫테크', category: '라이프스타일', source: 'mock' },
  ];
}

export async function getTrendKeywords(): Promise<TrendData[]> {
  try {
    // 먼저 데이터베이스에서 최신 트렌드 조회
    const dbTrends = await dbHelpers.getTrendKeywords(20);
    
    if (dbTrends && dbTrends.length > 0) {
      return dbTrends.map(trend => ({
        keyword: trend.keyword,
        category: trend.category,
        source: trend.source,
        searchVolume: trend.search_volume
      }));
    }

    // 데이터베이스에 데이터가 없으면 새로 수집
    return await collectTrends();

  } catch (error) {
    console.error('Error getting trend keywords:', error);
    return getMockTrends();
  }
}