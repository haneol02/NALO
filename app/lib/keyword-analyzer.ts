// 키워드를 분석해서 최적의 검색 쿼리를 생성하는 함수

interface KeywordAnalysisResult {
  searchQuery: string;
  focusArea: string;
  keywords: string[];
}

// 카테고리별 관련 키워드와 검색 패턴
const CATEGORY_PATTERNS = {
  '개발/기술': {
    keywords: ['개발', '프로그래밍', '소프트웨어', '앱', '웹', '시스템', '플랫폼', '기술', 'IT', '디지털'],
    searchTerms: ['개발 트렌드', '신기술', '프로그래밍 도구', '개발자 도구', '기술 스택', '소프트웨어 솔루션']
  },
  '비즈니스': {
    keywords: ['사업', '창업', '스타트업', '마케팅', '수익', '비즈니스', '서비스', '고객', '시장', '수요'],
    searchTerms: ['사업 아이디어', '창업 트렌드', '비즈니스 모델', '수익 창출', '시장 기회', '고객 니즈']
  },
  '콘텐츠': {
    keywords: ['콘텐츠', '영상', '블로그', 'SNS', '유튜브', '크리에이터', '미디어', '제작', '편집'],
    searchTerms: ['콘텐츠 트렌드', '크리에이터 도구', '미디어 제작', '콘텐츠 마케팅', '영상 편집']
  },
  '라이프스타일': {
    keywords: ['생활', '일상', '취미', '건강', '운동', '여가', '라이프스타일', '웰빙', '자기계발'],
    searchTerms: ['라이프스타일 트렌드', '생활 편의', '건강 관리', '취미 활동', '웰빙 서비스']
  },
  '교육': {
    keywords: ['교육', '학습', '강의', '온라인', '스킬', '자격증', '코딩', '언어', '지식'],
    searchTerms: ['교육 기술', '온라인 학습', '에듀테크', '스킬 개발', '교육 플랫폼']
  },
  '금융': {
    keywords: ['금융', '투자', '재테크', '암호화폐', '핀테크', '결제', '대출', '보험', '자산'],
    searchTerms: ['핀테크 트렌드', '투자 도구', '금융 서비스', '디지털 결제', '자산 관리']
  },
  '헬스케어': {
    keywords: ['의료', '건강', '병원', '치료', '진단', '헬스케어', '의약품', '웰니스'],
    searchTerms: ['의료 기술', '헬스케어 서비스', '디지털 헬스', '의료 솔루션', '건강 관리']
  },
  '기타': {
    keywords: ['서비스', '도구', '플랫폼', '솔루션', '혁신', '아이디어'],
    searchTerms: ['혁신 서비스', '새로운 솔루션', '시장 기회', '사용자 니즈']
  }
};

// 트렌드 키워드 (2025년 기준)
const TREND_KEYWORDS = [
  'AI', '인공지능', '머신러닝', '자동화', 'ChatGPT', '생성형 AI',
  '메타버스', 'VR', 'AR', '가상현실',
  '블록체인', 'NFT', '암호화폐', 'Web3',
  '지속가능성', 'ESG', '친환경', '탄소중립',
  '원격근무', '디지털노마드', '하이브리드워크',
  '개인화', '맞춤형', '큐레이션',
  '구독경제', '공유경제', '긱이코노미',
  'Z세대', 'MZ세대', '시니어', '실버세대'
];

export function analyzeKeywords(keywords: string[]): KeywordAnalysisResult {
  console.log('=== 키워드 분석 시작 ===');
  console.log('입력 키워드:', keywords);
  
  // 1. 키워드에서 카테고리와 일반 키워드 분리
  const categories = keywords.filter(keyword => 
    Object.keys(CATEGORY_PATTERNS).includes(keyword)
  );
  
  const userKeywords = keywords.filter(keyword => 
    !Object.keys(CATEGORY_PATTERNS).includes(keyword)
  ).map(k => k.toLowerCase());
  
  // 2. 카테고리별 관련 키워드 추출
  const relevantSearchTerms: string[] = [];
  const relevantKeywords: string[] = [];
  
  categories.forEach(category => {
    const pattern = CATEGORY_PATTERNS[category as keyof typeof CATEGORY_PATTERNS];
    if (pattern) {
      relevantSearchTerms.push(...pattern.searchTerms);
      relevantKeywords.push(...pattern.keywords);
    }
  });
  
  // 3. 트렌드 키워드와의 연관성 찾기 - 더 엄격한 연관성 체크
  const relatedTrends = TREND_KEYWORDS.filter(trend => {
    const trendLower = trend.toLowerCase();
    return userKeywords.some(keyword => {
      // 정확한 매치 또는 포함 관계만 허용
      return keyword === trendLower || 
             (keyword.length > 2 && trendLower.includes(keyword)) ||
             (trendLower.length > 2 && keyword.includes(trendLower));
    }) || categories.some(category => {
      const pattern = CATEGORY_PATTERNS[category as keyof typeof CATEGORY_PATTERNS];
      return pattern?.keywords.some(catKeyword => 
        catKeyword.toLowerCase() === trendLower ||
        (catKeyword.toLowerCase().includes(trendLower) && trendLower.length > 2)
      );
    });
  });
  
  // 4. 연관성 있는 핵심 키워드만 선별
  const coreKeywords = userKeywords.filter(keyword => {
    // 길이 2자 이상, 의미있는 키워드만 선별
    if (keyword.length < 2) return false;
    
    // 트렌드 키워드와 연관성이 있거나 카테고리와 관련있는 키워드만
    const hasRelevance = relatedTrends.some(trend => 
      trend.toLowerCase().includes(keyword) || keyword.includes(trend.toLowerCase())
    ) || categories.some(category => {
      const pattern = CATEGORY_PATTERNS[category as keyof typeof CATEGORY_PATTERNS];
      return pattern?.keywords.some(catKeyword => 
        catKeyword.toLowerCase().includes(keyword) || keyword.includes(catKeyword.toLowerCase())
      );
    }) || relevantKeywords.some(relKeyword => 
      relKeyword.toLowerCase().includes(keyword) || keyword.includes(relKeyword.toLowerCase())
    );
    
    return hasRelevance || userKeywords.indexOf(keyword) < 2; // 처음 2개는 항상 포함
  });
  
  // 5. 검색 쿼리 생성 전략 - 핵심 키워드 중심으로 간소화
  let searchQuery = '';
  let focusArea = '';
  
  if (coreKeywords.length > 0) {
    const mainKeyword = coreKeywords[0];
    const supportKeyword = coreKeywords[1];
    const trendKeyword = relatedTrends[0];
    
    if (categories.length > 0) {
      focusArea = `${mainKeyword} 기반 ${categories[0]}`;
      if (trendKeyword && supportKeyword) {
        searchQuery = `${mainKeyword} ${trendKeyword} ${categories[0]} 2025`;
      } else if (trendKeyword) {
        searchQuery = `${mainKeyword} ${trendKeyword} 혁신`;
      } else if (supportKeyword) {
        searchQuery = `${mainKeyword} ${supportKeyword} ${categories[0]}`;
      } else {
        searchQuery = `${mainKeyword} ${categories[0]} 서비스`;
      }
    } else {
      focusArea = `${mainKeyword} 중심 서비스`;
      if (trendKeyword) {
        searchQuery = `${mainKeyword} ${trendKeyword} 스타트업`;
      } else if (supportKeyword) {
        searchQuery = `${mainKeyword} ${supportKeyword} 아이디어`;
      } else {
        searchQuery = `${mainKeyword} 서비스 2025`;
      }
    }
  } else if (categories.length > 0) {
    const mainCategory = categories[0];
    const categoryPattern = CATEGORY_PATTERNS[mainCategory as keyof typeof CATEGORY_PATTERNS];
    
    focusArea = `${mainCategory} 분야`;
    
    if (categoryPattern && relatedTrends.length > 0) {
      const trendKeyword = relatedTrends[0];
      searchQuery = `${trendKeyword} ${mainCategory} 혁신`;
    } else if (categoryPattern) {
      searchQuery = `${mainCategory} 스타트업 아이디어`;
    } else {
      searchQuery = `${mainCategory} 혁신 서비스`;
    }
  } else {
    focusArea = '일반 서비스';
    searchQuery = '스타트업 아이디어 2025';
  }
  
  // 6. 최종 키워드 목록 정리 - 연관성 있는 키워드만
  const finalKeywords = [
    ...coreKeywords.slice(0, 3),
    ...relatedTrends.slice(0, 2)
  ].filter((keyword, index, arr) => arr.indexOf(keyword) === index) // 중복 제거
   .slice(0, 5); // 최대 5개로 축소
  
  console.log('생성된 검색 쿼리:', searchQuery);
  console.log('포커스 영역:', focusArea);
  console.log('핵심 키워드:', coreKeywords);
  console.log('관련 트렌드:', relatedTrends.slice(0, 2));
  console.log('최종 키워드:', finalKeywords);
  console.log('===================');
  
  return {
    searchQuery,
    focusArea,
    keywords: finalKeywords
  };
}

// 검색 결과의 품질을 평가하는 함수
export function evaluateSearchResults(results: any[], keywords: string[]): number {
  if (results.length === 0) return 0;
  
  let totalScore = 0;
  
  results.forEach(result => {
    let score = 0;
    const text = `${result.title} ${result.snippet}`.toLowerCase();
    
    // 키워드 매치 점수
    keywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        score += 2;
      }
    });
    
    // 최신성 점수 (2024, 2025 포함시 가산점)
    if (text.includes('2024') || text.includes('2025')) {
      score += 1;
    }
    
    // 관련성 키워드 점수
    const relevantTerms = ['트렌드', '혁신', '서비스', '솔루션', '아이디어', '시장', '기회'];
    relevantTerms.forEach(term => {
      if (text.includes(term)) {
        score += 1;
      }
    });
    
    totalScore += score;
  });
  
  return Math.round(totalScore / results.length);
}