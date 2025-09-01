import { NextRequest, NextResponse } from 'next/server';
import { getTrendKeywords, collectTrends } from '@/app/lib/ddgs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';
    
    let trends;
    
    if (refresh) {
      // 강제로 새로운 트렌드 수집
      trends = await collectTrends();
    } else {
      // 캐시된 트렌드 조회
      trends = await getTrendKeywords();
    }

    return NextResponse.json({
      success: true,
      trends: trends.slice(0, 12), // 최대 12개만 반환
      count: trends.length,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Trends API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trends',
        trends: [], // 빈 배열 반환으로 프론트엔드에서 목업 데이터 사용
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 수동으로 트렌드 업데이트 트리거
    const trends = await collectTrends();
    
    return NextResponse.json({
      success: true,
      message: 'Trends updated successfully',
      trends: trends.slice(0, 12),
      count: trends.length,
    });

  } catch (error) {
    console.error('Trends update error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update trends',
      },
      { status: 500 }
    );
  }
}