import { NextRequest, NextResponse } from 'next/server';
import { generateIdeas } from '@/app/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt }: { prompt?: string } = body;

    // 입력 검증
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: '유효한 프롬프트를 입력해주세요.',
        },
        { status: 400 }
      );
    }

    console.log('=== 직접 아이디어 생성 요청 ===');
    console.log('사용자 프롬프트:', prompt);
    console.log('========================');

    // 프롬프트를 바탕으로 AI 아이디어 및 키워드 생성
    const result = await generateIdeas({
      prompt,
    });

    // 결과 검증
    if (!result || !result.ideas) {
      throw new Error('AI 아이디어 생성 결과가 유효하지 않습니다.');
    }

    console.log(`[SUCCESS] ${result.ideas.length}개 아이디어 생성 완료!`);

    // 아이디어에 고유 ID 추가 (기획서 생성 시 사용)
    const ideasWithIds = result.ideas.map((idea: any, index: number) => ({
      ...idea,
      id: `idea_${Date.now()}_${index}`,
      originalPrompt: prompt,
      keywords: result.keywords || []
    }));

    return NextResponse.json({
      success: true,
      ideas: ideasWithIds,
      keywords: result.keywords || [],
      tokensUsed: result.tokensUsed,
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