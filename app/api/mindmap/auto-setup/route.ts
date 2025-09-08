import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { rootNode, context } = await request.json();

    if (!rootNode || !context) {
      return NextResponse.json({
        success: false,
        error: '필수 파라미터가 누락되었습니다.'
      }, { status: 400 });
    }

    // OpenAI API 키 확인
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API 키가 설정되지 않았습니다.'
      }, { status: 500 });
    }

    // AI에게 자동 설정을 위한 구조 생성 요청
    const prompt = `
주제: "${context}"
루트 노드: "${rootNode.data.label}"

위 주제를 분석하여 브레인스토밍을 위한 기본 구조를 생성해주세요.

다음 규칙을 따라주세요:
1. 4-6개의 주요 카테고리로 분류 (problem, idea, feature, solution, detail 중에서 선택)
2. 각 카테고리마다 2-4개의 하위 아이템 생성
3. 실용적이고 구체적인 내용으로 구성
4. 프로젝트 기획에 도움이 되는 내용

응답 형식 (JSON):
{
  "categories": [
    {
      "title": "카테고리 제목",
      "type": "problem|idea|feature|solution|detail",
      "description": "간단한 설명 (선택사항)",
      "subItems": [
        {
          "title": "하위 아이템 제목",
          "type": "problem|idea|feature|solution|detail",
          "description": "간단한 설명 (선택사항)"
        }
      ]
    }
  ]
}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '당신은 브레인스토밍과 프로젝트 기획을 도와주는 AI 어시스턴트입니다. 주어진 주제를 분석하여 체계적인 마인드맵 구조를 생성해주세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('OpenAI 응답에서 콘텐츠를 찾을 수 없습니다.');
    }

    // JSON 파싱
    let structure;
    try {
      const content = data.choices[0].message.content.trim();
      // JSON 블록 추출 (```json ... ``` 형태일 경우)
      const jsonMatch = content.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      structure = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      throw new Error('AI 응답을 파싱하는 중 오류가 발생했습니다.');
    }

    return NextResponse.json({
      success: true,
      structure,
      tokensUsed: data.usage?.total_tokens || 0
    });

  } catch (error) {
    console.error('자동 설정 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '자동 설정 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}