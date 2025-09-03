import { NextRequest, NextResponse } from 'next/server';
import { generateIdeas, generateIdeaPlan } from '@/app/lib/openai';
import { dbHelpers } from '@/app/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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

    console.log('=== 아이디어 생성 요청 ===');
    console.log('최종 주제:', finalTopic);
    console.log('사용자 키워드:', keywords);
    console.log('주제 컨텍스트:', topicContext);
    console.log('========================');

    // 키워드와 주제를 바탕으로 AI 아이디어 생성
    const result = await generateIdeas({
      keywords,
      finalTopic,
      topicContext,
    });

    // 결과 검증
    if (!result || !result.ideas) {
      throw new Error('AI 아이디어 생성 결과가 유효하지 않습니다.');
    }

    // 캐시 제거 - 생성된 아이디어를 메모리에만 저장
    console.log(`[SUCCESS] ${result.ideas.length}개 아이디어 생성 완료!`);

    // 각 아이디어에 대해 기획서 생성 및 저장
    const ideasWithPlans = [];
    
    for (const idea of result.ideas) {
      try {
        console.log(`[INFO] ${idea.title} 기획서 생성 중...`);
        
        // 기획서 생성
        const planResult = await generateIdeaPlan(idea);
        
        if (planResult.ideaPlan) {
          // Supabase에 기획서 저장
          const planData = {
            ...planResult.ideaPlan,
            input_keywords: keywords,
            search_query: finalTopic || keywords.join(', '),
            created_date: new Date().toISOString().split('T')[0]
          };
          
          const savedPlan = await dbHelpers.saveIdeaPlan(planData);
          console.log(`[SUCCESS] ${idea.title} 기획서 저장 완료: ${savedPlan.id}`);
          
          ideasWithPlans.push({
            ...idea,
            planId: savedPlan.id,
            hasPlan: true
          });
        } else {
          ideasWithPlans.push({
            ...idea,
            hasPlan: false
          });
        }
      } catch (planError) {
        console.error(`[ERROR] ${idea.title} 기획서 생성/저장 실패:`, planError);
        ideasWithPlans.push({
          ...idea,
          hasPlan: false
        });
      }
    }

    return NextResponse.json({
      success: true,
      ideas: ideasWithPlans,
      tokensUsed: result.tokensUsed,
      cached: false,
    });

  } catch (error) {
    console.error('Generate API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      {
        success: false,
        error: '아이디어 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}