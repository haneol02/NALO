import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { selectedNode, context, expandOptions = {} } = await request.json();
    
    console.log('=== 마인드맵 AI 확장 요청 ===');
    console.log('선택된 노드:', selectedNode);
    console.log('컨텍스트:', context);

    if (!selectedNode || !selectedNode.data) {
      return NextResponse.json(
        { success: false, error: '선택된 노드 정보가 없습니다.' },
        { status: 400 }
      );
    }

    // AI 프롬프트 생성
    const { mode, category, count, aiDetermineCount } = expandOptions;
    
    let typeInstruction = '';
    if (mode === 'simple' && category && category !== 'mixed') {
      typeInstruction = `모든 아이디어의 타입을 "${category}"로 통일해주세요.`;
    } else {
      typeInstruction = `각 아이디어의 타입을 "idea", "feature", "problem", "solution", "detail" 중에서 적절하게 선택해주세요.`;
    }

    const prompt = `
다음은 마인드맵 노드 확장 요청입니다:

**확장할 대상 노드:**
- 노드명: "${selectedNode.data.label}"
- 노드 타입: ${selectedNode.data.type}
- 노드 설명: ${selectedNode.data.description || '없음'}

**컨텍스트 정보:**
${context || '전체 주제: 알 수 없음'}

**확장 설정:**
- 모드: ${mode || 'simple'}
${category && category !== 'mixed' ? `- 지정된 카테고리: ${category}` : ''}

**중요:** 반드시 위에 명시된 "${selectedNode.data.label}" 노드를 기준으로 하위 아이디어를 생성해주세요.

${aiDetermineCount || (mode === 'simple' && category === 'mixed')
  ? '이 노드에서 확장할 수 있는 하위 아이디어를 제안해주세요. 최적의 개수(2-6개 사이)를 직접 판단하여 생성하세요.' 
  : `이 노드에서 확장할 수 있는 정확히 ${count || 3}개의 하위 아이디어를 제안해주세요.`}
각 아이디어는 선택된 노드와 논리적으로 연결되어야 하며, 실용적이고 구체적이어야 합니다.
${typeInstruction}

응답 형식:
{
  "suggestions": [
    {
      "label": "아이디어 제목",
      "type": "idea|feature|problem|solution|detail",
      "description": "간단한 설명"
    }
  ]
}
`;

    console.log('=== OpenAI API 호출 시작 ===');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `당신은 창의적인 아이디어 확장 전문가입니다. **반드시 사용자가 지정한 특정 노드만을 기준으로** 하위 아이디어들을 ${aiDetermineCount || (mode === 'simple' && category === 'mixed') ? '최적의 개수(2-6개 사이)로 직접 판단하여' : `정확히 ${expandOptions.count || 3}개`} 제안해주세요. 전체 프로젝트가 아닌 선택된 노드와 직접적으로 연관된 아이디어만 생성하세요. ${mode === 'simple' && category && category !== 'mixed' ? `모든 아이디어는 "${category}" 타입이어야 합니다.` : '각 아이디어의 타입을 상황에 맞게 선택해주세요.'} 응답은 반드시 JSON 형식으로만 해주세요.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.8,
    });

    const response = completion.choices[0]?.message?.content;
    const tokensUsed = completion.usage?.total_tokens || 0;
    
    console.log('=== OpenAI API 응답 ===');
    console.log('사용된 토큰:', tokensUsed);
    console.log('응답 내용:', response);

    if (!response) {
      throw new Error('OpenAI 응답이 비어있습니다.');
    }

    // JSON 파싱
    let suggestions;
    try {
      const parsed = JSON.parse(response);
      suggestions = parsed.suggestions || [];
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      console.log('원본 응답:', response);
      
      // 파싱 실패시 기본 제안 반환
      suggestions = [
        { label: '기능 개선', type: 'feature', description: 'AI 제안' },
        { label: '사용자 경험', type: 'detail', description: 'AI 제안' },
        { label: '기술적 고려사항', type: 'problem', description: 'AI 제안' }
      ];
    }

    // 빈 배열이면 기본 제안 반환
    if (!suggestions || suggestions.length === 0) {
      suggestions = [
        { label: '세부 기능', type: 'feature', description: '구체적인 기능 정의' },
        { label: '구현 방안', type: 'solution', description: '실현 가능한 방법' },
        { label: '예상 이슈', type: 'problem', description: '고려해야 할 사항' }
      ];
    }

    console.log('=== 최종 제안 ===');
    console.log('제안 수:', suggestions.length);

    return NextResponse.json({
      success: true,
      suggestions,
      tokensUsed
    });

  } catch (error) {
    console.error('마인드맵 AI 확장 오류:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: '아이디어 확장 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}