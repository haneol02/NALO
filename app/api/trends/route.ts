import { NextRequest, NextResponse } from 'next/server';
import { getTrendKeywords, collectTrends, getLastTrendError } from '@/app/lib/ddgs';

export async function GET(request: NextRequest) {
  console.log('📡 Trends API 호출됨');
  
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';
    
    console.log(`🔄 Refresh 모드: ${refresh ? '강제 새로고침' : '캐시 사용'}`);
    
    let trends;
    
    if (refresh) {
      console.log('🆕 새로운 트렌드 수집 시작...');
      trends = await collectTrends();
    } else {
      console.log('📋 캐시된 트렌드 조회 중...');
      trends = await getTrendKeywords();
    }

    console.log(`✅ 트렌드 ${trends.length}개 수집 완료`);
    console.log(`📤 클라이언트에 ${Math.min(trends.length, 12)}개 트렌드 반환`);

    return NextResponse.json({
      success: true,
      trends: trends.slice(0, 12),
      count: trends.length,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('💥 Trends API 오류:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('오류 상세:', errorMessage);
    
    return NextResponse.json(
      {
        success: false,
        error: '트렌드 수집에 실패했습니다. 검색 API 연결을 확인해주세요.',
        errorDetails: errorMessage,
        trends: [], // 빈 배열로 실패 표시
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('🔄 POST - 수동 트렌드 업데이트 요청됨');
  
  try {
    console.log('🆕 강제 트렌드 수집 시작...');
    const trends = await collectTrends();
    
    console.log(`✅ POST - 트렌드 ${trends.length}개 업데이트 완료`);
    
    return NextResponse.json({
      success: true,
      message: 'Trends updated successfully',
      trends: trends.slice(0, 12),
      count: trends.length,
    });

  } catch (error) {
    console.error('💥 POST - 트렌드 업데이트 오류:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        error: '트렌드 수집에 실패했습니다. 검색 API 연결을 확인해주세요.',
        errorDetails: errorMessage,
      },
      { status: 500 }
    );
  }
}