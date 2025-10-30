import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { topic, apiKey } = await req.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { success: false, error: '검색할 주제를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Perplexity API 키가 필요합니다.' },
        { status: 401 }
      );
    }

    console.log(`🔍 Perplexity 리서치 시작: ${topic}`);

    // Perplexity API 호출
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: '당신은 최신 정보를 검색하여 정확하고 구조화된 리서치 보고서를 작성하는 전문가입니다. 항상 출처를 명시하고 객관적인 데이터를 제공합니다.'
          },
          {
            role: 'user',
            content: `"${topic}"에 대한 최신 정보를 다음 관점에서 리서치해주세요:

1. 최신 트렌드: 최근 6개월 이내의 주요 뉴스, 업데이트, 트렌드
2. 시장 현황: 관련 기업, 제품, 서비스의 현재 상태
3. 기술 동향: 적용되고 있는 주요 기술과 혁신
4. 사용 사례: 실제 활용 사례와 성공/실패 사례
5. 전문가 의견: 업계 전문가나 분석가의 견해

각 항목마다 구체적인 출처와 날짜를 포함해주세요.`
          }
        ],
        max_tokens: 2000,
        temperature: 0.2,
        top_p: 0.9
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Perplexity API 오류:', errorData);
      throw new Error(`Perplexity API 오류: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Perplexity 응답:', data);

    const content = data.choices?.[0]?.message?.content || '';
    const citations = data.citations || [];

    // 응답 구조화
    const structuredResponse = {
      success: true,
      data: {
        topic,
        content,
        citations,
        summary: content.substring(0, 300) + (content.length > 300 ? '...' : ''),
        timestamp: new Date().toISOString(),
        model: data.model || 'sonar'
      }
    };

    console.log(`✅ Perplexity 리서치 완료: ${topic}`);
    return NextResponse.json(structuredResponse);

  } catch (error) {
    console.error('Perplexity 리서치 API 에러:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Perplexity 리서치 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
