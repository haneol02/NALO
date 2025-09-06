import { NextRequest, NextResponse } from 'next/server';
import { dbHelpers } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('=== 아이디어 기획서 조회 요청 ===');

    // URL 파라미터에서 limit 가져오기
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Supabase에서 저장된 기획서 조회
    const ideas = await dbHelpers.getIdeaPlans(limit);
    
    console.log(`[SUCCESS] ${ideas.length}개 아이디어 기획서 조회 완료`);

    return NextResponse.json({
      success: true,
      ideas: ideas || [],
      count: ideas?.length || 0,
    });

  } catch (error) {
    console.error('Ideas API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      {
        success: false,
        error: '아이디어 조회 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

// 아이디어 생성 (기획서 없이)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 기존 아이디어 조회 로직 (id가 있는 경우)
    if (body.id) {
      const { id } = body;
      console.log(`=== 특정 아이디어 기획서 조회: ${id} ===`);

      const idea = await dbHelpers.getIdeaPlan(id);
      
      console.log(`[SUCCESS] 아이디어 기획서 조회 완료: ${idea.project_name}`);

      return NextResponse.json({
        success: true,
        idea,
      });
    }

    // 새로운 아이디어 생성 로직
    const { generateIdeas } = await import('@/app/lib/openai');
    const { keywords = [], topicContext = null, finalTopic = '', originalPrompt = '' }: { 
      keywords?: string[], 
      topicContext?: any, 
      finalTopic?: string,
      originalPrompt?: string
    } = body;

    // 입력 검증
    if ((keywords.length === 0 && !finalTopic) && !originalPrompt) {
      return NextResponse.json(
        {
          success: false,
          error: '키워드, 최종 주제 또는 원본 프롬프트가 필요합니다.',
        },
        { status: 400 }
      );
    }

    console.log('=== 아이디어만 생성 요청 ===');
    console.log('원본 프롬프트:', originalPrompt);
    console.log('최종 주제:', finalTopic);
    console.log('사용자 키워드:', keywords);
    console.log('주제 컨텍스트:', topicContext);
    console.log('=========================');

    // 선택된 주제를 반영한 구체적인 프롬프트 생성
    let specificPrompt = '';
    if (finalTopic && originalPrompt) {
      // 주제 선택 후 생성: 원본 프롬프트 + 선택된 주제
      specificPrompt = `사용자 요청: "${originalPrompt}"

선택된 주제: "${finalTopic}"

위 사용자 요청에서 "${finalTopic}" 주제를 선택했습니다. 이 특정 주제에 대한 구체적이고 실현 가능한 프로젝트 아이디어 1개를 생성해주세요.`;
    } else if (originalPrompt) {
      // 바로 생성: 원본 프롬프트만 사용
      specificPrompt = originalPrompt;
    } else if (finalTopic) {
      // 주제만 있는 경우
      specificPrompt = `${finalTopic}에 대한 프로젝트 아이디어를 생성해주세요.`;
    }

    // 주제 선택 후 생성인지 바로 생성인지에 따라 아이디어 개수 결정
    const ideaCount = (finalTopic && originalPrompt) ? 1 : 3;

    const result = await generateIdeas({
      prompt: specificPrompt,
      keywords,
      finalTopic,
      topicContext,
      ideaCount,
    });

    // 결과 검증
    if (!result || !result.ideas) {
      throw new Error('AI 아이디어 생성 결과가 유효하지 않습니다.');
    }

    console.log(`[SUCCESS] ${result.ideas.length}개 아이디어 생성 완료!`);

    return NextResponse.json({
      success: true,
      ideas: result.ideas, // 기획서 없이 아이디어만
      tokensUsed: result.tokensUsed,
    });

  } catch (error) {
    console.error('Ideas API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      {
        success: false,
        error: '아이디어 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}