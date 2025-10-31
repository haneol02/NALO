import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { node, useWebSearch, apiKey, perplexityApiKey } = await request.json();

    if (!node || !node.label) {
      return NextResponse.json(
        { success: false, error: '노드 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API 키가 필요합니다.' },
        { status: 401 }
      );
    }

    const nodeLabel = node.label;
    const nodeDescription = node.description || '';

    // 웹 검색을 사용하는 경우 Perplexity로 정보 수집
    let webSearchContext = '';
    if (useWebSearch && perplexityApiKey) {
      try {
        const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${perplexityApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'sonar',
            messages: [
              {
                role: 'user',
                content: `"${nodeLabel}"${nodeDescription ? ` (${nodeDescription})` : ''}에 대해 간단히 설명하고, 주요 하위 주제나 구성 요소 5-7개를 나열해주세요. 각 항목은 한 줄로 간단하게 작성해주세요.`
              }
            ],
            temperature: 0.7,
            max_tokens: 1000,
          }),
        });

        if (perplexityResponse.ok) {
          const perplexityData = await perplexityResponse.json();
          webSearchContext = perplexityData.choices?.[0]?.message?.content || '';
          console.log('Perplexity 웹 검색 결과:', webSearchContext);
        }
      } catch (e) {
        console.error('Perplexity 검색 오류:', e);
        // 웹 검색 실패해도 계속 진행
      }
    }

    // OpenAI로 노드 확장
    const systemPrompt = `당신은 마인드맵 노드를 분석하여 구체적인 하위 노드들을 생성하는 AI입니다.

주어진 노드의 주제를 분석하여 5-7개의 구체적이고 실용적인 하위 노드를 생성하세요.

**응답 형식 (JSON만 반환):**
{
  "nodes": [
    {
      "label": "하위 노드 제목",
      "description": "구체적이고 실용적인 설명 (1-2문장)",
      "color": "gray"
    }
  ]
}

**색상 사용 규칙:**
- 대부분(80-90%)은 "gray" 사용
- 강조가 필요한 1-2개만 다른 색상 사용:
  * red: 매우 중요/긴급/문제점
  * blue: 핵심 정보
  * purple: 전략적 중요성
  * green: 완료/성공
  * yellow: 아이디어/브레인스토밍

**중요:**
- 각 노드는 독립적이고 중복되지 않아야 함
- 설명은 구체적이고 실용적으로 작성
- 노드 제목은 간결하고 명확하게 (3-8단어)
${webSearchContext ? '\n**웹 검색 결과를 참고하여 더 정확하고 구체적인 내용을 생성하세요.**' : ''}`;

    const userMessage = webSearchContext
      ? `노드: "${nodeLabel}"${nodeDescription ? `\n설명: ${nodeDescription}` : ''}\n\n웹 검색 결과:\n${webSearchContext}\n\n위 정보를 바탕으로 이 노드의 하위 주제 5-7개를 생성해주세요.`
      : `노드: "${nodeLabel}"${nodeDescription ? `\n설명: ${nodeDescription}` : ''}\n\n이 노드를 확장하여 구체적인 하위 주제 5-7개를 생성해주세요.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('AI 응답이 없습니다.');
    }

    const parsed = JSON.parse(content);
    const expandedNodes = parsed.nodes || [];

    console.log('스마트 확장 생성된 노드:', expandedNodes);

    return NextResponse.json({
      success: true,
      expandedNodes,
      usedWebSearch: useWebSearch && !!webSearchContext
    });

  } catch (error) {
    console.error('스마트 확장 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}
