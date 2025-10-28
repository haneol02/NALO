import { NextRequest, NextResponse } from 'next/server';

// 주제 핵심 분석 함수 (새로 추가)
async function analyzeTopic(topic: string, apiKey: string): Promise<{
  coreService: string,
  platform: string,
  genre: string,
  mainFeatures: string[],
  targetUsers: string
}> {
  try {
    const prompt = `
다음 주제를 분석하여 핵심 요소를 파악해주세요:
주제: "${topic}"

다음 JSON 형식으로 응답해주세요:
{
  "coreService": "이 주제의 핵심 서비스나 기능이 무엇인지 한 문장으로 (예: '실시간 화상 채팅', '프로젝트 관리', '음악 스트리밍')",
  "platform": "주요 플랫폼 타입 (예: '웹 서비스', '모바일 앱', '데스크톱 애플리케이션', 'SaaS 플랫폼', 'API 서비스')",
  "genre": "서비스 장르/카테고리 (예: '커뮤니케이션', '생산성', '엔터테인먼트', '교육', '소셜', '유틸리티')",
  "mainFeatures": ["핵심 기능 1", "핵심 기능 2", "핵심 기능 3"],
  "targetUsers": "주요 타겟 사용자층 (예: '개발자', '일반 사용자', '기업', '학생')"
}

예시:
주제: "실시간 화상채팅 서비스"
→ {
  "coreService": "실시간 영상 통화",
  "platform": "웹/모바일 앱",
  "genre": "커뮤니케이션",
  "mainFeatures": ["1:1 영상통화", "그룹 화상회의", "화면 공유"],
  "targetUsers": "원격 근무자 및 일반 사용자"
}

**중요**: 주제의 본질을 정확히 파악하여 응답해주세요.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 서비스 주제를 분석하는 전문가입니다. 항상 정확한 JSON 형식으로만 응답합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';

    // JSON 파싱 개선
    let analysis;
    try {
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('주제 분석 JSON 파싱 실패:', content);
      throw new Error('주제 분석 응답을 파싱할 수 없습니다.');
    }

    console.log('✅ 주제 분석 완료:', analysis);
    return analysis;

  } catch (error) {
    console.error('주제 분석 실패:', error);
    return {
      coreService: topic,
      platform: '웹 서비스',
      genre: '일반',
      mainFeatures: [topic],
      targetUsers: '일반 사용자'
    };
  }
}

// 검색 키워드 생성 함수 (주제 분석 기반)
async function enhanceSearchKeywords(topic: string, apiKey: string, topicAnalysis: any): Promise<{
  english: string[],
  korean: string[],
  related: string[],
  synonyms: string[],
  technical: string[],
  industry: string[]
}> {
  try {
    const prompt = `
다음 주제 분석 결과를 바탕으로 정확한 검색 키워드를 생성해주세요:

**원본 주제**: "${topic}"
**핵심 서비스**: ${topicAnalysis.coreService}
**플랫폼**: ${topicAnalysis.platform}
**장르**: ${topicAnalysis.genre}
**주요 기능**: ${topicAnalysis.mainFeatures.join(', ')}
**타겟 사용자**: ${topicAnalysis.targetUsers}

다음 JSON 형식으로 응답해주세요:
{
  "english": ["핵심 서비스를 정확히 나타내는 영어 키워드 3-5개 (일반적이지 않고 구체적으로)"],
  "korean": ["핵심 서비스를 나타내는 한국어 키워드 3-5개"],
  "related": ["${topicAnalysis.coreService}" 관련 구체적인 기술/서비스 키워드 5-8개],
  "synonyms": ["핵심 키워드의 다른 표현 3-5개"],
  "technical": ["${topicAnalysis.platform}에서 사용되는 기술 스택 3-5개"],
  "industry": ["${topicAnalysis.genre} 분야의 산업 용어 2-4개"]
}

**중요 원칙**:
1. 모든 키워드는 "${topicAnalysis.coreService}"와 직접 관련되어야 함
2. 너무 일반적인 키워드(AI, machine learning, software 등) 대신 구체적인 키워드 사용
3. 플랫폼(${topicAnalysis.platform})과 장르(${topicAnalysis.genre})를 반영한 키워드
4. 주요 기능(${topicAnalysis.mainFeatures.join(', ')})과 연관된 키워드

예시:
핵심 서비스: "실시간 영상 통화"
→ english: ["video conferencing", "real-time video chat", "video call platform"]
→ korean: ["화상회의", "영상통화", "비디오콜"]
→ related: ["WebRTC", "video streaming", "peer-to-peer video", "group video call", "screen sharing"]
→ synonyms: ["video telephony", "visual communication", "video meeting"]
→ technical: ["WebRTC API", "WebSocket", "STUN/TURN server", "video codec"]
→ industry: ["UCaaS", "video collaboration", "remote communication"]
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 주제 분석 전문가입니다. 항상 정확한 JSON 형식으로만 응답합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';

    // JSON 파싱 개선
    let keywords;
    try {
      // 마크다운 코드 블록 제거
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      keywords = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('JSON 파싱 실패:', content);
      throw new Error('키워드 생성 응답을 파싱할 수 없습니다.');
    }

    // 키워드 검증
    if (!keywords.english || !keywords.korean || !keywords.related) {
      console.error('불완전한 키워드 응답:', keywords);
      throw new Error('키워드 생성 응답이 불완전합니다.');
    }

    console.log('✅ 키워드 생성 완료:', {
      english: keywords.english,
      korean: keywords.korean,
      related: keywords.related,
      synonyms: keywords.synonyms || [],
      technical: keywords.technical || [],
      industry: keywords.industry || []
    });

    return keywords;
    
  } catch (error) {
    console.error('키워드 확장 실패:', error);
    // 실패시 기본 키워드 반환
    return {
      english: [topic.replace(/[가-힣\s]+/g, '').trim() || 'AI collaboration'],
      korean: [topic],
      related: ['artificial intelligence', 'collaboration', 'technology'],
      synonyms: ['teamwork', 'cooperation', 'partnership'],
      technical: ['API', 'cloud', 'database'],
      industry: ['SaaS', 'software', 'platform']
    };
  }
}

// 관련성 점수 계산 함수 (0-100)
function calculateRelevanceScore(result: any, originalTopic: string, searchKeyword: string): number {
  let score = 0;

  const title = result.title?.toLowerCase() || result.mainPage?.title?.toLowerCase() || '';
  const summary = result.summary?.toLowerCase() || result.mainPage?.summary?.toLowerCase() || '';
  const content = `${title} ${summary}`;
  const topicLower = originalTopic.toLowerCase();

  // 1. 원본 주제와의 직접적인 관련성 (40점) - 가장 중요
  const topicWords = topicLower.split(/\s+/).filter(w => w.length > 1);
  const matchedTopicWords = topicWords.filter(word =>
    title.includes(word) || summary.includes(word)
  );
  score += (matchedTopicWords.length / topicWords.length) * 40;

  // 2. 제목에 검색 키워드 포함 여부 (25점)
  const keywordParts = searchKeyword.toLowerCase().split(' ');
  keywordParts.forEach(part => {
    if (part.length > 2 && title.includes(part)) {
      score += 25 / keywordParts.length;
    }
  });

  // 3. 요약에 검색 키워드 포함 여부 (15점)
  keywordParts.forEach(part => {
    if (part.length > 2 && summary.includes(part)) {
      score += 15 / keywordParts.length;
    }
  });

  // 4. 관련 키워드 포함 여부 (10점)
  const relevantKeywords = [
    'technology', '기술', 'software', '소프트웨어', 'platform', '플랫폼',
    'service', '서비스', 'system', '시스템', 'application', '애플리케이션',
    'tool', '도구', 'solution', '솔루션', 'collaboration', '협업'
  ];
  const matchedKeywords = relevantKeywords.filter(k => content.includes(k)).length;
  score += Math.min(10, matchedKeywords * 2);

  // 5. 콘텐츠 품질 (10점)
  const contentLength = summary.length;
  if (contentLength > 500) score += 10;
  else if (contentLength > 200) score += 5;
  else if (contentLength > 50) score += 2;

  return Math.min(100, Math.round(score));
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

  // 부적절한 키워드가 포함된 경우
  const hasIrrelevantContent = irrelevantKeywords.some(keyword => content.includes(keyword));
  if (hasIrrelevantContent) {
    console.log(`[FILTER] 부적절한 결과 제외: "${title}" (키워드: ${searchKeyword})`);
    return false;
  }

  // 관련성 점수를 계산하여 일정 점수 이상만 통과
  const relevanceScore = calculateRelevanceScore(result, originalTopic, searchKeyword);
  const minScore = 30; // 최소 30점 이상

  if (relevanceScore < minScore) {
    console.log(`[FILTER] 관련성 점수 낮음 (${relevanceScore}점): "${title}" (키워드: ${searchKeyword})`);
    return false;
  }

  console.log(`[PASS] 관련성 점수 ${relevanceScore}점: "${title}" (키워드: ${searchKeyword})`);
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

    // 1단계: 주제 핵심 분석
    console.log('1단계: 주제 분석 중...');
    const topicAnalysis = await analyzeTopic(topic, apiKey);
    console.log('주제 분석 완료:', topicAnalysis);

    // 2단계: 주제 분석 기반 검색 키워드 생성
    console.log('2단계: 검색 키워드 생성 중...');
    const enhancedKeywords = await enhanceSearchKeywords(topic, apiKey, topicAnalysis);
    console.log('생성된 검색 키워드:', enhancedKeywords);

    const results: any = {
      topic,
      topicAnalysis,  // 주제 분석 결과 추가
      timestamp: new Date().toISOString(),
      sources: {},
      searchKeywords: enhancedKeywords
    };

    // 3단계: 다중 검색 수행
    console.log('3단계: 검색 시작...');

    const promises: Promise<any>[] = [];

    // Wikipedia 검색 키워드 선택 (주제와 가장 관련 높은 것)
    const wikipediaKeywords = [
      ...enhancedKeywords.english.slice(0, 3),     // 영어 키워드 3개
      ...enhancedKeywords.related.slice(0, 3),     // 관련 키워드 3개
      ...(enhancedKeywords.synonyms?.slice(0, 2) || []),  // 동의어 2개
      ...(enhancedKeywords.technical?.slice(0, 2) || [])  // 기술 용어 2개
    ];

    console.log(`📚 Wikipedia 검색 키워드 (${wikipediaKeywords.length}개):`, wikipediaKeywords);
    
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

    // OpenAlex 다중 검색 (더 많은 영어 키워드 사용)
    let academicKeywords: string[] = [];
    if (includeAcademic) {
      academicKeywords = [
        ...enhancedKeywords.english.slice(0, 4),     // 영어 키워드 4개
        ...enhancedKeywords.related.slice(0, 3),     // 관련 키워드 3개
        ...(enhancedKeywords.synonyms?.slice(0, 2) || []),  // 동의어 2개
        ...(enhancedKeywords.technical?.slice(0, 2) || [])  // 기술 용어 2개
      ];

      console.log(`📄 OpenAlex 검색 키워드 (${academicKeywords.length}개):`, academicKeywords);

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
    console.log(`✅ 검색 완료: ${apiResults.length}개 API 호출 완료`);

    // 4단계: 결과 통합 및 정리
    console.log('4단계: 결과 필터링 및 정리 중...');
    let allWikipediaData: any[] = [];
    let allOpenalexData: any[] = [];

    // 결과를 키워드별로 분류
    const wikipediaResults: any[] = [];
    const openalexResults: any[] = [];

    // 중복 제거를 위한 Set (제목 기반)
    const seenWikipediaTitles = new Set<string>();
    const seenPaperIds = new Set<string>();

    let wikipediaTotal = 0;
    let wikipediaFiltered = 0;
    let openalexTotal = 0;

    apiResults.forEach((result: any) => {
      if (result.source.startsWith('wikipedia_')) {
        if (result.data && result.data.success && result.data.data) {
          const data = result.data.data;
          const title = data.title?.toLowerCase() || data.mainPage?.title?.toLowerCase() || '';

          // 중복 체크 및 관련성 필터링
          if (title && !seenWikipediaTitles.has(title) && isRelevantResult(data, topic, result.keyword)) {
            seenWikipediaTitles.add(title);
            wikipediaResults.push({
              keyword: result.keyword,
              data: data,
              relevanceScore: calculateRelevanceScore(data, topic, result.keyword)
            });
            allWikipediaData.push(data);
          }
        }
      } else if (result.source.startsWith('openalex_')) {
        if (result.data && result.data.success && result.data.data) {
          const data = result.data.data;

          // 논문 중복 제거
          if (data.papers && Array.isArray(data.papers)) {
            const uniquePapers = data.papers.filter((paper: any) => {
              const paperId = paper.id || paper.doi || paper.title;
              if (paperId && !seenPaperIds.has(paperId)) {
                seenPaperIds.add(paperId);
                return true;
              }
              return false;
            });

            if (uniquePapers.length > 0) {
              openalexResults.push({
                keyword: result.keyword,
                data: { ...data, papers: uniquePapers }
              });
              allOpenalexData.push({ ...data, papers: uniquePapers });
            }
          }
        }
      }
    });

    // 최적의 결과 선택 (관련성 점수 기반)
    let bestWikipediaData = null;
    let bestOpenalexData = null;

    if (wikipediaResults.length > 0) {
      // 관련성 점수가 가장 높은 Wikipedia 결과 선택
      wikipediaResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
      bestWikipediaData = wikipediaResults[0]?.data;

      console.log(`Wikipedia 결과 상위 3개 점수: ${wikipediaResults.slice(0, 3).map(r =>
        `${r.keyword}: ${r.relevanceScore}점`
      ).join(', ')}`);
    }

    if (openalexResults.length > 0) {
      // 논문 수와 최신성을 고려하여 OpenAlex 결과 선택
      const scoredResults = openalexResults.map(r => {
        const paperCount = r.data.papers?.length || 0;
        const recentPapers = r.data.papers?.filter((p: any) =>
          p.year && p.year >= new Date().getFullYear() - 3
        ).length || 0;

        // 논문 수(70%) + 최근 논문 비중(30%)
        const score = (paperCount * 0.7) + (recentPapers * 0.3);

        return { ...r, qualityScore: score };
      });

      scoredResults.sort((a, b) => b.qualityScore - a.qualityScore);
      bestOpenalexData = scoredResults[0]?.data;

      console.log(`OpenAlex 결과 상위 3개 점수: ${scoredResults.slice(0, 3).map(r =>
        `${r.keyword}: ${r.qualityScore.toFixed(1)}점`
      ).join(', ')}`);
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
    const deepInsights = await generateDeepInsights(topic, paperAnalysis, marketAnalysis, competitorAnalysis, apiKey, wikipediaData, openalexData);

    return {
      topic,
      // 리서치 결과 요약 추가
      researchSummary: deepInsights.researchSummary,
      // 전략 추천 추가
      strategyRecommendation: deepInsights.strategyRecommendation,
      // 기존 메타데이터
      marketSize: marketAnalysis.size,
      competitionLevel: marketAnalysis.competition,
      trendDirection: marketAnalysis.trend,
      // 인사이트 통합
      keyInsights: [
        ...deepInsights.marketInsights,
        ...deepInsights.technologyInsights,
        ...deepInsights.competitionInsights
      ],
      // 기회 및 리스크
      differentiationOpportunities: deepInsights.opportunities,
      risks: deepInsights.risks || [],
      // 구현 정보
      implementationComplexity: deepInsights.complexity,
      timeToMarket: deepInsights.timeToMarket,
      resourceRequirements: deepInsights.resources,
      // 상세 분석 데이터
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

async function generateDeepInsights(topic: string, paperAnalysis: any, marketAnalysis: any, competitorAnalysis: any, apiKey: string, wikipediaData?: any, openalexData?: any) {
  const prompt = `
"${topic}" 프로젝트에 대한 리서치 결과를 분석하고 구체적인 추천 전략을 제공해주세요.

**📊 수집된 리서치 데이터:**

1. **학술 연구 분석**
   - 총 관련 논문: ${Object.values(paperAnalysis.yearTrends).reduce((a: number, b: any) => a + b, 0)}개
   - 최근 2년 논문: ${(paperAnalysis.yearTrends['2023'] || 0) + (paperAnalysis.yearTrends['2024'] || 0) + (paperAnalysis.yearTrends['2025'] || 0)}개
   - 핵심 연구 키워드: ${paperAnalysis.commonKeywords.slice(0, 5).map((k: any) => k.keyword).join(', ')}
   ${paperAnalysis.topAuthors.length > 0 ? `- 주요 연구자: ${paperAnalysis.topAuthors.slice(0, 3).map((a: any) => a.author).join(', ')}` : ''}

2. **시장 현황**
   - 시장 규모: ${marketAnalysis.size}
   - 경쟁 수준: ${marketAnalysis.competition}
   - 성장 트렌드: ${marketAnalysis.trend}
   - Wikipedia 문서 존재: ${marketAnalysis.hasWikipediaPresence ? '있음 (인지도 높음)' : '없음 (신생 분야)'}

3. **기술 생태계**
   - 자주 언급되는 도구: ${competitorAnalysis.commonTools.slice(0, 3).map((t: any) => t.name).join(', ')}
   - 주요 방법론: ${competitorAnalysis.commonMethods.slice(0, 3).map((m: any) => m.name).join(', ')}

**📝 분석 요청:**

위 리서치 데이터를 바탕으로, "${topic}" 주제에 **직접적으로 연관된** 분석만 제공해주세요.

다음 JSON 형식으로 응답:
{
  "researchSummary": {
    "mainFindings": "리서치 데이터에서 발견한 핵심 내용을 3-4문장으로 요약 (주제와 직접 관련된 내용만)",
    "keyTechnologies": ["리서치에서 발견된 핵심 기술 1", "핵심 기술 2", "핵심 기술 3"],
    "marketPosition": "시장에서의 현재 위치와 기회 분석 (2-3문장)"
  },
  "marketInsights": [
    {"source": "시장 현황", "insight": "${topic} 관련 구체적인 시장 상황 (리서치 데이터 기반)"},
    {"source": "성장 트렌드", "insight": "최근 연구/시장 동향과 향후 전망 (데이터 수치 포함)"}
  ],
  "technologyInsights": [
    {"source": "기술 동향", "insight": "${topic}에 적용되는 주요 기술과 연구 방향"},
    {"source": "구현 방향", "insight": "실제 구현 시 고려사항과 추천 기술 스택"}
  ],
  "competitionInsights": [
    {"source": "경쟁 환경", "insight": "기존 솔루션 분석 (리서치에서 발견된 도구/방법론 기반)"},
    {"source": "차별화 기회", "insight": "리서치 데이터가 보여주는 시장 공백과 기회"}
  ],
  "strategyRecommendation": {
    "approach": "리서치 결과를 바탕으로 한 구체적인 개발 접근 방법 (3-4문장)",
    "keyActions": ["실행 항목 1 (구체적)", "실행 항목 2 (구체적)", "실행 항목 3 (구체적)"],
    "successFactors": ["성공을 위한 핵심 요소 1", "핵심 요소 2", "핵심 요소 3"]
  },
  "opportunities": ["리서치 데이터 기반 차별화 기회 1", "차별화 기회 2", "차별화 기회 3"],
  "risks": ["주의해야 할 리스크 1", "리스크 2"],
  "complexity": "low|medium|high",
  "timeToMarket": "3-6개월|6-12개월|12개월 이상",
  "resources": ["필요 리소스 1", "필요 리소스 2", "필요 리소스 3"]
}

**중요 지침:**
1. 모든 내용은 "${topic}"와 직접 관련된 것만 포함
2. 일반론이 아닌 리서치 데이터에 기반한 구체적인 분석
3. 숫자와 데이터를 활용한 객관적인 인사이트
4. 실행 가능한 구체적인 전략과 액션 아이템
5. 모든 텍스트는 한국어로 작성
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
        messages: [
          {
            role: 'system',
            content: '당신은 리서치 데이터를 분석하여 프로젝트 전략을 수립하는 전문가입니다. 항상 주제와 직접 관련된 구체적이고 실행 가능한 분석을 제공합니다.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    // researchSummary를 최상위로 올리고 기존 구조 유지
    return {
      researchSummary: parsed.researchSummary || {
        mainFindings: "리서치 데이터 분석 결과를 요약합니다.",
        keyTechnologies: [],
        marketPosition: "시장 분석 결과입니다."
      },
      strategyRecommendation: parsed.strategyRecommendation || {
        approach: "기본 전략 수립",
        keyActions: [],
        successFactors: []
      },
      marketInsights: parsed.marketInsights || [],
      technologyInsights: parsed.technologyInsights || [],
      competitionInsights: parsed.competitionInsights || [],
      opportunities: parsed.opportunities || [],
      risks: parsed.risks || [],
      complexity: parsed.complexity || "medium",
      timeToMarket: parsed.timeToMarket || "6-12개월",
      resources: parsed.resources || []
    };

  } catch (error) {
    console.error('GPT 심층 분석 실패:', error);
    return {
      researchSummary: {
        mainFindings: "리서치 데이터 분석 중 오류가 발생했습니다. 수집된 데이터를 바탕으로 기본 분석을 제공합니다.",
        keyTechnologies: ["웹 기술", "데이터베이스", "API"],
        marketPosition: "시장 분석을 위해 추가 리서치가 필요합니다."
      },
      strategyRecommendation: {
        approach: "기본적인 프로토타입을 개발하여 사용자 피드백을 수집하는 린 스타트업 접근법을 권장합니다.",
        keyActions: ["MVP 개발", "사용자 테스트", "피드백 수집"],
        successFactors: ["사용자 중심 설계", "빠른 반복", "데이터 기반 의사결정"]
      },
      marketInsights: [{ source: "기본 분석", insight: "데이터가 부족하여 상세 분석이 어려우나, 틈새 시장 기회가 있어 보입니다." }],
      technologyInsights: [],
      competitionInsights: [],
      opportunities: ["사용자 경험 최적화", "AI 기능 차별화", "협업 기능 강화"],
      risks: ["기술 리스크", "시장 경쟁"],
      complexity: "medium",
      timeToMarket: "6-12개월",
      resources: ["개발팀", "AI 전문성", "사용자 테스트"]
    };
  }
}

function generateBasicAnalysis(topic: string, wikipediaData: any, openalexData: any) {
  return {
    topic,
    researchSummary: {
      mainFindings: `"${topic}"에 대한 리서치 데이터가 제한적입니다. 신생 분야이거나 특화된 영역일 수 있습니다.`,
      keyTechnologies: ['웹 기술', '데이터베이스', 'API'],
      marketPosition: '시장 데이터가 부족하여 추가 조사가 필요합니다.'
    },
    strategyRecommendation: {
      approach: '프로토타입을 개발하여 실제 사용자 반응을 테스트하는 것을 권장합니다.',
      keyActions: ['MVP 개발', '초기 사용자 확보', '피드백 기반 개선'],
      successFactors: ['빠른 실행', '사용자 중심', '유연한 대응']
    },
    marketSize: 'unknown',
    competitionLevel: 'low',
    trendDirection: 'stable',
    keyInsights: [{
      source: '기본 분석',
      insight: '제한된 데이터로 인해 기본 분석만 가능합니다. 추가 시장 조사를 권장합니다.'
    }],
    differentiationOpportunities: ['사용자 경험 개선', '기술적 혁신', '비즈니스 모델 차별화'],
    risks: ['시장 불확실성', '데이터 부족'],
    implementationComplexity: 'medium',
    timeToMarket: '6-12개월',
    resourceRequirements: ['개발 리소스', '시장 검증', '사용자 피드백'],
    detailedAnalysis: {
      paperTrends: { yearTrends: {}, topAuthors: [], commonKeywords: [], citationTrends: {} },
      marketContext: { size: 'unknown', competition: 'low', trend: 'stable' },
      competitorLandscape: { commonTools: [], commonMethods: [] }
    }
  };
}