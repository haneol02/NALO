import { NextRequest, NextResponse } from 'next/server';
import { dbHelpers } from '@/app/lib/supabase';
import { createClient } from '@/app/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== 아이디어 기획서 조회 요청 ===');

    // URL 파라미터에서 limit 가져오기
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // 사용자 인증 확인
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Supabase에서 저장된 기획서 조회 (로그인한 사용자의 기획서만)
    const ideas = await dbHelpers.getIdeaPlans(limit, user?.id);
    
    console.log(`[SUCCESS] ${ideas.length}개 아이디어 기획서 조회 완료 (사용자: ${user?.id || '익명'})`);

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
    const { keywords = [], topicContext = null, finalTopic = '', originalPrompt = '', researchData = null, apiKey }: {
      keywords?: string[],
      topicContext?: any,
      finalTopic?: string,
      originalPrompt?: string,
      researchData?: any,
      apiKey?: string
    } = body;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'API 키가 필요합니다. 홈 화면에서 API 키를 입력해주세요.',
        },
        { status: 401 }
      );
    }

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
    console.log('리서치 데이터 포함:', !!researchData);
    console.log('=========================');

    // 선택된 주제를 반영한 구체적인 프롬프트 생성
    let specificPrompt = '';
    let researchContext = '';
    
    // 리서치 데이터가 있는 경우 컨텍스트 추가
    if (researchData) {
      const { analysis, sources } = researchData;
      
      let contextParts = [];
      
      // Wikipedia 정보 추가
      if (sources?.wikipedia?.success && sources.wikipedia.best?.found) {
        const wiki = sources.wikipedia.best.mainPage;
        contextParts.push(`기본 정보: ${wiki?.summary?.substring(0, 200)}...`);
      }
      
      // 학술 정보 추가
      if (sources?.openalex?.success && sources.openalex.best?.found) {
        const academic = sources.openalex.best;
        if (academic.trends?.concepts?.length > 0) {
          const topConcepts = academic.trends.concepts.slice(0, 3).map((c: any) => c.name).join(', ');
          contextParts.push(`관련 학술 분야: ${topConcepts}`);
        }
        contextParts.push(`최근 논문 수: ${academic.papers?.length || 0}개`);
      }
      
      // 분석 결과 추가
      if (analysis) {
        if (analysis.marketSize) contextParts.push(`시장 규모: ${analysis.marketSize}`);
        if (analysis.competitionLevel) contextParts.push(`경쟁 수준: ${analysis.competitionLevel}`);
        if (analysis.trendDirection) contextParts.push(`트렌드: ${analysis.trendDirection}`);
        if (analysis.recommendedStrategy) contextParts.push(`추천 전략: ${analysis.recommendedStrategy}`);
        if (analysis.differentiationOpportunities?.length > 0) {
          contextParts.push(`차별화 기회: ${analysis.differentiationOpportunities.slice(0, 2).join(', ')}`);
        }
      }
      
      if (contextParts.length > 0) {
        researchContext = `

리서치 결과:
${contextParts.map(part => `- ${part}`).join('\n')}

위 리서치 결과를 바탕으로 현실적이고 차별화된 아이디어를 생성해주세요.`;
      }
    }
    
    if (finalTopic && originalPrompt) {
      // 주제 선택 후 생성: 원본 프롬프트 + 선택된 주제 + 리서치 결과
      specificPrompt = `사용자 요청: "${originalPrompt}"

선택된 주제: "${finalTopic}"${researchContext}

위 사용자 요청에서 "${finalTopic}" 주제를 선택했습니다. 이 특정 주제에 대한 구체적이고 실현 가능한 프로젝트 아이디어 1개를 생성해주세요.`;
    } else if (originalPrompt) {
      // 바로 생성: 원본 프롬프트만 사용
      specificPrompt = originalPrompt + researchContext;
    } else if (finalTopic) {
      // 주제만 있는 경우
      specificPrompt = `${finalTopic}에 대한 프로젝트 아이디어를 생성해주세요.${researchContext}`;
    }

    // 주제 선택 후 생성인지 바로 생성인지에 따라 아이디어 개수 결정
    const ideaCount = (finalTopic && originalPrompt) ? 1 : 3;

    const result = await generateIdeas({
      prompt: specificPrompt,
      keywords,
      finalTopic,
      topicContext,
      ideaCount,
      apiKey,
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