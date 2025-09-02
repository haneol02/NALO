import { NextRequest, NextResponse } from 'next/server';
import { generateIdeas } from '@/app/lib/openai';
import { getTrendKeywords } from '@/app/lib/ddgs';
import { dbHelpers } from '@/app/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categories = [], customInput = '', previousIdeas = [] }: { categories?: string[], customInput?: string, previousIdeas?: string[] } = body;

    // 입력 검증
    if (categories.length === 0 && !customInput.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: '관심 분야를 선택하거나 직접 입력해주세요.',
        },
        { status: 400 }
      );
    }

    // 일일 토큰 사용량 체크
    const todayUsage = await dbHelpers.getDailyTokenUsage();
    const maxDailyTokens = 2000000; // 200만 토큰
    const warningThreshold = 1800000; // 180만 토큰에서 경고
    
    if (todayUsage >= maxDailyTokens) {
      return NextResponse.json(
        {
          success: false,
          error: '일일 토큰 사용량이 초과되었습니다. 내일 다시 시도해주세요.',
          todayUsage,
          maxDailyTokens,
        },
        { status: 429 }
      );
    }

    // 현재 트렌드 키워드 가져오기
    console.log('=== 트렌드 키워드 수집 시작 ===');
    const trendKeywords = await getTrendKeywords();
    console.log('전체 트렌드 키워드 수:', trendKeywords.length);
    console.log('전체 트렌드:', trendKeywords.map(t => `${t.keyword} (${t.category})`));
    
    const relevantTrends = trendKeywords
      .filter(trend => 
        categories.length === 0 || 
        categories.some((cat: string) => trend.category.includes(cat))
      )
      .slice(0, 5)
      .map(trend => trend.keyword);
    
    console.log('필터링된 관련 트렌드:', relevantTrends);
    console.log('사용자 카테고리:', categories);
    console.log('이전 아이디어 (중복 방지용):', previousIdeas);
    console.log('========================');

    // 캐시된 아이디어 확인 (선택사항)
    let cachedIdeas = [];
    try {
      const searchKeywords = [...categories, customInput].filter(Boolean);
      cachedIdeas = await dbHelpers.getSimilarIdeas(searchKeywords, 3);
    } catch (error) {
      console.log('Cache lookup failed, proceeding with AI generation');
    }

    // 캐시된 아이디어가 있고 최근 것이면 사용
    if (cachedIdeas.length >= 3) {
      const recentCache = cachedIdeas.filter(idea => {
        const createdAt = new Date(idea.created_at);
        const hoursDiff = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        return hoursDiff < 24; // 24시간 이내
      });

      if (recentCache.length >= 3) {
        const formattedIdeas = recentCache.slice(0, 3).map(idea => ({
          title: idea.title,
          description: idea.description,
          target: '대상 사용자 정보', // DB 스키마에 따라 조정
          estimatedCost: idea.estimated_cost,
          developmentTime: idea.development_time,
          difficulty: idea.difficulty,
          marketPotential: idea.market_potential,
          competition: 5 - idea.difficulty, // 임시 계산
          firstStep: idea.first_step,
        }));

        return NextResponse.json({
          success: true,
          ideas: formattedIdeas,
          cached: true,
          todayUsage,
          remainingTokens: maxDailyTokens - todayUsage,
        });
      }
    }

    // AI로 새로운 아이디어 생성
    const result = await generateIdeas({
      categories,
      customInput,
      trends: relevantTrends,
      previousIdeas,
    });

    // 생성된 아이디어를 캐시에 저장
    try {
      for (const idea of result.ideas) {
        await dbHelpers.saveIdea({
          input_keywords: [...categories, customInput].filter(Boolean),
          category: categories.join(',') || '기타',
          title: idea.title,
          description: idea.description,
          difficulty: idea.difficulty,
          market_potential: idea.marketPotential,
          estimated_cost: idea.estimatedCost,
          development_time: idea.developmentTime,
          first_step: idea.firstStep,
        });
      }
    } catch (error) {
      console.error('Failed to cache ideas:', error);
      // 캐시 실패는 무시하고 계속 진행
    }

    // 경고 메시지 추가
    const isNearLimit = (todayUsage + (result.tokensUsed || 0)) > warningThreshold;
    
    return NextResponse.json({
      success: true,
      ideas: result.ideas,
      tokensUsed: result.tokensUsed,
      todayUsage: todayUsage + (result.tokensUsed || 0),
      remainingTokens: maxDailyTokens - todayUsage - (result.tokensUsed || 0),
      warning: isNearLimit ? '오늘의 토큰 사용량이 거의 한계에 도달했습니다.' : null,
      cached: false,
    });

  } catch (error) {
    console.error('Generate API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage === '일일 토큰 사용량을 초과했습니다. 내일 다시 시도해주세요.' 
          ? errorMessage 
          : '아이디어 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}