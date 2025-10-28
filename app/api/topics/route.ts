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

    // 프롬프트에서 키워드 추출 (키워드가 없는 경우)
    let extractedKeywords = keywords;
    if (prompt && (!keywords || keywords.length === 0)) {
      // 프롬프트에서 핵심 키워드 추출
      const keywordExtractionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: '당신은 텍스트에서 핵심 키워드를 추출하는 전문가입니다. 항상 JSON 형식으로만 응답합니다.'
            },
            {
              role: 'user',
              content: `다음 주제에서 핵심 키워드 3-5개를 추출해주세요:\n"${prompt}"\n\nJSON 형식으로 응답: {"keywords": ["키워드1", "키워드2", "키워드3"]}`
            }
          ],
          temperature: 0.3,
          max_tokens: 200,
        }),
      });

      if (keywordExtractionResponse.ok) {
        const data = await keywordExtractionResponse.json();
        const content = data.choices[0]?.message?.content || '{}';
        try {
          const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(cleanedContent);
          extractedKeywords = parsed.keywords || [];
          console.log('추출된 키워드:', extractedKeywords);
        } catch (e) {
          console.error('키워드 추출 파싱 실패:', e);
          // 프롬프트를 단순 분할하여 키워드로 사용
          extractedKeywords = prompt.split(/\s+/).slice(0, 3);
        }
      } else {
        // 프롬프트를 단순 분할하여 키워드로 사용
        extractedKeywords = prompt.split(/\s+/).slice(0, 3);
      }
    }

    // GPT 기반 주제 생성
    const topics = await generateTopicsFromKeywords(extractedKeywords, apiKey, parentTopic || undefined, level, additionalPrompt || undefined, prompt || undefined);

    console.log(`[SUCCESS] 레벨 ${level} 주제 ${topics.length}개 생성 완료`);
    console.log('사용된 키워드:', extractedKeywords);

    return NextResponse.json({
      success: true,
      level,
      parentTopic,
      keywords: extractedKeywords,  // 추출된 키워드 반환
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

