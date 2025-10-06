import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const { text, apiKey } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: '유효한 텍스트를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API 키가 필요합니다.' },
        { status: 401 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `사용자가 입력한 문장에서 핵심 키워드를 추출하는 역할을 합니다.
          
규칙:
1. 3-5개의 핵심 키워드를 추출합니다
2. 명사 위주로 추출하되, 핵심적인 형용사나 동사도 포함할 수 있습니다
3. 너무 일반적인 단어는 피합니다 (예: 서비스, 만들다 등)
4. 기술 용어, 도메인 특화 용어, 구체적인 개념을 우선합니다
5. 영어와 한글이 섞여있어도 의미가 명확하면 유지합니다

응답 형식:
JSON 배열로 키워드만 반환합니다. 예: ["AI", "챗봇", "웹개발", "자동화"]`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    });

    const result = completion.choices[0]?.message?.content;
    
    if (!result) {
      throw new Error('AI 응답을 받을 수 없습니다.');
    }

    let keywords: string[];
    try {
      keywords = JSON.parse(result);
      if (!Array.isArray(keywords)) {
        throw new Error('응답 형식이 올바르지 않습니다.');
      }
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      console.log('AI 응답:', result);
      throw new Error('키워드 추출 결과를 파싱할 수 없습니다.');
    }

    return NextResponse.json({
      keywords,
      originalText: text
    });

  } catch (error) {
    console.error('키워드 추출 API 오류:', error);
    return NextResponse.json(
      { error: '키워드 추출 중 오류가 발생했습니다.', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}