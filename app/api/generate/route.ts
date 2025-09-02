import { NextRequest, NextResponse } from 'next/server';
import { generateIdeas } from '@/app/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keywords = [], searchResults = [], searchQuery = '' }: { keywords?: string[], searchResults?: any[], searchQuery?: string } = body;

    // 입력 검증
    if (searchResults.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '검색 결과가 없습니다. 다른 키워드로 검색해보세요.',
        },
        { status: 400 }
      );
    }

    console.log('=== 아이디어 생성 요청 ===');
    console.log('검색 쿼리:', searchQuery);
    console.log('검색 결과 수:', searchResults.length);
    console.log('사용자 키워드:', keywords);
    console.log('========================');

    // 검색 결과를 바탕으로 AI 아이디어 생성
    const result = await generateIdeas({
      keywords,
      searchResults,
      searchQuery,
    });

    // 결과 검증
    if (!result || !result.ideas) {
      throw new Error('AI 아이디어 생성 결과가 유효하지 않습니다.');
    }

    // 캐시 제거 - 생성된 아이디어를 메모리에만 저장
    console.log(`✨ ${result.ideas.length}개 아이디어 생성 완료!`);

    return NextResponse.json({
      success: true,
      ideas: result.ideas,
      tokensUsed: result.tokensUsed,
      cached: false,
    });

  } catch (error) {
    console.error('Generate API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      {
        success: false,
        error: '아이디어 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}