import { NextRequest, NextResponse } from 'next/server';

// 검색 키워드 번역 및 확장 함수
async function enhanceSearchKeywords(topic: string, apiKey: string): Promise<{
  english: string[],
  korean: string[],
  related: string[]
}> {
  try {
    const prompt = `
다음 한국어 주제를 분석하여 구체적이고 실용적인 검색 키워드를 생성해주세요:
주제: "${topic}"

다음 JSON 형식으로 응답해주세요:
{
  "english": ["주제의 핵심 기능과 서비스를 나타내는 구체적인 영어 키워드 3-5개"],
  "korean": ["주제의 핵심 개념과 기능을 나타내는 한국어 키워드 3-5개"],
  "related": ["해당 서비스/기능과 직접 관련된 구체적인 영어 키워드 5-8개"]
}

키워드 생성 원칙:
- english: 주제에서 언급된 구체적인 서비스/기능을 정확히 번역 (예: "실시간 협업" → "real-time collaboration", "마인드맵" → "mind mapping")
- korean: 주제에서 추출한 핵심 기능과 특징들 (일반적인 용어보다는 구체적인 기능 중심)
- related: 해당 분야의 구체적인 기술, 도구, 방법론 (너무 일반적인 "AI", "machine learning" 등은 피하고 구체적인 기능이나 서비스 중심)

예시:
주제가 "실시간 화상채팅 서비스"라면:
- english: ["real-time video chat", "video communication platform", "webcam streaming service"]
- korean: ["화상통화", "영상채팅", "실시간통신"]  
- related: ["webRTC", "video conferencing", "peer-to-peer communication", "streaming technology", "video calling software"]
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';
    const keywords = JSON.parse(content);
    
    console.log('키워드 확장 결과:', keywords);
    return keywords;
    
  } catch (error) {
    console.error('키워드 확장 실패:', error);
    // 실패시 기본 키워드 반환
    return {
      english: [topic.replace(/[가-힣\s]+/g, '').trim() || 'AI collaboration'],
      korean: [topic],
      related: ['artificial intelligence', 'collaboration', 'technology']
    };
  }
}

// 검색 결과 관련성 필터링 함수
function isRelevantResult(result: any, originalTopic: string, searchKeyword: string): boolean {
  if (!result?.found) return false;
  
  const title = result.title?.toLowerCase() || result.mainPage?.title?.toLowerCase() || '';
  const summary = result.summary?.toLowerCase() || result.mainPage?.summary?.toLowerCase() || '';
  const content = `${title} ${summary}`;
  
  // 부적절한 카테고리 키워드들 (음반, 영화, 소설, 인물 등)
  const irrelevantKeywords = [
    'album', '음반', 'movie', '영화', 'film', '소설', 'novel', 'book', '도서',
    'singer', '가수', 'actor', '배우', 'musician', '음악가', 'artist', '예술가',
    'song', '노래', 'track', '곡', 'single', 'EP', 'LP',
    'biography', '전기', 'autobiography', '자서전',
    'fictional', '가상의', 'character', '캐릭터', 'comic', '만화',
    '드라마', 'drama', 'series', '시리즈', 'TV', 'television'
  ];
  
  // 기술/IT/비즈니스 관련 긍정 키워드들
  const relevantKeywords = [
    'technology', '기술', 'software', '소프트웨어', 'platform', '플랫폼',
    'service', '서비스', 'system', '시스템', 'application', '애플리케이션',
    'tool', '도구', 'solution', '솔루션', 'method', '방법',
    'collaboration', '협업', 'teamwork', '팀워크', 'workflow', '워크플로',
    'brainstorming', '브레인스토밍', 'ideation', '아이디어', 'creativity', '창의성',
    'innovation', '혁신', 'development', '개발', 'management', '관리',
    'digital', '디지털', 'online', '온라인', 'web', '웹', 'internet', '인터넷',
    'artificial intelligence', 'AI', '인공지능', 'machine learning', '머신러닝',
    'automation', '자동화', 'algorithm', '알고리즘', 'data', '데이터'
  ];
  
  // 부적절한 키워드가 포함된 경우
  const hasIrrelevantContent = irrelevantKeywords.some(keyword => content.includes(keyword));
  if (hasIrrelevantContent) {
    console.log(`[FILTER] 부적절한 결과 제외: "${title}" (키워드: ${searchKeyword})`);
    return false;
  }
  
  // 관련성 있는 키워드가 포함된 경우 통과
  const hasRelevantContent = relevantKeywords.some(keyword => content.includes(keyword));
  if (hasRelevantContent) {
    return true;
  }
  
  // 검색 키워드가 제목이나 요약에 포함되어 있는 경우 통과 (정확한 매칭)
  const keywordInContent = searchKeyword.toLowerCase().split(' ').some(word => 
    word.length > 2 && content.includes(word)
  );
  
  if (!keywordInContent) {
    console.log(`[FILTER] 관련성 낮은 결과 제외: "${title}" (키워드: ${searchKeyword})`);
    return false;
  }
  
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const { topic, includeAcademic = true, apiKey } = await req.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { success: false, error: '검색할 주제를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API 키가 필요합니다.' },
        { status: 401 }
      );
    }

    console.log(`=== 통합 리서치 시작: ${topic} ===`);

    // 1단계: 검색 키워드 확장
    const enhancedKeywords = await enhanceSearchKeywords(topic, apiKey);
    console.log('확장된 검색 키워드:', enhancedKeywords);

    const results: any = {
      topic,
      timestamp: new Date().toISOString(),
      sources: {},
      searchKeywords: enhancedKeywords
    };

    // 2단계: 다중 검색 수행
    const promises: Promise<any>[] = [];
    
    // 모든 키워드 조합 생성
    const allKeywords = [
      ...enhancedKeywords.english,
      ...enhancedKeywords.korean, 
      ...enhancedKeywords.related
    ];
    
    // Wikipedia 다중 검색 (영어 우선)
    const wikipediaKeywords = [
      ...enhancedKeywords.english.slice(0, 2), // 영어 키워드 2개
      ...enhancedKeywords.related.slice(0, 2)  // 관련 키워드 2개
    ];
    
    wikipediaKeywords.forEach((keyword, index) => {
      promises.push(
        fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/research/wikipedia`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            topic: keyword, 
            language: enhancedKeywords.english.includes(keyword) ? 'en' : 'ko' 
          }),
        })
        .then(res => res.json())
        .then(data => ({ 
          source: `wikipedia_${index}`, 
          keyword,
          data 
        }))
        .catch(error => ({ 
          source: `wikipedia_${index}`, 
          keyword,
          error: error.message 
        }))
      );
    });

    // OpenAlex 다중 검색 (영어만)
    let academicKeywords: string[] = [];
    if (includeAcademic) {
      academicKeywords = [
        ...enhancedKeywords.english.slice(0, 3), // 영어 키워드 3개
        ...enhancedKeywords.related.slice(0, 2)  // 관련 키워드 2개
      ];
      
      academicKeywords.forEach((keyword, index) => {
        promises.push(
          fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/research/openalex`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ topic: keyword, limit: 3 }),
          })
          .then(res => res.json())
          .then(data => ({ 
            source: `openalex_${index}`, 
            keyword,
            data 
          }))
          .catch(error => ({ 
            source: `openalex_${index}`, 
            keyword,
            error: error.message 
          }))
        );
      });
    }

    // 모든 API 결과 기다리기
    const apiResults = await Promise.all(promises);

    // 3단계: 결과 통합 및 정리
    let allWikipediaData: any[] = [];
    let allOpenalexData: any[] = [];
    
    // 결과를 키워드별로 분류
    const wikipediaResults: any[] = [];
    const openalexResults: any[] = [];

    apiResults.forEach((result: any) => {
      if (result.source.startsWith('wikipedia_')) {
        if (result.data && result.data.success && result.data.data) {
          // Wikipedia 결과 관련성 필터링
          if (isRelevantResult(result.data.data, topic, result.keyword)) {
            wikipediaResults.push({
              keyword: result.keyword,
              data: result.data.data
            });
            allWikipediaData.push(result.data.data);
          }
        }
      } else if (result.source.startsWith('openalex_')) {
        if (result.data && result.data.success && result.data.data) {
          // OpenAlex 결과는 이미 학술논문이므로 관련성이 높다고 가정하고 통과
          openalexResults.push({
            keyword: result.keyword,
            data: result.data.data
          });
          allOpenalexData.push(result.data.data);
        }
      }
    });

    // 최적의 결과 선택 (가장 많은 정보를 가진 것)
    let bestWikipediaData = null;
    let bestOpenalexData = null;
    
    if (wikipediaResults.length > 0) {
      // 가장 정보가 많은 Wikipedia 결과 선택
      bestWikipediaData = wikipediaResults
        .filter(r => r.data.found)
        .sort((a, b) => (b.data.summary?.length || 0) - (a.data.summary?.length || 0))[0]?.data || 
        wikipediaResults[0].data;
    }
    
    if (openalexResults.length > 0) {
      // 논문 수가 가장 많은 OpenAlex 결과 선택
      const paperCounts = openalexResults.map(r => ({
        ...r,
        paperCount: r.data.papers?.length || 0
      }));
      bestOpenalexData = paperCounts
        .sort((a, b) => b.paperCount - a.paperCount)[0]?.data;
    }

    // 결과 저장
    results.sources = {
      wikipedia: {
        success: wikipediaResults.length > 0,
        results: wikipediaResults,
        best: bestWikipediaData,
        totalSearches: wikipediaKeywords.length
      },
      openalex: {
        success: openalexResults.length > 0,
        results: openalexResults, 
        best: bestOpenalexData,
        totalSearches: includeAcademic ? academicKeywords.length : 0
      }
    };

    // 통합 분석 결과 생성 (모든 결과 데이터 사용)
    const analysis = await generateIntegratedAnalysis(topic, bestWikipediaData, bestOpenalexData, {
      wikipediaResults,
      openalexResults
    }, apiKey);
    
    const response = {
      success: true,
      data: {
        ...results,
        analysis,
        summary: {
          foundWikipedia: wikipediaResults.length,
          foundAcademic: openalexResults.length,
          totalPapers: allOpenalexData.reduce((sum: number, data: any) => sum + (data.papers?.length || 0), 0),
          totalSearches: wikipediaKeywords.length + (includeAcademic ? academicKeywords.length : 0),
          bestResults: {
            wikipediaKeyword: wikipediaResults.find(r => r.data === bestWikipediaData)?.keyword,
            openalexKeyword: openalexResults.find(r => r.data === bestOpenalexData)?.keyword
          },
          searchKeywords: enhancedKeywords,
          trendingConcepts: bestOpenalexData?.trends?.concepts || []
        }
      }
    };

    console.log(`=== 통합 리서치 완료: ${topic} ===`);
    console.log(`Wikipedia 검색: ${wikipediaResults.length}/${wikipediaKeywords.length}개 성공`);
    console.log(`학술논문 검색: ${openalexResults.length}/${includeAcademic ? academicKeywords.length : 0}개 성공`);
    console.log(`총 논문 수: ${allOpenalexData.reduce((sum: number, data: any) => sum + (data.papers?.length || 0), 0)}개`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('통합 리서치 API 에러:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: '리서치 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

async function generateIntegratedAnalysis(topic: string, wikipediaData: any, openalexData: any, allResults: any, apiKey: string) {
  try {
    // 모든 수집된 데이터 종합
    const allPapers = allResults.openalexResults?.flatMap((r: any) => r.data?.papers || []) || [];
    const allWikipediaData = allResults.wikipediaResults?.map((r: any) => r.data) || [];

    // 논문 데이터에서 패턴 분석
    const paperAnalysis = analyzePapers(allPapers);
    const marketAnalysis = analyzeMarketTrends(paperAnalysis, allWikipediaData);
    const competitorAnalysis = analyzeCompetitors(allPapers, topic);

    // GPT를 사용한 심층 분석 생성
    const deepInsights = await generateDeepInsights(topic, paperAnalysis, marketAnalysis, competitorAnalysis, apiKey);
    
    return {
      topic,
      marketSize: marketAnalysis.size,
      competitionLevel: marketAnalysis.competition,
      trendDirection: marketAnalysis.trend,
      keyInsights: [
        ...deepInsights.marketInsights,
        ...deepInsights.technologyInsights,
        ...deepInsights.competitionInsights
      ],
      recommendedStrategy: deepInsights.strategy,
      differentiationOpportunities: deepInsights.opportunities,
      implementationComplexity: deepInsights.complexity,
      timeToMarket: deepInsights.timeToMarket,
      resourceRequirements: deepInsights.resources,
      detailedAnalysis: {
        paperTrends: paperAnalysis,
        marketContext: marketAnalysis,
        competitorLandscape: competitorAnalysis
      }
    };
    
  } catch (error) {
    console.error('심층 분석 생성 실패:', error);
    // 실패시 기본 분석 반환
    return generateBasicAnalysis(topic, wikipediaData, openalexData);
  }
}

function analyzePapers(papers: any[]) {
  if (!papers.length) return { yearTrends: {}, topAuthors: [], commonKeywords: [], citationTrends: {} };
  
  const yearCounts: { [year: string]: number } = {};
  const authorCounts: { [author: string]: number } = {};
  const keywordCounts: { [keyword: string]: number } = {};
  const citations: { [year: string]: number[] } = {};
  
  papers.forEach(paper => {
    const year = paper.year?.toString() || 'unknown';
    yearCounts[year] = (yearCounts[year] || 0) + 1;
    
    if (paper.authors) {
      paper.authors.slice(0, 3).forEach((author: string) => {
        authorCounts[author] = (authorCounts[author] || 0) + 1;
      });
    }
    
    if (paper.concepts) {
      paper.concepts.slice(0, 5).forEach((concept: any) => {
        keywordCounts[concept.name] = (keywordCounts[concept.name] || 0) + 1;
      });
    }
    
    if (paper.citationCount && year !== 'unknown') {
      if (!citations[year]) citations[year] = [];
      citations[year].push(paper.citationCount);
    }
  });
  
  return {
    yearTrends: yearCounts,
    topAuthors: Object.entries(authorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([author, count]) => ({ author, papers: count })),
    commonKeywords: Object.entries(keywordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, frequency: count })),
    citationTrends: Object.entries(citations).reduce((acc, [year, cites]) => {
      acc[year] = {
        avgCitations: cites.reduce((sum, c) => sum + c, 0) / cites.length,
        totalPapers: cites.length,
        maxCitations: Math.max(...cites)
      };
      return acc;
    }, {} as any)
  };
}

function analyzeMarketTrends(paperAnalysis: any, wikipediaData: any[]) {
  const currentYear = new Date().getFullYear();
  const recentYears = [currentYear - 1, currentYear, currentYear + 1].map(y => y.toString());
  
  // 최근 연구 활동도 체크
  const recentActivity = recentYears.reduce((sum, year) => 
    sum + (paperAnalysis.yearTrends[year] || 0), 0
  );
  
  // 시장 성숙도 판단
  const totalPapers = Object.values(paperAnalysis.yearTrends).reduce((sum: number, count: any) => sum + count, 0);
  const hasWikipediaPresence = wikipediaData.some(data => data?.found);
  
  let size = 'niche';
  let competition = 'low';
  let trend = 'stable';
  
  if (totalPapers > 50) {
    size = 'large';
    competition = 'high';
  } else if (totalPapers > 15) {
    size = 'medium';
    competition = 'medium';
  }
  
  if (recentActivity > totalPapers * 0.4) {
    trend = 'growing';
  } else if (recentActivity < totalPapers * 0.1) {
    trend = 'declining';
  }
  
  return { size, competition, trend, recentActivity, totalPapers, hasWikipediaPresence };
}

function analyzeCompetitors(papers: any[], topic: string) {
  // 논문에서 언급되는 도구, 플랫폼, 방법론 추출
  const tools: { [tool: string]: number } = {};
  const methods: { [method: string]: number } = {};
  
  papers.forEach(paper => {
    const text = `${paper.title} ${paper.abstract || ''}`.toLowerCase();
    
    // 일반적인 도구/플랫폼 키워드 검색
    const toolKeywords = ['platform', 'tool', 'system', 'software', 'application', 'service'];
    const methodKeywords = ['method', 'approach', 'technique', 'framework', 'model', 'algorithm'];
    
    toolKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        tools[keyword] = (tools[keyword] || 0) + 1;
      }
    });
    
    methodKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        methods[keyword] = (methods[keyword] || 0) + 1;
      }
    });
  });
  
  return {
    commonTools: Object.entries(tools)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tool, count]) => ({ name: tool, mentions: count })),
    commonMethods: Object.entries(methods)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([method, count]) => ({ name: method, mentions: count }))
  };
}

async function generateDeepInsights(topic: string, paperAnalysis: any, marketAnalysis: any, competitorAnalysis: any, apiKey: string) {
  const prompt = `
다음 리서치 데이터를 바탕으로 "${topic}" 프로젝트에 대한 심층 분석을 제공해주세요:

**수집된 데이터:**
- 관련 논문 수: ${Object.values(paperAnalysis.yearTrends).reduce((a: number, b: any) => a + b, 0)}개
- 최근 2년 논문: ${(paperAnalysis.yearTrends['2023'] || 0) + (paperAnalysis.yearTrends['2024'] || 0)}개
- 주요 연구 키워드: ${paperAnalysis.commonKeywords.slice(0, 5).map((k: any) => k.keyword).join(', ')}
- 시장 규모: ${marketAnalysis.size}, 경쟁 수준: ${marketAnalysis.competition}
- 트렌드: ${marketAnalysis.trend}
- 자주 언급되는 도구: ${competitorAnalysis.commonTools.slice(0, 3).map((t: any) => t.name).join(', ')}

**분석 요청:**
다음 JSON 형식으로 모든 내용을 한국어로 응답해주세요:
{
  "marketInsights": [
    {"source": "시장 분석", "insight": "구체적인 시장 상황 분석 (한국어)"},
    {"source": "트렌드 분석", "insight": "최근 트렌드와 향후 전망 (한국어)"}
  ],
  "technologyInsights": [
    {"source": "연구 분석", "insight": "기술적 접근법과 연구 동향 (한국어)"},
    {"source": "구현 고려사항", "insight": "구현 시 고려사항 (한국어)"}
  ],
  "competitionInsights": [
    {"source": "경쟁사 분석", "insight": "기존 솔루션 분석과 차별화 포인트 (한국어)"}
  ],
  "strategy": "구체적인 추천 전략 (200자 내외, 한국어)",
  "opportunities": ["차별화 기회 1 (한국어)", "차별화 기회 2 (한국어)", "차별화 기회 3 (한국어)"],
  "complexity": "low|medium|high",
  "timeToMarket": "3-6개월|6-12개월|12개월 이상",
  "resources": ["필요 리소스 1 (한국어)", "필요 리소스 2 (한국어)", "필요 리소스 3 (한국어)"]
}

**중요**: 모든 텍스트 내용은 반드시 한국어로 작성해주세요. 영어 단어나 구문을 사용하지 마시고, 자연스러운 한국어 표현을 사용해주세요.
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';
    return JSON.parse(content);
    
  } catch (error) {
    console.error('GPT 심층 분석 실패:', error);
    return {
      marketInsights: [{ source: "기본 분석", insight: "데이터가 부족하여 상세 분석이 어려우나, 틈새 시장 기회가 있어 보입니다." }],
      strategy: "기본적인 프로토타입을 개발하여 사용자 피드백을 수집하는 린 스타트업 접근법을 권장합니다.",
      opportunities: ["사용자 경험 최적화", "AI 기능 차별화", "협업 기능 강화"],
      complexity: "medium",
      timeToMarket: "6-12개월",
      resources: ["개발팀", "AI 전문성", "사용자 테스트"]
    };
  }
}

function generateBasicAnalysis(topic: string, wikipediaData: any, openalexData: any) {
  return {
    topic,
    marketSize: 'unknown',
    competitionLevel: 'low',
    trendDirection: 'stable',
    keyInsights: [{
      source: 'Basic Analysis',
      insight: '제한된 데이터로 인해 기본 분석만 가능합니다. 추가 시장 조사를 권장합니다.'
    }],
    recommendedStrategy: '프로토타입을 개발하여 실제 사용자 반응을 테스트해보는 것이 좋겠습니다.',
    differentiationOpportunities: ['사용자 경험 개선', '기술적 혁신', '비즈니스 모델 차별화'],
    implementationComplexity: 'medium',
    timeToMarket: '6-12개월',
    resourceRequirements: ['개발 리소스', '시장 검증', '사용자 피드백']
  };
}