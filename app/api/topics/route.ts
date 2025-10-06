import { NextRequest, NextResponse } from 'next/server';
import { generateTopicsFromKeywords } from '@/app/lib/simple-topic-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt = '',
      keywords = [],
      parentTopic = null,
      level = 1,
      additionalPrompt = null,
      apiKey
    }: {
      prompt?: string,
      keywords?: string[],
      parentTopic?: string | null,
      level?: number,
      additionalPrompt?: string | null,
      apiKey?: string
    } = body;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'API 키가 필요합니다.',
        },
        { status: 401 }
      );
    }

    console.log('=== GPT 주제 확장 요청 ===');
    console.log('사용자 프롬프트:', prompt);
    console.log('레벨:', level);
    console.log('키워드:', keywords);
    console.log('부모 주제:', parentTopic);
    console.log('추가 프롬프트:', additionalPrompt);

    // 입력 검증
    if ((!Array.isArray(keywords) || keywords.length === 0) && !prompt.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: '키워드 또는 프롬프트가 필요합니다.',
        },
        { status: 400 }
      );
    }

    // GPT 기반 주제 생성
    const topics = await generateTopicsFromKeywords(keywords, apiKey, parentTopic || undefined, level, additionalPrompt || undefined, prompt || undefined);
    
    console.log(`[SUCCESS] 레벨 ${level} 주제 ${topics.length}개 생성 완료`);

    return NextResponse.json({
      success: true,
      level,
      parentTopic,
      keywords,
      topics,
      count: topics.length,
    });

  } catch (error) {
    console.error('Topics API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      {
        success: false,
        error: '주제 생성 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

