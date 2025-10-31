import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { rootNode, context, apiKey } = await request.json();

    if (!rootNode || !context) {
      return NextResponse.json({
        success: false,
        error: '필수 파라미터가 누락되었습니다.'
      }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API 키가 필요합니다. 홈 화면에서 API 키를 입력해주세요.'
      }, { status: 401 });
    }

    // 주제 기반 지능적 구조 생성을 위한 프롬프트
    const analysisPrompt = `
주제: "${context}"
루트 노드: "${rootNode.data.label}"

**1단계: 주제 심층 분석**
이 주제의 본질과 맥락을 깊이 분석해주세요:
- 주제의 핵심 키워드와 의미
- 주제가 다루는 주요 영역과 범위  
- 주제와 연관된 사용자의 니즈와 관심사
- 주제에서 파생될 수 있는 구체적인 실행 영역들

**2단계: 주제 맞춤형 구조 설계**
주제 분석 결과를 바탕으로 다음 원칙에 따라 구조를 생성하세요:

1. **주제 중심 영역 도출**: 주제의 핵심 내용에서 자연스럽게 파생되는 4-7개 핵심 영역
   - 주제가 다루는 본질적 측면들을 반영한 영역 구성
   - 미리 정해진 템플릿이 아닌, 주제 특성에 100% 맞춤화된 구조
   - 주제의 키워드와 직접 연결되는 실용적 영역들

2. **주제 기반 하위 구성**: 각 영역마다 2-5개의 구체적 하위 아이템  
   - 주제와의 연관성이 높은 영역일수록 더 세분화
   - 주제 맥락에서 실제 필요한 구체적 실행 항목들

3. **주제 특화 내용**: 
   - 주제 본질과 직접 관련된 내용만 포함
   - 주제 분야의 실제 트렌드와 현황 반영
   - 주제별 특수한 고려사항과 접근법 적용
   - 주제 영역의 실무적 난이도와 우선순위 고려

4. **주제 논리 흐름**: 주제 내용에서 자연스럽게 이어지는 단계적 구조

응답 형식 (JSON):
{
  "analysis": {
    "topicKeywords": "주제의 핵심 키워드들",
    "topicScope": "주제가 다루는 범위",
    "userNeeds": "관련 사용자 니즈",
    "coreAreas": "주제에서 파생되는 핵심 영역들"
  },
  "categories": [
    {
      "title": "카테고리 제목",
      "type": "node",
      "description": "카테고리 설명",
      "priority": "high|medium|low",
      "subItems": [
        {
          "title": "하위 아이템 제목",
          "type": "node",
          "description": "구체적인 설명",
          "difficulty": "easy|medium|hard",
          "importance": "high|medium|low"
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
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `당신은 주제 기반 맞춤형 구조 설계 전문가입니다.
            
**핵심 역량:**
- 주제 본질 분석 및 핵심 영역 도출
- 주제 특성에 100% 맞춤화된 구조 설계
- 주제 맥락을 반영한 실용적 접근법
- 주제 중심의 자연스러운 논리적 흐름 구성

**작업 철학:**
1. 미리 정해진 템플릿이나 카테고리를 사용하지 않음
2. 오직 주제 내용 자체에서 구조를 도출
3. 주제의 본질적 특성을 100% 반영
4. 주제 영역의 실무적 현실성을 고려

반드시 주제 내용을 기반으로 한 완전 맞춤형 구조를 JSON 형식으로 응답하세요.`
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
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

    // 분석 정보 추가하여 반환
    return NextResponse.json({
      success: true,
      structure,
      analysis: structure.analysis || null,
      tokensUsed: data.usage?.total_tokens || 0,
      metadata: {
        generatedAt: new Date().toISOString(),
        categoriesCount: structure.categories?.length || 0,
        totalSubItems: structure.categories?.reduce((sum: number, cat: any) => sum + (cat.subItems?.length || 0), 0) || 0
      }
    });

  } catch (error) {
    console.error('자동 설정 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '자동 설정 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}