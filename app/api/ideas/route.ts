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
    const { keywords = [], topicContext = null, finalTopic = '' }: { 
      keywords?: string[], 
      topicContext?: any, 
      finalTopic?: string 
    } = body;

    // 입력 검증
    if (keywords.length === 0 && !finalTopic) {
      return NextResponse.json(
        {
          success: false,
          error: '키워드 또는 최종 주제가 필요합니다.',
        },
        { status: 400 }
      );
    }

    console.log('=== 아이디어만 생성 요청 ===');
    console.log('최종 주제:', finalTopic);
    console.log('사용자 키워드:', keywords);
    console.log('주제 컨텍스트:', topicContext);
    console.log('=========================');

    // 키워드와 주제를 바탕으로 AI 아이디어 생성 (기획서 생성 없음)
    const result = await generateIdeas({
      keywords,
      finalTopic,
      topicContext,
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