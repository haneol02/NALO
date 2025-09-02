import { NextRequest, NextResponse } from 'next/server';
import { googleCustomSearch, checkGoogleApiUsage, incrementGoogleApiUsage } from '@/app/lib/google-search';
import { analyzeKeywords, evaluateSearchResults } from '@/app/lib/keyword-analyzer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keywords = [] }: { keywords?: string[] } = body;

    // 입력 검증
    if (keywords.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '검색할 키워드를 선택해주세요.',
        },
        { status: 400 }
      );
    }

    console.log('=== 스마트 키워드 검색 요청 ===');
    console.log('선택된 키워드:', keywords);

    // Google API 사용량 체크
    const googleUsage = checkGoogleApiUsage();
    console.log(`Google API 사용량: ${googleUsage.used}/100`);
    
    if (!googleUsage.canUse) {
      return NextResponse.json(
        {
          success: false,
          error: 'Google API 일일 사용량을 초과했습니다. 내일 다시 시도해주세요.',
        },
        { status: 429 }
      );
    }

    // 스마트 검색 쿼리 생성
    const keywordAnalysis = analyzeKeywords(keywords);
    const { searchQuery, focusArea, keywords: extractedKeywords } = keywordAnalysis;
    
    console.log('스마트 검색 쿼리:', searchQuery);
    console.log('포커스 영역:', focusArea);
    console.log('추출된 키워드:', extractedKeywords);

    // Google 검색 실행
    const searchResults = await googleCustomSearch(searchQuery);
    incrementGoogleApiUsage();

    console.log(`검색 결과: ${searchResults.length}개`);
    
    // 검색 결과 품질 평가
    const qualityScore = evaluateSearchResults(searchResults, extractedKeywords);
    console.log('검색 결과 품질 점수:', qualityScore, '/10');

    return NextResponse.json({
      success: true,
      searchQuery,
      focusArea,
      keywords: extractedKeywords,
      qualityScore,
      results: searchResults.map(result => ({
        title: result.title,
        snippet: result.snippet,
        link: result.link
      })),
      count: searchResults.length,
    });

  } catch (error) {
    console.error('검색 API 오류:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      {
        success: false,
        error: '검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}