import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { topic, limit = 5 } = await req.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { success: false, error: '검색할 주제를 입력해주세요.' },
        { status: 400 }
      );
    }

    console.log(`OpenAlex 학술 검색 시작: ${topic}`);

    // OpenAlex API로 관련 논문 검색 (재시도 로직 포함)
    const searchUrl = 'https://api.openalex.org/works';
    const searchParams = new URLSearchParams({
      search: topic,
      per_page: limit.toString(),
      sort: 'cited_by_count:desc', // 인용수 높은 순
      filter: 'from_publication_date:2020-01-01' // 2020년 이후 논문만
    });

    let response;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        response = await fetch(`${searchUrl}?${searchParams}`, {
          headers: {
            'User-Agent': 'NALO-Research-Bot/1.0 (https://nalo.vercel.app)',
            'mailto': 'contact@nalo.app', // OpenAlex 권장 헤더
          },
        });

        if (response.ok) {
          break; // 성공하면 루프 탈출
        }

        if (response.status === 429) {
          // Rate limit - 대기 후 재시도
          const waitTime = Math.min(1000 * Math.pow(2, retries), 5000); // 1초, 2초, 4초 (최대 5초)
          console.log(`OpenAlex Rate Limit - ${waitTime}ms 대기 후 재시도 (${retries + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retries++;
        } else {
          throw new Error(`OpenAlex API 호출 실패: ${response.status}`);
        }
      } catch (error) {
        if (retries === maxRetries - 1) {
          throw error;
        }
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!response || !response.ok) {
      throw new Error(`OpenAlex API 호출 실패: Rate Limit 초과`);
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          topic,
          found: false,
          papers: [],
          totalCount: 0,
          trends: null
        }
      });
    }

    // 논문 데이터 정리
    const papers = data.results.map((paper: any) => ({
      title: paper.title,
      abstract: paper.abstract_inverted_index ? 
        reconstructAbstract(paper.abstract_inverted_index) : 
        null,
      authors: paper.authorships?.slice(0, 3).map((auth: any) => 
        auth.author?.display_name
      ).filter(Boolean) || [],
      publishedDate: paper.publication_date,
      citationCount: paper.cited_by_count || 0,
      doi: paper.doi,
      url: paper.doi ? `https://doi.org/${paper.doi}` : null,
      concepts: paper.concepts?.slice(0, 5).map((concept: any) => ({
        name: concept.display_name,
        score: concept.score
      })) || []
    }));

    // 주요 개념 및 트렌드 분석
    const allConcepts = data.results.flatMap((paper: any) => 
      paper.concepts || []
    );
    
    const conceptCounts = allConcepts.reduce((acc: any, concept: any) => {
      const name = concept.display_name;
      if (!acc[name]) {
        acc[name] = { count: 0, totalScore: 0 };
      }
      acc[name].count += 1;
      acc[name].totalScore += concept.score || 0;
      return acc;
    }, {});

    const trendingConcepts = Object.entries(conceptCounts)
      .map(([name, data]: [string, any]) => ({
        name,
        frequency: data.count,
        averageScore: (data.totalScore / data.count).toFixed(2)
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 8);

    // 연도별 논문 수 트렌드
    const yearCounts = data.results.reduce((acc: any, paper: any) => {
      const year = paper.publication_date?.substring(0, 4);
      if (year) {
        acc[year] = (acc[year] || 0) + 1;
      }
      return acc;
    }, {});

    const yearTrends = Object.entries(yearCounts)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year.localeCompare(b.year));

    console.log(`OpenAlex 검색 완료: ${papers.length}개 논문 발견`);

    return NextResponse.json({
      success: true,
      data: {
        topic,
        found: true,
        papers,
        totalCount: data.meta?.count || 0,
        trends: {
          concepts: trendingConcepts,
          yearlyTrends: yearTrends,
          avgCitations: papers.reduce((sum: number, p: any) => sum + p.citationCount, 0) / papers.length || 0
        },
        source: 'OpenAlex'
      }
    });

  } catch (error) {
    console.error('OpenAlex API 에러:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'OpenAlex 검색 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Abstract 재구성 함수 (OpenAlex의 inverted index를 일반 텍스트로 변환)
function reconstructAbstract(invertedIndex: any): string | null {
  try {
    if (!invertedIndex || typeof invertedIndex !== 'object') {
      return null;
    }

    const words: { [key: number]: string } = {};
    let maxIndex = 0;

    // inverted index를 단어 배열로 변환
    Object.entries(invertedIndex).forEach(([word, positions]) => {
      if (Array.isArray(positions)) {
        positions.forEach((pos: number) => {
          words[pos] = word;
          maxIndex = Math.max(maxIndex, pos);
        });
      }
    });

    // 연속된 텍스트로 재구성
    const reconstructed = [];
    for (let i = 0; i <= maxIndex; i++) {
      if (words[i]) {
        reconstructed.push(words[i]);
      }
    }

    const abstract = reconstructed.join(' ');
    
    // 너무 길면 처음 300자만 반환
    return abstract.length > 300 ? 
      abstract.substring(0, 300) + '...' : 
      abstract;

  } catch (error) {
    console.warn('Abstract 재구성 실패:', error);
    return null;
  }
}