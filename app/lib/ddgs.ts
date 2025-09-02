import { search } from 'duck-duck-scrape';
import { dbHelpers } from './supabase';
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
  console.log('🔍 Collecting trends from multiple sources...');
  
  try {
    const allTrends: TrendData[] = [];
    
    // 실제 DuckDuckGo 검색 시도
    try {
      console.log('🦆 DuckDuckGo 검색 시작...');
      const ddgTrends = await searchRealTrends();
      
      if (ddgTrends.length > 0) {
        console.log(`✅ DuckDuckGo에서 ${ddgTrends.length}개 트렌드 수집 성공`);
        allTrends.push(...ddgTrends);
      } else {
        console.log('⚠️ DuckDuckGo에서 트렌드 없음');
      }
    } catch (ddgError) {
      console.error('❌ DuckDuckGo 검색 실패:', ddgError);
      console.log('🔄 목업 데이터로 대체...');
    }
    
    // 목업 데이터를 베이스로 사용
    const mockTrends = getMockTrends();
    allTrends.push(...mockTrends);
    console.log(`📦 목업 데이터 ${mockTrends.length}개 추가`);
    
    // 동적 트렌드 생성
    const dynamicTrends = generateDynamicTrends();
    allTrends.push(...dynamicTrends);
    console.log(`⚡ 동적 트렌드 ${dynamicTrends.length}개 생성`);
    
    // 중복 제거 및 정렬
    const uniqueTrends = deduplicateTrends(allTrends)
      .sort((a, b) => (b.searchVolume || 0) - (a.searchVolume || 0))
      .slice(0, 15);
    
    console.log(`🔄 중복 제거 후 ${uniqueTrends.length}개 트렌드 선별`);
    
    // 데이터베이스에 저장 시도
    try {
      await dbHelpers.saveTrendKeywords(uniqueTrends);
      await dbHelpers.logUsage({
        api_type: 'ddgs',
        success: true,
      });
      console.log(`💾 데이터베이스에 ${uniqueTrends.length}개 트렌드 저장 성공`);
    } catch (dbError) {
      console.error('❌ 데이터베이스 저장 실패:', dbError);
    }
    
    return uniqueTrends;
    
  } catch (error) {
    console.error('💥 트렌드 수집 전체 실패:', error);
    
    // 에러 로그
    try {
      await dbHelpers.logUsage({
        api_type: 'ddgs',
        success: false,
      });
    } catch {}
    
    console.log('🔄 목업 데이터로 완전 대체');
    return getMockTrends();
  }
}

async function searchRealTrends(): Promise<TrendData[]> {
  const trends: TrendData[] = [];
  
  try {
    // Google Custom Search API 사용량 체크
    const googleUsage = checkGoogleApiUsage();
    console.log(`📊 Google API 사용량: ${googleUsage.used}/100 (남은 횟수: ${googleUsage.remaining})`);
    
    // 몇 개의 카테고리에서 검색 시도
    const categoriesToSearch = ['개발/기술', '비즈니스', '라이프스타일'];
    let googleSearchUsed = false;
    
    for (const category of categoriesToSearch) {
      const keywords = SEARCH_KEYWORDS[category as keyof typeof SEARCH_KEYWORDS];
      const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
      
      console.log(`🔍 ${category} 카테고리에서 "${randomKeyword}" 검색 중...`);
      
      // Google Custom Search API 우선 시도 (사용량 제한 내에서)
      if (googleUsage.canUse && !googleSearchUsed) {
        try {
          console.log(`🟢 Google Custom Search API 사용: "${randomKeyword}"`);
          const googleResults = await googleCustomSearch(randomKeyword + ' 트렌드 2025');
          
          if (googleResults.length > 0) {
            const extractedTrends = extractTrendsFromGoogleResults(googleResults, category);
            trends.push(...extractedTrends);
            incrementGoogleApiUsage();
            googleSearchUsed = true;
            console.log(`✅ Google에서 ${extractedTrends.length}개 트렌드 추출 완료`);
            
            // Google API 성공하면 다음 카테고리로
            continue;
          }
        } catch (googleError) {
          console.error(`❌ Google Custom Search 실패:`, googleError);
          console.log(`🔄 DuckDuckGo로 대체 검색 시도...`);
        }
      }
      
      // DuckDuckGo 검색 시도 (Google 실패시 또는 사용량 초과시)
      try {
        console.log(`🦆 DuckDuckGo 검색: "${randomKeyword}"`);
        const results = await search(randomKeyword, {
          region: 'kr-kr',
          safesearch: 'moderate',
          time: 'w',
          max_results: 5
        });
        
        console.log(`📊 DuckDuckGo "${randomKeyword}" 검색 결과: ${results.length}개`);
        
        if (results.length > 0) {
          const extractedTrends = extractTrendsFromResults(results, category);
          trends.push(...extractedTrends);
          console.log(`✨ DuckDuckGo에서 ${extractedTrends.length}개 트렌드 추출 완료`);
        }
        
        // DuckDuckGo API 속도 제한을 위한 지연
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3초로 증가
        
      } catch (ddgError) {
        console.error(`❌ DuckDuckGo "${randomKeyword}" 검색 실패:`, ddgError);
      }
    }
    
    console.log(`🎯 총 ${trends.length}개 실제 트렌드 수집 완료`);
    return trends;
    
  } catch (error) {
    console.error('💥 실제 트렌드 검색 전체 실패:', error);
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

function getMockTrends(): TrendData[] {
  return [
    { keyword: 'AI도구', category: '개발/기술', source: 'mock', searchVolume: 850 },
    { keyword: '원격근무', category: '비즈니스', source: 'mock', searchVolume: 720 },
    { keyword: '지속가능성', category: '라이프스타일', source: 'mock', searchVolume: 630 },
    { keyword: 'NFT', category: '개발/기술', source: 'mock', searchVolume: 590 },
    { keyword: '메타버스', category: '개발/기술', source: 'mock', searchVolume: 540 },
    { keyword: '부업', category: '비즈니스', source: 'mock', searchVolume: 480 },
    { keyword: '헬스테크', category: '헬스케어', source: 'mock', searchVolume: 420 },
    { keyword: '펫테크', category: '라이프스타일', source: 'mock', searchVolume: 380 },
    { keyword: '핀테크', category: '금융', source: 'mock', searchVolume: 340 },
    { keyword: '에듀테크', category: '교육', source: 'mock', searchVolume: 310 },
    { keyword: '푸드테크', category: '라이프스타일', source: 'mock', searchVolume: 280 },
    { keyword: '클린테크', category: '라이프스타일', source: 'mock', searchVolume: 250 },
  ];
}

export async function getTrendKeywords(): Promise<TrendData[]> {
  try {
    console.log('🗃️ 데이터베이스에서 트렌드 조회 중...');
    
    // 먼저 데이터베이스에서 최신 트렌드 조회
    const dbTrends = await dbHelpers.getTrendKeywords(20);
    
    if (dbTrends && dbTrends.length > 0) {
      console.log(`✅ 데이터베이스에서 ${dbTrends.length}개 트렌드 발견`);
      
      return dbTrends.map(trend => ({
        keyword: trend.keyword,
        category: trend.category,
        source: trend.source,
        searchVolume: trend.search_volume
      }));
    }

    console.log('⚠️ 데이터베이스에 트렌드 없음, 새로 수집 시작...');
    // 데이터베이스에 데이터가 없으면 새로 수집
    return await collectTrends();

  } catch (error) {
    console.error('❌ 트렌드 키워드 조회 오류:', error);
    console.log('🔄 목업 데이터로 대체...');
    return getMockTrends();
  }
}