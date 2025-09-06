// 단순화된 주제 추천 시스템

export interface SimpleTopic {
  id: string;
  title: string;
  description: string;
  category: string;
  level: number; // 얼마나 구체적인지 (1=일반적, 5=매우 구체적)
}

// AI를 사용하여 동적으로 주제 생성
export async function generateTopicsFromKeywords(
  keywords: string[], 
  parentTopic?: string, 
  level: number = 1,
  additionalPrompt?: string,
  userPrompt?: string
): Promise<SimpleTopic[]> {
  
  try {
    // GPT-4o-mini를 사용한 동적 주제 생성
    const { generateTopicExpansions } = await import('./openai');
    const result = await generateTopicExpansions(keywords, parentTopic, level, additionalPrompt, userPrompt);
    
    if (result.success && result.topics.length > 0) {
      return result.topics;
    } else {
      throw new Error('GPT 주제 생성 실패');
    }
    
  } catch (error) {
    console.error('GPT 주제 생성 실패:', error);
    throw new Error('주제 생성에 실패했습니다. 다시 시도해주세요.');
  }
}

// 1단계: 키워드 기반 초기 주제 생성
function generateInitialTopics(keywords: string[]): SimpleTopic[] {
  const topics: SimpleTopic[] = [];
  const keywordString = keywords.join(' ');
  
  // 키워드 조합으로 기본 주제 생성
  const combinations = [
    `${keywords[0]} 기반 플랫폼`,
    `${keywords[0]} 자동화 도구`, 
    `${keywords[0]} 관리 시스템`
  ];
  
  if (keywords.length > 1) {
    combinations[0] = `${keywords[0]}과 ${keywords[1]}을 결합한 서비스`;
    combinations[1] = `${keywords[1]} 특화 ${keywords[0]} 솔루션`;
  }
  
  combinations.forEach((title, index) => {
    topics.push({
      id: `initial_${index + 1}`,
      title: title,
      description: `${keywordString} 관련 혁신적인 아이디어`,
      category: '초기 아이디어',
      level: 1
    });
  });
  
  return topics;
}

// 2단계 이상: 부모 주제 확장
function generateExpandedTopics(parentTopic: string, keywords: string[], level: number): SimpleTopic[] {
  const topics: SimpleTopic[] = [];
  const suffix = level === 2 ? '세부 기능' : '구체적 구현';
  
  const expansions = [
    `${parentTopic}의 모바일 버전`,
    `${parentTopic}의 AI 기능 강화`,
    `${parentTopic}의 협업 기능`
  ];
  
  expansions.forEach((title, index) => {
    topics.push({
      id: `expanded_${level}_${index + 1}`,
      title: title,
      description: `${parentTopic}을 확장한 ${suffix}`,
      category: `${level}단계 확장`,
      level: level
    });
  });
  
  return topics;
}

// 더이상 사용하지 않는 fallback 함수 제거됨

// 주제 히스토리 관리
export interface TopicHistory {
  level: number;
  selectedTopic: SimpleTopic;
  allTopics: SimpleTopic[];
}

export class TopicExplorer {
  private history: TopicHistory[] = [];
  private keywords: string[] = [];
  
  constructor(initialKeywords: string[]) {
    this.keywords = initialKeywords;
  }
  
  async getInitialTopics(): Promise<SimpleTopic[]> {
    const topics = await generateTopicsFromKeywords(this.keywords, undefined, 1);
    this.history = []; // 초기화
    return topics;
  }
  
  async expandTopic(selectedTopic: SimpleTopic): Promise<SimpleTopic[]> {
    const nextLevel = this.history.length + 2; // 1단계 다음은 2단계
    const expandedTopics = await generateTopicsFromKeywords(
      this.keywords, 
      selectedTopic.title, 
      nextLevel
    );
    
    // 히스토리에 추가
    this.history.push({
      level: this.history.length + 1,
      selectedTopic: selectedTopic,
      allTopics: expandedTopics
    });
    
    return expandedTopics;
  }
  
  canGoBack(): boolean {
    return this.history.length > 0;
  }
  
  goBack(): SimpleTopic[] {
    if (this.canGoBack()) {
      const previous = this.history.pop();
      if (this.history.length === 0) {
        // 첫 단계로 돌아가기
        return this.getInitialTopics() as any; // async 처리 필요
      } else {
        return this.history[this.history.length - 1].allTopics;
      }
    }
    return [];
  }
  
  getCurrentLevel(): number {
    return this.history.length + 1;
  }
  
  getSelectedPath(): string[] {
    return this.history.map(h => h.selectedTopic.title);
  }
  
  getFinalTopic(): string {
    if (this.history.length === 0) return '';
    return this.history[this.history.length - 1].selectedTopic.title;
  }
  
  // 최종 주제 컨텍스트 생성
  getFinalContext() {
    return {
      keywords: this.keywords,
      selectedPath: this.getSelectedPath(),
      finalTopic: this.getFinalTopic(),
      level: this.getCurrentLevel(),
      category: this.history[0]?.selectedTopic.category,
      subcategory: this.history[1]?.selectedTopic.category,
      specificTopic: this.history[this.history.length - 1]?.selectedTopic.title
    };
  }
}