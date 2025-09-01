import { NextRequest, NextResponse } from 'next/server';
import { dbHelpers } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'daily';
    
    let analytics;
    
    switch (type) {
      case 'daily':
        analytics = await getDailyAnalytics();
        break;
      case 'usage':
        analytics = await getUsageAnalytics();
        break;
      case 'trends':
        analytics = await getTrendsAnalytics();
        break;
      default:
        analytics = await getDailyAnalytics();
    }
    
    return NextResponse.json({
      success: true,
      type,
      data: analytics,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;
    
    switch (type) {
      case 'feedback':
        await dbHelpers.saveFeedback(data);
        break;
      case 'usage':
        await dbHelpers.logUsage(data);
        break;
      default:
        throw new Error('Unknown analytics type');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Analytics data saved',
    });

  } catch (error) {
    console.error('Analytics POST error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save analytics data',
      },
      { status: 500 }
    );
  }
}

async function getDailyAnalytics() {
  try {
    const todayUsage = await dbHelpers.getDailyTokenUsage();
    const maxDailyTokens = 2000000;
    
    return {
      tokensUsed: todayUsage,
      tokensRemaining: maxDailyTokens - todayUsage,
      maxTokens: maxDailyTokens,
      usagePercentage: Math.round((todayUsage / maxDailyTokens) * 100),
      isNearLimit: todayUsage > (maxDailyTokens * 0.9),
    };
  } catch (error) {
    console.error('Error getting daily analytics:', error);
    return {
      tokensUsed: 0,
      tokensRemaining: 2000000,
      maxTokens: 2000000,
      usagePercentage: 0,
      isNearLimit: false,
    };
  }
}

async function getUsageAnalytics() {
  // 간단한 사용량 통계 - 실제 구현시 더 정교하게 작성
  return {
    totalRequests: 0,
    successRate: 100,
    averageResponseTime: 2.3,
    popularCategories: ['개발/기술', '비즈니스', '라이프스타일'],
    peakHours: [10, 14, 16, 20],
  };
}

async function getTrendsAnalytics() {
  try {
    const trends = await dbHelpers.getTrendKeywords(50);
    
    const categoryCount: { [key: string]: number } = {};
    const sourceCount: { [key: string]: number } = {};
    
    trends?.forEach(trend => {
      categoryCount[trend.category] = (categoryCount[trend.category] || 0) + 1;
      sourceCount[trend.source] = (sourceCount[trend.source] || 0) + 1;
    });
    
    return {
      totalTrends: trends?.length || 0,
      categoryBreakdown: categoryCount,
      sourceBreakdown: sourceCount,
      lastUpdated: trends?.[0]?.created_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting trends analytics:', error);
    return {
      totalTrends: 0,
      categoryBreakdown: {},
      sourceBreakdown: {},
      lastUpdated: new Date().toISOString(),
    };
  }
}