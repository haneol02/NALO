import { google } from 'googleapis';
import { TrendData } from './ddgs';

const API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

export interface GoogleSearchResult {
  title: string;
  snippet: string;
  link: string;
  displayLink: string;
}

export async function googleCustomSearch(query: string): Promise<GoogleSearchResult[]> {
  console.log(`🔍 Google Custom Search: "${query}" 검색 중...`);
  
  if (!API_KEY || !SEARCH_ENGINE_ID) {
    console.error('❌ Google Custom Search API 키 또는 검색 엔진 ID가 설정되지 않음');
    throw new Error('Google Custom Search API credentials not configured');
  }

  try {
    const customSearch = google.customsearch('v1');
    
    const response = await customSearch.cse.list({
      auth: API_KEY,
      cx: SEARCH_ENGINE_ID,
      q: query,
      num: 5, // 최대 5개 결과
      safe: 'medium',
      lr: 'lang_ko', // 한국어 우선
      gl: 'kr', // 한국 지역
    });

    const results = response.data.items || [];
    
    console.log(`📊 Google Custom Search "${query}" 결과: ${results.length}개`);
    
    return results.map(item => ({
      title: item.title || '',
      snippet: item.snippet || '',
      link: item.link || '',
      displayLink: item.displayLink || ''
    }));

  } catch (error) {
    console.error(`❌ Google Custom Search "${query}" 검색 실패:`, error);
    throw error;
  }
}

export function extractTrendsFromGoogleResults(results: GoogleSearchResult[], category: string): TrendData[] {
  const trends: TrendData[] = [];

  results.forEach(result => {
    const text = `${result.title} ${result.snippet}`;
    const keywords = extractKeywordsFromText(text);
    
    keywords.forEach(keyword => {
      if (keyword.length >= 2 && keyword.length <= 20) {
        trends.push({
          keyword,
          category,
          source: 'google',
          searchVolume: Math.floor(Math.random() * 800) + 200
        });
      }
    });
  });

  console.log(`✨ Google 결과에서 ${trends.length}개 트렌드 추출 완료`);
  return trends;
}

function extractKeywordsFromText(text: string): string[] {
  // 한글, 영문, 숫자가 포함된 키워드 추출
  const koreanWords = text.match(/[가-힣]{2,10}/g) || [];
  const englishWords = text.match(/[A-Za-z]{3,15}/g) || [];
  const mixedWords = text.match(/[가-힣A-Za-z0-9]{2,15}/g) || [];
  
  const allWords = [...new Set([...koreanWords, ...englishWords, ...mixedWords])];
  
  // 불용어 제거
  const stopWords = ['이것', '그것', '저것', '입니다', '합니다', '있습니다', '없습니다', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  
  return allWords
    .filter(word => !stopWords.includes(word.toLowerCase()))
    .filter(word => word.length >= 2)
    .slice(0, 10); // 최대 10개만
}

// API 사용량 체크 함수
export function checkGoogleApiUsage() {
  // 하루 100회 제한을 고려한 체크 로직
  const today = new Date().toDateString();
  const usageKey = `google_search_usage_${today}`;
  
  if (typeof window !== 'undefined') {
    const usage = parseInt(localStorage.getItem(usageKey) || '0');
    return { used: usage, remaining: 100 - usage, canUse: usage < 100 };
  }
  
  return { used: 0, remaining: 100, canUse: true };
}

export function incrementGoogleApiUsage() {
  if (typeof window !== 'undefined') {
    const today = new Date().toDateString();
    const usageKey = `google_search_usage_${today}`;
    const currentUsage = parseInt(localStorage.getItem(usageKey) || '0');
    localStorage.setItem(usageKey, (currentUsage + 1).toString());
  }
}