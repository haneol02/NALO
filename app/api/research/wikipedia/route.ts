import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { topic, language = 'ko' } = await req.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { success: false, error: '검색할 주제를 입력해주세요.' },
        { status: 400 }
      );
    }

    console.log(`Wikipedia 검색 시작: ${topic} (언어: ${language})`);

    // 1단계: 검색으로 관련 페이지 찾기 (OpenSearch API 사용)
    const searchUrl = `https://${language}.wikipedia.org/w/api.php`;
    const searchParams = new URLSearchParams({
      action: 'opensearch',
      search: topic,
      limit: '3',
      format: 'json',
      redirects: 'resolve'
    });

    const searchResponse = await fetch(`${searchUrl}?${searchParams}`, {
      headers: {
        'User-Agent': 'NALO-Research-Bot/1.0 (https://nalo.vercel.app)',
      },
    });

    if (!searchResponse.ok) {
      throw new Error(`Wikipedia 검색 실패: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    
    // OpenSearch API는 [검색어, 제목배열, 설명배열, URL배열] 형태로 반환
    if (!searchData || !Array.isArray(searchData) || searchData.length < 2 || !searchData[1] || searchData[1].length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          topic,
          found: false,
          summary: null,
          relatedTopics: []
        }
      });
    }

    // 2단계: 첫 번째 결과의 요약 가져오기
    const pageTitle = searchData[1][0]; // 첫 번째 제목
    
    const summaryUrl = `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
    
    const summaryResponse = await fetch(summaryUrl, {
      headers: {
        'User-Agent': 'NALO-Research-Bot/1.0 (https://nalo.vercel.app)',
      },
    });

    if (!summaryResponse.ok) {
      throw new Error(`Wikipedia 요약 가져오기 실패: ${summaryResponse.status}`);
    }

    const summaryData = await summaryResponse.json();

    // 3단계: 관련 주제들 정리 (OpenSearch 결과에서)
    const titles = searchData[1] || [];
    const descriptions = searchData[2] || [];
    const urls = searchData[3] || [];
    
    const relatedTopics = titles.slice(1).map((title: string, index: number) => ({
      title,
      description: descriptions[index + 1] || '',
      url: urls[index + 1] || ''
    }));

    console.log(`Wikipedia 검색 완료: ${pageTitle}`);

    return NextResponse.json({
      success: true,
      data: {
        topic,
        found: true,
        mainPage: {
          title: summaryData.title,
          summary: summaryData.extract,
          url: summaryData.content_urls?.desktop?.page,
          thumbnail: summaryData.thumbnail?.source
        },
        relatedTopics,
        source: 'Wikipedia'
      }
    });

  } catch (error) {
    console.error('Wikipedia API 에러:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Wikipedia 검색 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}