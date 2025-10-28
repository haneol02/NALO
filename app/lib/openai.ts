import OpenAI from 'openai';
import { SIMPLE_IDEA_PROMPT, DETAILED_PROJECT_PROMPT, IDEA_PLAN_PROMPT, createDetailedPrompt, createIdeaPlanPrompt } from './project-templates';

// API 키로 OpenAI 인스턴스를 생성하는 헬퍼 함수
function createOpenAIInstance(apiKey: string) {
  if (!apiKey) {
    throw new Error('API 키가 필요합니다.');
  }
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true // 클라이언트에서 직접 호출하지 않지만, 서버에서 사용자 API 키 사용
  });
}

interface GenerateIdeasParams {
  keywords?: string[];
  finalTopic?: string;
  topicContext?: any;
  prompt?: string;
  ideaCount?: number;
  apiKey: string;
}

// 메모리 기반 토큰 사용량 추적
let dailyTokenUsage = 0;
let lastResetDate = new Date().toDateString();

function checkAndResetDailyUsage() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailyTokenUsage = 0;
    lastResetDate = today;
  }
}

export async function generateIdeas(params: GenerateIdeasParams) {
  const { keywords = [], finalTopic = '', topicContext = null, prompt = '', ideaCount = 3, apiKey } = params;

  const openai = createOpenAIInstance(apiKey);
  
  // 토큰 사용량 체크 (메모리 기반)
  checkAndResetDailyUsage();
  const maxDailyTokens = 2000000; // 200만 토큰
  
  if (dailyTokenUsage >= maxDailyTokens) {
    throw new Error('일일 토큰 사용량을 초과했습니다. 내일 다시 시도해주세요.');
  }

  // 프롬프트 직접 처리 또는 키워드 기반 처리 분기
  let finalPrompt = '';
  let extractedKeywords: string[] = [];
  
  if (prompt) {
    // 프롬프트가 있는 경우 직접 처리
    const timestamp = Date.now();
    const randomSeed = Math.floor(Math.random() * 10000);
    
    finalPrompt = `사용자의 관심사와 아이디어 요청을 바탕으로 창의적인 프로젝트 아이디어를 생성하는 AI 어시스턴트입니다.

사용자 요청: "${prompt}"

주요 역할:
1. 사용자의 프롬프트를 분석하여 ${ideaCount}개의 구체적이고 실현 가능한 프로젝트 아이디어를 생성합니다.
2. 각 아이디어는 구체적이고 실행 가능해야 합니다.
3. 각 아이디어마다 관련된 핵심 키워드 3-5개를 생성합니다.
4. 프로젝트명은 브랜드명처럼 매력적이고 기억하기 쉽게 만듭니다.

아이디어 생성 기준:
- 현재 트렌드와 기술을 반영
- 사용자의 관심 분야와 연관성 높은 주제
- 실현 가능성이 있는 프로젝트
- 차별화된 접근 방식이나 독창적인 요소 포함
- 다양한 난이도와 규모의 아이디어 포함

프로젝트명 가이드라인:
- 브랜드명처럼 독창적이고 매력적으로 작성
- 기억하기 쉽고 발음하기 좋은 이름
- 프로젝트의 핵심 가치나 기능을 암시
- 영문, 한글, 또는 조합 모두 가능

응답 형식 (JSON):
{
  "ideas": [
    {
      "title": "매력적인 브랜드 스타일 프로젝트명",
      "summary": "한 줄 요약",
      "description": "프로젝트에 대한 간단하고 명확한 설명 (2-3문장)",
      "coretech": ["핵심기술1", "핵심기술2", "핵심기술3"],
      "target": "주요 타겟 사용자층",
      "category": "해당하는 카테고리 (웹서비스, 모바일앱, AI도구, 데이터분석 등)",
      "difficulty": 3,
      "marketPotential": 4,
      "competition": 2,
      "tags": ["관련태그1", "관련태그2", "관련태그3"],
      "challenges": ["도전과제1", "도전과제2"],
      "successFactors": ["성공요인1", "성공요인2"],
      "estimatedCost": 500,
      "developmentTime": 12,
      "keywords": ["해당 아이디어 핵심키워드1", "키워드2", "키워드3", "키워드4", "키워드5"]
    }
  ]
}

필드 설명:
- difficulty: 기술 난이도 (1-5, 1=매우쉬움, 5=매우어려움)
- marketPotential: 시장 잠재력 (1-5, 1=매우낮음, 5=매우높음)
- competition: 경쟁 강도 (1-5, 1=경쟁매우낮음, 5=경쟁매우높음)
- estimatedCost: 예상 개발 비용 (만원 단위)
- developmentTime: 예상 개발 기간 (주 단위)

생성 시드: ${randomSeed} (매번 다른 아이디어를 위해 사용)
생성 시간: ${new Date(timestamp).toLocaleString()}`;
  } else {
    // 기존 키워드 기반 처리
    const keywordContext = keywords.length > 0 ? `입력 키워드: ${keywords.join(', ')}` : '';
    const topicContextString = finalTopic ? `최종 선택 주제: ${finalTopic}` : '';
    
    // Enhanced context utilization as per improvement plan
    const additionalContext = topicContext ? buildEnhancedPromptContext(keywords, finalTopic, topicContext) : '';

    const timestamp = Date.now();
    const randomSeed = Math.floor(Math.random() * 10000);
    const sessionId = Math.floor(Math.random() * 100000);
    
    finalPrompt = `${SIMPLE_IDEA_PROMPT}

${keywordContext}
${topicContextString}${additionalContext}

이 주제와 키워드를 바탕으로 실용적이고 구현 가능한 1개의 창의적이고 상세한 아이디어를 생성해주세요.

생성 시드: ${randomSeed} (매번 다른 아이디어를 위해 사용)
세션 ID: ${sessionId} (중복 방지용)
생성 시간: ${new Date(timestamp).toLocaleString()}`;
  }

  // 디버그용 프롬프트 로그 출력
  console.log('=== OpenAI API 호출 시작 ===');
  console.log('프롬프트 유형:', prompt ? '직접 프롬프트' : '키워드 기반');
  console.log('프롬프트:');
  console.log(finalPrompt);
  console.log('========================');

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 한국 시장에 특화된 실용적인 프로젝트 아이디어 생성 전문가입니다. 항상 JSON 형식으로 응답하며, 실제 구현 가능한 아이디어만 제안합니다."
        },
        {
          role: "user",
          content: finalPrompt
        }
      ],
      max_tokens: 2000,
      temperature: 1.1, // 더 높은 창의성으로 중복 방지
    });

    const content = response.choices[0]?.message?.content;
    const tokensUsed = response.usage?.total_tokens || 0;

    // 디버그용 응답 로그 출력
    console.log('=== OpenAI API 응답 (아이디어 생성) ===');
    console.log('사용된 토큰:', tokensUsed);
    console.log('응답 내용:');
    console.log(content);
    console.log('=================================');

    // 토큰 사용량 업데이트 (메모리)
    dailyTokenUsage += tokensUsed;
    console.log(`[TOKENS] 일일 토큰 사용량: ${dailyTokenUsage}/${maxDailyTokens}`);

    if (!content) {
      throw new Error('AI 응답을 받지 못했습니다.');
    }

    try {
      // 강화된 JSON 파싱 로직
      const cleanedJson = cleanAndParseJson(content);
      console.log('정리된 JSON 응답:', cleanedJson.content);
      
      const parsed = JSON.parse(cleanedJson.content);
      
      // JSON 구조 검증
      if (!validateIdeasResponse(parsed)) {
        console.warn('JSON 구조가 예상과 다름, 대체 파싱 시도');
        return parseAlternativeFormat(content, tokensUsed);
      }
      
      return {
        ideas: parsed.ideas || [],
        keywords: parsed.keywords || keywords,
        tokensUsed,
        success: true,
      };
    } catch (parseError) {
      console.error('JSON 파싱 에러:', parseError);
      console.error('원본 응답:', content);
      // JSON 파싱 실패시 대체 파싱 시도
      return parseAlternativeFormat(content, tokensUsed);
    }

  } catch (error) {
    // 디버그용 에러 로그 출력
    console.log('=== OpenAI API 에러 (아이디어 생성) ===');
    console.log('에러 내용:', error);
    console.log('=================================');
    
    console.error('[ERROR] OpenAI API 호출 실패:', error);
    
    throw error;
  }
}

// 강화된 JSON 정리 및 파싱 함수
function cleanAndParseJson(content: string): { content: string; isValid: boolean } {
  let cleanContent = content.trim();
  
  console.log('원본 응답 길이:', cleanContent.length);
  console.log('원본 응답 시작:', cleanContent.substring(0, 100));
  
  // 1. 마크다운 코드 블록 제거 (여러 패턴 지원)
  const codeBlockPatterns = [
    /^```json\s*/,
    /^```\s*/,
    /```\s*$/g
  ];
  
  codeBlockPatterns.forEach(pattern => {
    cleanContent = cleanContent.replace(pattern, '');
  });
  
  // 2. 앞뒤 불필요한 텍스트 제거
  cleanContent = cleanContent.trim();
  
  // 3. JSON 객체 영역 추출 (더 정확한 매칭)
  const jsonMatches = [
    // 가장 바깥쪽 {}를 찾는 여러 시도
    /\{[\s\S]*\}/,
    /\{.*"ideas"[\s\S]*\}/,
    /\{.*?\}/g
  ];
  
  let bestMatch = '';
  let maxLength = 0;
  
  jsonMatches.forEach(pattern => {
    const matches = cleanContent.match(pattern);
    if (matches) {
      const match = Array.isArray(matches) ? matches[0] : matches;
      if (match.length > maxLength) {
        bestMatch = match;
        maxLength = match.length;
      }
    }
  });
  
  if (bestMatch) {
    cleanContent = bestMatch;
  }
  
  // 4. 일반적인 JSON 오류 수정
  cleanContent = cleanContent
    .replace(/,(\s*[}\]])/g, '$1')  // 마지막 쉼표 제거
    .replace(/([{,]\s*)"?(\w+)"?\s*:/g, '$1"$2":')  // 키를 따옴표로 감싸기
    .replace(/:\s*([^",{[\]}\s]+)(?=\s*[,}])/g, ':"$1"')  // 값을 따옴표로 감싸기 (문자열인 경우)
    .replace(/:\s*"(\d+)"/g, ':$1')  // 숫자는 따옴표 제거
    .replace(/:\s*"(true|false)"/g, ':$1')  // 불린은 따옴표 제거
    .replace(/[\u201C\u201D]/g, '"')  // 스마트 따옴표를 일반 따옴표로 변경
    .replace(/[\u2018\u2019]/g, "'")  // 스마트 작은따옴표를 일반 작은따옴표로 변경
    .replace(/\n|\r/g, ' ')  // 줄바꿈을 공백으로 변경
    .replace(/\s+/g, ' ')  // 연속된 공백을 하나로 변경
    .trim();
  
  // 5. JSON 유효성 사전 체크
  let isValid = false;
  try {
    JSON.parse(cleanContent);
    isValid = true;
  } catch (e) {
    console.warn('JSON 사전 체크 실패:', e);
  }
  
  return { content: cleanContent, isValid };
}

// 아이디어 응답 구조 검증
function validateIdeasResponse(parsed: any): boolean {
  if (!parsed || typeof parsed !== 'object') {
    console.warn('응답이 객체가 아님');
    return false;
  }
  
  if (!Array.isArray(parsed.ideas)) {
    console.warn('ideas 배열이 없음');
    return false;
  }
  
  // 각 아이디어 항목 검증
  for (const idea of parsed.ideas) {
    if (!idea.title || !idea.description) {
      console.warn('필수 아이디어 필드 누락 (title, description):', idea);
      return false;
    }
    
    // summary는 선택적으로 처리
    if (!idea.summary && !idea.description) {
      console.warn('summary 또는 description 중 하나는 필수:', idea);
      return false;
    }
    
    // coretech는 있으면 배열이어야 함
    if (idea.coretech && !Array.isArray(idea.coretech)) {
      console.warn('coretech가 배열이 아님:', idea);
      return false;
    }
  }
  
  return true;
}

// 기획서 응답 구조 검증 (강화됨)
function validateIdeaPlanResponse(parsed: any): boolean {
  if (!parsed || typeof parsed !== 'object') {
    console.warn('기획서 응답이 객체가 아님');
    return false;
  }
  
  if (!parsed.ideaPlan || typeof parsed.ideaPlan !== 'object') {
    console.warn('ideaPlan 객체가 없음');
    return false;
  }
  
  const plan = parsed.ideaPlan;
  
  // 필수 문자열 필드 검증 - 모든 주요 필드 포함
  const requiredStringFields = [
    'project_name', 'service_summary', 'project_type', 'core_idea', 
    'background', 'target_customer', 'problem_to_solve', 'proposed_solution',
    'main_objectives', 'success_metrics', 
    'project_scope_include', 'project_scope_exclude',
    'market_analysis', 'competitors', 'differentiation',
    'swot_strengths', 'swot_weaknesses', 'swot_opportunities', 'swot_threats',
    'tech_stack', 'system_architecture', 'database_type', 
    'development_environment', 'security_requirements',
    'expected_effects', 'business_impact', 'social_value', 'roi_prediction',
    'risk_factors', 'risk_response', 'contingency_plan'
  ];
  
  const missingFields = [];
  for (const field of requiredStringFields) {
    if (!plan[field]) {
      missingFields.push(field);
    }
  }
  
  if (missingFields.length > 0) {
    console.warn(`누락된 필수 필드들: ${missingFields.join(', ')}`);
    return false;
  }
  
  // features 배열 검증 (필수)
  if (!Array.isArray(plan.features) || plan.features.length < 3) {
    console.warn('features가 유효한 배열이 아니거나 개수가 부족함:', plan.features);
    return false;
  }
  
  // key_features 배열 검증 (필수)
  if (!Array.isArray(plan.key_features) || plan.key_features.length < 3) {
    console.warn('key_features가 유효한 배열이 아니거나 개수가 부족함:', plan.key_features);
    return false;
  }
  
  // project_phases 배열 검증 (필수)
  if (!Array.isArray(plan.project_phases) || plan.project_phases.length < 3) {
    console.warn('project_phases가 유효한 배열이 아니거나 개수가 부족함:', plan.project_phases);
    return false;
  }
  
  // 실현 가능성 분석 필드 검증 (필수)
  const analysisFields = ['difficulty', 'market_potential', 'competition'];
  for (const field of analysisFields) {
    const value = plan[field];
    if (value === undefined || value === null) {
      console.warn(`실현 가능성 분석 필드가 누락됨: ${field}`);
      return false;
    }
    
    const numValue = typeof value === 'string' ? parseInt(value) : value;
    if (isNaN(numValue) || numValue < 1 || numValue > 5) {
      console.warn(`잘못된 실현 가능성 분석 필드: ${field} = ${value} (1-5 사이 정수여야 함)`);
      return false;
    }
  }
  
  // challenges와 success_factors 배열 검증 (필수)
  if (!Array.isArray(plan.challenges) || plan.challenges.length < 2) {
    console.warn('challenges가 유효한 배열이 아니거나 개수가 부족함:', plan.challenges);
    return false;
  }
  
  if (!Array.isArray(plan.success_factors) || plan.success_factors.length < 2) {
    console.warn('success_factors가 유효한 배열이 아니거나 개수가 부족함:', plan.success_factors);
    return false;
  }
  
  // 비용 필드 검증 (필수)
  const numberFields = ['development_cost', 'operation_cost', 'marketing_cost', 'other_cost'];
  for (const field of numberFields) {
    const value = plan[field];
    if (value === undefined || value === null) {
      console.warn(`비용 필드가 누락됨: ${field}`);
      return false;
    }
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue) || numValue < 0) {
      console.warn(`잘못된 비용 필드: ${field} = ${value}`);
      return false;
    }
  }
  
  console.log('기획서 구조 검증 성공 - 모든 필수 필드 포함');
  return true;
}

// OpenAI API 테스트 함수
export async function testOpenAIConnection(apiKey: string): Promise<{ success: boolean; message: string; tokensUsed?: number }> {
  const openai = createOpenAIInstance(apiKey);

  try {
    const testPrompt = `다음 JSON 형식으로 간단한 테스트 응답을 해주세요:
{
  "ideas": [
    {
      "title": "테스트 아이디어",
      "summary": "이것은 연결 테스트입니다",
      "description": "OpenAI API 연결을 확인하기 위한 테스트 아이디어입니다.",
      "coretech": ["테스트", "API"],
      "target": "개발자"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 JSON 형식으로 정확히 응답하는 도우미입니다."
        },
        {
          role: "user",
          content: testPrompt
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    const tokensUsed = response.usage?.total_tokens || 0;

    if (!content) {
      return { success: false, message: 'API에서 응답을 받지 못했습니다.' };
    }

    try {
      const cleanedJson = cleanAndParseJson(content);
      const parsed = JSON.parse(cleanedJson.content);
      
      if (validateIdeasResponse(parsed)) {
        return { 
          success: true, 
          message: 'OpenAI API 연결 및 JSON 파싱이 정상적으로 작동합니다.',
          tokensUsed
        };
      } else {
        return { 
          success: false, 
          message: 'JSON 구조가 예상과 다릅니다.',
          tokensUsed
        };
      }
    } catch (parseError) {
      return { 
        success: false, 
        message: `JSON 파싱 실패: ${parseError}`,
        tokensUsed
      };
    }

  } catch (error) {
    return { 
      success: false, 
      message: `API 호출 실패: ${error instanceof Error ? error.message : error}` 
    };
  }
}

// JSON 파싱 실패시 오류 처리
function parseAlternativeFormat(content: string, tokensUsed: number) {
  console.error('JSON 파싱 실패 - 원본 응답:', content);
  throw new Error(`AI 응답을 파싱하는데 실패했습니다. 응답 내용을 확인해주세요: ${content.substring(0, 200)}...`);
}

export async function generateDetails(idea: any, apiKey: string) {
  const openai = createOpenAIInstance(apiKey);

  // 토큰 사용량 체크 (메모리 기반)
  checkAndResetDailyUsage();
  const maxDailyTokens = 2000000; // 200만 토큰

  if (dailyTokenUsage >= maxDailyTokens) {
    throw new Error('일일 토큰 사용량을 초과했습니다. 내일 다시 시도해주세요.');
  }

  const prompt = createDetailedPrompt({
    title: idea.title,
    summary: idea.summary,
    description: idea.description,
    coretech: idea.coretech,
    target: idea.target
  });

  // 디버그용 프롬프트 로그 출력
  console.log('=== OpenAI API 호출 시작 (상세 설명 생성) ===');
  console.log('프롬프트:');
  console.log(prompt);
  console.log('=========================================');

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 프로젝트 기획 전문가입니다. 구체적이고 실용적인 프로젝트 기획서를 작성해주세요."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    const tokensUsed = response.usage?.total_tokens || 0;

    // 디버그용 응답 로그 출력
    console.log('=== OpenAI API 응답 (상세 설명 생성) ===');
    console.log('사용된 토큰:', tokensUsed);
    console.log('응답 내용:');
    console.log(content);
    console.log('====================================');

    // 토큰 사용량 업데이트 (메모리)
    dailyTokenUsage += tokensUsed;
    console.log(`[TOKENS] 일일 토큰 사용량: ${dailyTokenUsage}/${maxDailyTokens}`);

    if (!content) {
      throw new Error('AI 응답을 받지 못했습니다.');
    }

    try {
      // JSON 응답을 정리 (코드 블록이나 불필요한 텍스트 제거)
      let cleanContent = content.trim();
      
      // ```json으로 시작하는 경우 마크다운 코드 블록 제거
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/```\s*$/, '');
      }
      
      // ```로 시작하는 경우 일반 코드 블록 제거
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/```\s*$/, '');
      }
      
      // JSON 객체가 아닌 텍스트가 앞뒤에 있을 경우 제거
      const jsonStart = cleanContent.indexOf('{');
      const jsonEnd = cleanContent.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
      }
      
      console.log('정리된 상세 기획서 JSON 응답:', cleanContent);
      
      const parsed = JSON.parse(cleanContent);
      return {
        detailedProject: parsed.detailedProject,
        tokensUsed,
        success: true,
      };
    } catch (parseError) {
      console.error('상세 설명 JSON 파싱 실패:', parseError);
      console.error('원본 응답:', content);
      
      // 상세 기획서 생성 실패 시 오류 처리
      console.error('상세 기획서 생성 실패');
      throw new Error(`상세 기획서 생성에 실패했습니다. 응답 내용: ${content.substring(0, 200)}...`);
    }

  } catch (error) {
    // 디버그용 에러 로그 출력
    console.log('=== OpenAI API 에러 (상세 설명 생성) ===');
    console.log('에러 내용:', error);
    console.log('====================================');
    
    console.error('[ERROR] OpenAI 상세 설명 생성 실패:', error);
    
    throw error;
  }
}

export async function generateIdeaPlan(idea: any, apiKey: string, researchData?: any) {
  const openai = createOpenAIInstance(apiKey);

  // 토큰 사용량 체크 (메모리 기반)
  checkAndResetDailyUsage();
  const maxDailyTokens = 2000000; // 200만 토큰

  if (dailyTokenUsage >= maxDailyTokens) {
    throw new Error('일일 토큰 사용량을 초과했습니다. 내일 다시 시도해주세요.');
  }

  const prompt = createIdeaPlanPrompt({
    title: idea.title,
    summary: idea.summary,
    description: idea.description,
    coretech: idea.coretech,
    target: idea.target
  }, researchData);

  console.log('=== OpenAI API 호출 시작 (기획서 생성) ===');
  console.log('프롬프트:');
  console.log(prompt);
  console.log('=======================================');

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 전문 프로젝트 기획서 작성 전문가입니다. 

중요한 JSON 작성 규칙:
1. 모든 텍스트는 따옴표 안에서 줄바꿈 대신 공백을 사용하세요
2. 텍스트 안에서 따옴표(", ')는 절대 사용하지 마세요
3. 특수문자는 최소한으로 사용하세요
4. 배열의 마지막 항목 뒤에는 쉼표를 붙이지 마세요
5. 객체의 마지막 속성 뒤에는 쉼표를 붙이지 마세요
6. 모든 문자열 값은 반드시 쌍따옴표로 감싸세요

완전한 기획서를 정확한 JSON 형식으로 작성해주세요.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.3, // 더 일관된 형식을 위해 낮춤
    });

    const content = response.choices[0]?.message?.content;
    const tokensUsed = response.usage?.total_tokens || 0;

    console.log('=== OpenAI API 응답 (기획서 생성) ===');
    console.log('사용된 토큰:', tokensUsed);
    console.log('응답 내용:');
    console.log(content);
    console.log('==================================');

    // 토큰 사용량 업데이트 (메모리)
    dailyTokenUsage += tokensUsed;
    console.log(`[TOKENS] 일일 토큰 사용량: ${dailyTokenUsage}/${maxDailyTokens}`);

    if (!content) {
      throw new Error('AI 응답을 받지 못했습니다.');
    }

    try {
      // 기획서 전용 JSON 정리 및 파싱
      const cleanedJson = cleanBusinessPlanJson(content);
      console.log('정리된 기획서 JSON 응답 (처음 500자):', cleanedJson.substring(0, 500));
      
      const parsed = JSON.parse(cleanedJson);
      
      // 배열 필드 후처리 (문자열로 저장된 배열을 실제 배열로 변환)
      const processedPlan = processArrayFields(parsed.ideaPlan);
      
      // 기획서 구조 검증
      if (!validateIdeaPlanResponse({...parsed, ideaPlan: processedPlan})) {
        console.warn('기획서 JSON 구조가 예상과 다름');
        throw new Error('기획서 JSON 구조가 예상과 다릅니다.');
      }
      
      return {
        ideaPlan: processedPlan,
        keywords: parsed.keywords || [],
        tokensUsed,
        success: true,
      };
    } catch (parseError) {
      console.error('기획서 JSON 파싱 실패:', parseError);
      console.error('원본 응답:', content);
      
      // Fallback: 오류 발생 시 빈 값으로 처리
      console.error('기획서 생성 실패, 빈 값으로 반환');
      throw new Error(`기획서 생성에 실패했습니다. 파싱 오류: ${parseError}`);
    }

  } catch (error) {
    console.log('=== OpenAI API 에러 (기획서 생성) ===');
    console.log('에러 내용:', error);
    console.log('===============================');
    
    console.error('[ERROR] OpenAI 기획서 생성 실패:', error);
    
    throw error;
  }
}

// 주제 확장 생성 함수
export async function generateTopicExpansions(
  keywords: string[],
  apiKey: string,
  parentTopic?: string,
  level: number = 1,
  additionalPrompt?: string,
  userPrompt?: string
): Promise<{ success: boolean; topics: any[]; tokensUsed: number }> {
  const openai = createOpenAIInstance(apiKey);

  // 토큰 사용량 체크
  checkAndResetDailyUsage();
  const maxDailyTokens = 2000000;

  if (dailyTokenUsage >= maxDailyTokens) {
    throw new Error('일일 토큰 사용량을 초과했습니다. 내일 다시 시도해주세요.');
  }

  // 단계별 프롬프트 생성
  let prompt = '';
  
  if (level === 1) {
    // 1단계: 초기 주제 생성 (프롬프트 기반)
    prompt = `
다음 사용자의 관심사를 바탕으로 실제 개발 가능한 3가지 프로젝트 주제를 추천해주세요:

사용자 관심사: "${userPrompt || keywords.join(', ')}"${additionalPrompt ? `
추가 요청사항: ${additionalPrompt}` : ''}

각 주제는 다음 JSON 형식으로 작성해주세요:
{
  "topics": [
    {
      "id": "topic_1",
      "title": "사용자 입력을 기반으로 한 구체적인 프로젝트 제목 (15자 이내)",
      "description": "사용자가 입력한 관심사를 정확히 반영한 프로젝트 설명 (50자 이내)",
      "category": "서비스 분야",
      "level": 1
    },
    {
      "id": "topic_2",
      "title": "첫 번째와 다른 접근 방식의 프로젝트 제목 (15자 이내)",
      "description": "이 프로젝트가 무엇을 하는지 간단한 설명 (50자 이내)",
      "category": "서비스 분야",
      "level": 1
    },
    {
      "id": "topic_3",
      "title": "두 번째와도 다른 접근 방식의 프로젝트 제목 (15자 이내)",
      "description": "이 프로젝트가 무엇을 하는지 간단한 설명 (50자 이내)",
      "category": "서비스 분야",
      "level": 1
    }
  ]
}

중요 요구사항:
- **첫 번째 주제(topic_1)는 사용자가 입력한 "${userPrompt || keywords.join(', ')}"의 핵심 의도를 정확히 반영한 구체적인 프로젝트 아이디어여야 함**
- 사용자 입력이 추상적이면 구체적인 프로젝트로 변환 (예: "AI 협업" → "AI 기반 팀 협업 플랫폼")
- 사용자 입력이 이미 구체적이면 그 의도를 유지하되 더 명확한 제목으로 (예: "실시간 화상채팅 하고싶어" → "실시간 화상채팅 서비스")
- 첫 번째 주제는 사용자의 **원래 의도**를 가장 정확히 표현해야 함
- 두 번째, 세 번째 주제는 다른 접근 방식이나 확장된 아이디어
- 모든 주제는 실제로 개발 가능한 현실적인 프로젝트${additionalPrompt ? `
- 사용자의 추가 요청사항을 최대한 반영한 프로젝트 아이디어` : ''}
- 제목은 15자 이내로 간결하고 명확하게
- 설명은 50자 이내로 핵심만

예시:
사용자 입력: "AI로 협업하는 도구"
→ topic_1: {"title": "AI 협업 워크스페이스", "description": "AI 어시스턴트가 팀 작업을 돕는 협업 플랫폼", "category": "생산성"}

사용자 입력: "실시간 화상채팅 서비스 만들고 싶어"
→ topic_1: {"title": "실시간 화상채팅 플랫폼", "description": "웹과 모바일에서 즉시 연결되는 화상통화 서비스", "category": "커뮤니케이션"}

사용자 입력: "마인드맵"
→ topic_1: {"title": "협업 마인드맵 도구", "description": "팀원들과 실시간으로 아이디어를 시각화하는 서비스", "category": "생산성"}`;
  } else {
    // 2단계 이상: 주제 확장
    prompt = `
다음 사용자의 관심사와 선택된 주제, 추가 요청사항을 모두 종합하여 3가지 새로운 프로젝트 주제를 생성해주세요:

사용자 관심사: "${userPrompt || keywords.join(', ')}"
선택된 주제: ${parentTopic}
확장 레벨: ${level}${additionalPrompt ? `
추가 요청사항: ${additionalPrompt}` : ''}

위 모든 정보를 종합하여 완전히 새로운 3가지 프로젝트 주제를 다음 JSON 형식으로 작성해주세요:
{
  "topics": [
    {
      "id": "expanded_${level}_1",
      "title": "새로운 프로젝트 제목",
      "description": "이 프로젝트가 무엇을 하는지, 어떤 가치를 제공하는지 설명",
      "category": "프로젝트 분야",
      "level": ${level}
    },
    {
      "id": "expanded_${level}_2",
      "title": "새로운 프로젝트 제목",
      "description": "이 프로젝트가 무엇을 하는지, 어떤 가치를 제공하는지 설명", 
      "category": "프로젝트 분야",
      "level": ${level}
    },
    {
      "id": "expanded_${level}_3",
      "title": "새로운 프로젝트 제목",
      "description": "이 프로젝트가 무엇을 하는지, 어떤 가치를 제공하는지 설명",
      "category": "프로젝트 분야", 
      "level": ${level}
    }
  ]
}

중요 요구사항:
- 사용자의 원래 관심사 + 선택된 주제 + 추가 요청사항을 모두 반영한 새로운 프로젝트여야 함
- "${parentTopic}"과 연관되지만 완전히 독립적인 새로운 프로젝트 아이디어
- 각각 다른 접근 방식이나 해결 방법을 제시하는 프로젝트${additionalPrompt ? `
- 사용자의 추가 요청사항(${additionalPrompt})을 핵심적으로 반영하여 생성` : ''}
- 실제로 구현 가능한 현실적인 프로젝트
- 제목은 15자 이내, 설명은 50자 이내로 간결하게`;
  }

  console.log('=== 주제 확장 GPT 호출 시작 ===');
  console.log('사용자 프롬프트:', userPrompt);
  console.log('레벨:', level);
  console.log('키워드:', keywords);
  console.log('부모 주제:', parentTopic);
  console.log('추가 프롬프트:', additionalPrompt);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 실용적인 프로젝트 주제 추천 전문가입니다. 항상 JSON 형식으로 정확히 응답하며, 실제 개발 가능한 아이디어만 제안합니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.8, // 창의적이지만 일관된 결과
    });

    const content = response.choices[0]?.message?.content;
    const tokensUsed = response.usage?.total_tokens || 0;

    console.log('=== 주제 확장 GPT 응답 ===');
    console.log('사용된 토큰:', tokensUsed);
    console.log('응답 내용:', content);

    // 토큰 사용량 업데이트
    dailyTokenUsage += tokensUsed;
    console.log(`[TOKENS] 일일 토큰 사용량: ${dailyTokenUsage}/${maxDailyTokens}`);

    if (!content) {
      throw new Error('GPT 응답을 받지 못했습니다.');
    }

    try {
      // JSON 파싱
      const cleanedJson = cleanAndParseJson(content);
      const parsed = JSON.parse(cleanedJson.content);
      
      if (!parsed.topics || !Array.isArray(parsed.topics)) {
        throw new Error('유효하지 않은 주제 형식입니다.');
      }

      console.log(`[SUCCESS] ${parsed.topics.length}개 주제 생성 완료`);
      
      return {
        success: true,
        topics: parsed.topics,
        tokensUsed
      };

    } catch (parseError) {
      console.error('주제 JSON 파싱 실패:', parseError);
      // Fallback 주제 반환
      return generateFallbackTopics(keywords, parentTopic, level, tokensUsed);
    }

  } catch (error) {
    console.error('[ERROR] 주제 확장 GPT 호출 실패:', error);
    // Fallback 주제 반환  
    return generateFallbackTopics(keywords, parentTopic, level, 0);
  }
}

// 배열 필드 후처리 함수 - 문자열로 저장된 배열을 실제 배열로 변환
function processArrayFields(ideaPlan: any): any {
  const processedPlan = { ...ideaPlan };
  
  // 배열로 처리해야 하는 필드들
  const arrayFields = ['main_objectives', 'success_metrics', 'risk_factors', 'risk_response', 'contingency_plan', 'features', 'key_features', 'challenges', 'success_factors', 'competitors'];
  
  arrayFields.forEach(field => {
    if (processedPlan[field]) {
      if (typeof processedPlan[field] === 'string') {
        // 문자열이 배열 형태인지 확인
        const stringValue = processedPlan[field].trim();
        
        // JSON 배열 형태로 시작하는지 확인
        if (stringValue.startsWith('[') && stringValue.endsWith(']')) {
          try {
            // JSON 파싱 시도
            const parsedArray = JSON.parse(stringValue);
            if (Array.isArray(parsedArray)) {
              processedPlan[field] = parsedArray;
              console.log(`${field} 배열 파싱 성공:`, parsedArray);
            }
          } catch (e) {
            console.warn(`${field} JSON 파싱 실패, 문자열 그대로 유지`);
          }
        } else {
          // 배열 형태가 아닌 일반 문자열인 경우 그대로 유지
          console.log(`${field}는 일반 문자열로 유지:`, stringValue);
        }
      }
      // 이미 배열인 경우는 그대로 유지
    }
  });
  
  return processedPlan;
}

// 기획서 전용 JSON 정리 함수
function cleanBusinessPlanJson(content: string): string {
  let cleanContent = content.trim();
  
  console.log('기획서 JSON 정리 시작 - 원본 길이:', cleanContent.length);
  
  // 1. 마크다운 코드 블록 제거
  cleanContent = cleanContent
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/```\s*$/, '');
  
  // 2. JSON 객체 영역만 추출 (가장 바깥쪽 중괄호)
  const firstBrace = cleanContent.indexOf('{');
  const lastBrace = cleanContent.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
  }
  
  // 3. 기획서에서 자주 발생하는 JSON 오류 수정
  cleanContent = cleanContent
    // 줄바꿈을 공백으로 변경 (문자열 값 내부)
    .replace(/"\s*\n\s*"/g, '" "')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '')
    // 연속된 공백을 하나로
    .replace(/\s+/g, ' ')
    // 따옴표 문제 해결
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    // 마지막 쉼표 제거
    .replace(/,(\s*[}\]])/g, '$1')
    // 잘못된 키 형식 수정
    .replace(/([{,]\s*)"?(\w+)"?\s*:/g, '$1"$2":')
    // 숫자 값의 따옴표 제거
    .replace(/:\s*"(\d+)"/g, ':$1')
    // 불린 값의 따옴표 제거
    .replace(/:\s*"(true|false)"/g, ':$1');
  
  console.log('기획서 JSON 정리 완료 - 정리된 길이:', cleanContent.length);
  
  return cleanContent;
}

// Enhanced prompt context builder as per improvement plan
function buildEnhancedPromptContext(keywords: string[], finalTopic: string, topicContext: any): string {
  const baseContext = `
주제 상세 정보:
- 분야: ${topicContext.category || '일반'}
- 구체적 주제: ${finalTopic}`;

  if (topicContext?.topicHierarchy) {
    const hierarchy = topicContext.topicHierarchy;
    
    const hierarchyContext = `

주제 탐색 컨텍스트:
- 탐색된 기본 주제들: ${hierarchy.baseTopics.join(', ')}
- 선택된 주제 레벨: ${hierarchy.selectedTopicLevel}
- 부모 주제: ${hierarchy.parentTopic || '없음'}
- 하위 주제들: ${hierarchy.childTopics.length > 0 ? hierarchy.childTopics.join(', ') : '없음'}`;

    const metadataContext = topicContext.explorationMetadata ? `
- 총 탐색된 주제 수: ${topicContext.explorationMetadata.totalTopicsExplored}개
- 확장된 주제 수: ${topicContext.explorationMetadata.expansionCount}개
- 사용자 추가 키워드: ${topicContext.explorationMetadata.additionalKeywords.join(', ') || '없음'}
- 탐색 깊이: ${topicContext.explorationMetadata.userInteractionPattern?.explorationDepth || 1}단계

이 탐색 과정을 통해 사용자는 ${finalTopic}에 특별히 관심을 보였습니다.
사용자의 탐색 패턴과 선택을 고려하여 더욱 맞춤형 아이디어를 생성해주세요.` : '';

    return baseContext + hierarchyContext + metadataContext;
  }
  
  return baseContext;
}

// 주제 생성 실패 처리
function generateFallbackTopics(
  keywords: string[], 
  parentTopic?: string, 
  level: number = 1,
  tokensUsed: number = 0
) {
  console.error('주제 생성 실패');
  return {
    success: false,
    topics: [],
    tokensUsed,
    error: '주제 생성에 실패했습니다. 다시 시도해주세요.'
  };
}

// 마인드맵 기반 기획서 생성
export async function generateMindmapPlan(
  mindmapData: { nodes: any[]; edges: any[] },
  apiKey: string,
  originalPrompt?: string,
  focusNode?: any,
  isFocusedGeneration?: boolean
) {
  const openai = createOpenAIInstance(apiKey);

  // 토큰 사용량 체크
  checkAndResetDailyUsage();
  const maxDailyTokens = 2000000;

  if (dailyTokenUsage >= maxDailyTokens) {
    throw new Error('일일 토큰 사용량을 초과했습니다. 내일 다시 시도해주세요.');
  }

  // 마인드맵 구조 분석
  const structuredData = analyzeMindmapStructure(mindmapData);
  
  const prompt = createMindmapPlanPrompt(structuredData, originalPrompt, focusNode, isFocusedGeneration);

  console.log('=== OpenAI API 호출 시작 (마인드맵 기반 기획서 생성) ===');
  console.log('마인드맵 노드 수:', mindmapData.nodes.length);
  console.log('마인드맵 엣지 수:', mindmapData.edges.length);
  console.log('구조화된 데이터:', JSON.stringify(structuredData, null, 2));
  console.log('=======================================');

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 마인드맵 기반 프로젝트 기획서 작성 전문가입니다.

중요한 JSON 작성 규칙:
1. 반드시 올바른 JSON 형식으로 응답하세요
2. 문자열 값에 줄바꿈이 있을 경우 \\n 을 사용하세요
3. 숫자 필드는 따옴표 없이 숫자로 작성하세요
4. 배열 필드는 반드시 배열 형태 ["item1", "item2"] 로 작성하세요
5. null 값이 필요한 경우 null 을 사용하세요 (따옴표 없음)
6. 마인드맵의 구조와 내용을 최대한 반영하여 상세한 기획서를 작성하세요
7. **중요**: 비용은 만원 단위 숫자로 작성하세요 (예: 100만원 = 100, 50만원 = 50)
8. **비용 필드 중요 규칙**: development_cost, operation_cost, marketing_cost, other_cost는 만원 단위 숫자만 입력 (100 = 100만원)
9. **기술 스택 창의성**: 프로젝트 특성과 요구사항을 깊이 분석하여 최적의 기술 조합을 창의적으로 제안하세요
10. **위험관리 필수**: risk_factors, risk_response, contingency_plan은 반드시 구체적으로 작성하세요
11. **기술요구사항 필수**: tech_stack, system_architecture, database_type, security_requirements는 프로젝트에 특화된 내용으로 작성하세요
12. **JSON 형식 엄수**: 응답은 반드시 유효한 JSON 형식이어야 하며, 문자열 값에 중괄호{}, 대괄호[]가 포함되면 안 됩니다

마인드맵 분석 방법:
- 루트 노드: 프로젝트의 메인 주제
- 1차 노드들: 주요 카테고리/영역
- 2차+ 노드들: 세부 기능/요소
- 노드 타입별 매핑:
  * problem: 해결하고자 하는 문제
  * solution: 제안하는 해결책
  * feature: 구현할 기능
  * detail: 세부 구현사항
  * idea: 창의적 아이디어`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI로부터 응답을 받지 못했습니다.');
    }

    const tokensUsed = response.usage?.total_tokens || 0;
    dailyTokenUsage += tokensUsed;

    console.log('OpenAI 응답 받음 (마인드맵 기반):', content.substring(0, 200) + '...');
    console.log('토큰 사용량:', tokensUsed);

    // JSON 파싱 (개선된 버전)
    let parsedResponse;
    let jsonString = ''; // 변수 스코프를 catch 블록에서도 접근 가능하도록 이동
    
    try {
      // 여러 패턴으로 JSON 추출 시도
      // 패턴 1: 가장 큰 JSON 블록 찾기
      const jsonMatches = content.match(/\{[\s\S]*?\}(?=\s*$|\s*```|\s*\n\n)/g);
      if (jsonMatches && jsonMatches.length > 0) {
        // 가장 긴 JSON 선택 (더 완전할 가능성이 높음)
        jsonString = jsonMatches.reduce((longest, current) => 
          current.length > longest.length ? current : longest
        );
      } else {
        // 패턴 2: 첫 번째 { 부터 마지막 } 까지
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonString = content.substring(firstBrace, lastBrace + 1);
        } else {
          jsonString = content;
        }
      }
      
      // JSON 정리 (일반적인 오류 수정)
      jsonString = jsonString
        .replace(/```json\s*/g, '')  // JSON 코드 블록 마커 제거
        .replace(/```\s*/g, '')      // 일반 코드 블록 마커 제거
        .replace(/,(\s*[}\]])/g, '$1') // 마지막 쉼표 제거
        .trim();
      
      parsedResponse = JSON.parse(jsonString);
      
      // 응답 구조 확인 및 정규화
      if (parsedResponse.ideaPlan) {
        // 올바른 구조: { "ideaPlan": {...}, "keywords": [...] }
        console.log('올바른 응답 구조 감지됨');
      } else if (parsedResponse.project_name) {
        // 잘못된 구조: 직접 필드들이 최상위에 있는 경우
        console.log('잘못된 응답 구조 감지 - 수정 중');
        parsedResponse = {
          ideaPlan: parsedResponse,
          keywords: parsedResponse.keywords || []
        };
      } else {
        throw new Error('인식할 수 없는 응답 구조');
      }
      
      // 기본 필드가 없으면 추가
      if (!parsedResponse.ideaPlan.project_name) {
        parsedResponse.ideaPlan.project_name = '마인드맵 기반 프로젝트';
      }
      if (!parsedResponse.ideaPlan.project_type) {
        parsedResponse.ideaPlan.project_type = '기타';
      }
      
    } catch (parseError) {
      console.error('JSON 파싱 오류 (마인드맵 기반):', parseError);
      console.error('시도한 JSON 문자열:', jsonString);
      console.error('원본 응답:', content);
      
      // 파싱 실패 시 기본 객체 생성
      const fallbackPlan = {
        ideaPlan: {
          project_name: '마인드맵 기반 프로젝트',
          service_summary: '브레인스토밍을 통해 구체화된 프로젝트 아이디어',
          project_type: '기타',
          core_idea: originalPrompt || '사용자 정의 프로젝트',
          difficulty: 5,
          market_potential: 5,
          competition: 5
        },
        keywords: []
      };
      
      console.log('기본 기획서 객체 사용:', fallbackPlan);
      parsedResponse = fallbackPlan;
    }

    // 기획서 유효성 검증 (간단한 체크)
    if (!parsedResponse.ideaPlan || typeof parsedResponse.ideaPlan !== 'object') {
      throw new Error('생성된 기획서가 올바르지 않습니다.');
    }

    // 배열 필드 후처리
    const processedPlan = processArrayFields(parsedResponse.ideaPlan);
    
    return {
      ideaPlan: processedPlan,
      keywords: parsedResponse.keywords || extractKeywordsFromMindmap(mindmapData),
      tokensUsed
    };

  } catch (error) {
    console.error('마인드맵 기반 기획서 생성 오류:', error);
    throw error;
  }
}

// 마인드맵 구조 분석 함수
function analyzeMindmapStructure(mindmapData: { nodes: any[]; edges: any[] }) {
  const { nodes, edges } = mindmapData;
  
  // 데이터 유효성 검사
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    throw new Error('유효하지 않은 마인드맵 노드 데이터입니다.');
  }
  
  if (!edges || !Array.isArray(edges)) {
    throw new Error('유효하지 않은 마인드맵 엣지 데이터입니다.');
  }
  
  // 루트 노드 찾기 (더 안전하게)
  const rootNode = nodes.find(node => 
    node && node.data && node.data.type === 'root'
  ) || nodes.find(node => node && node.data && node.data.label) || nodes[0];
  
  if (!rootNode || !rootNode.id) {
    throw new Error('유효한 루트 노드를 찾을 수 없습니다.');
  }
  
  // 계층별 노드 그룹화 (순환 참조 방지 개선)
  const nodesByLevel: { [level: number]: any[] } = {};
  const visited = new Set<string>();
  const processing = new Set<string>(); // 현재 처리 중인 노드 추적
  const maxDepth = 10; // 최대 깊이 제한
  
  const buildLevels = (nodeId: string, level: number = 0) => {
    // 순환 참조 검사
    if (processing.has(nodeId)) {
      console.warn(`순환 참조 감지됨: ${nodeId}`);
      return;
    }
    
    // 이미 방문한 노드나 최대 깊이 초과 시 종료
    if (visited.has(nodeId) || level > maxDepth) return;
    
    processing.add(nodeId);
    visited.add(nodeId);
    
    const node = nodes.find(n => n && n.id === nodeId);
    if (!node || !node.data) {
      processing.delete(nodeId);
      return;
    }
    
    if (!nodesByLevel[level]) nodesByLevel[level] = [];
    nodesByLevel[level].push(node);
    
    // 자식 노드들 찾기 (유효한 엣지만 필터링)
    const childEdges = edges.filter(edge => 
      edge && edge.source === nodeId && edge.target && 
      nodes.some(n => n.id === edge.target)
    );
    
    childEdges.forEach(edge => {
      buildLevels(edge.target, level + 1);
    });
    
    processing.delete(nodeId);
  };
  
  buildLevels(rootNode.id);
  
  // 노드 타입별 분류 (안전하게)
  const nodesByType: { [type: string]: any[] } = {};
  nodes.forEach(node => {
    if (node && node.data) {
      const type = node.data.type || 'idea';
      if (!nodesByType[type]) nodesByType[type] = [];
      nodesByType[type].push(node);
    }
  });
  
  // 유효한 노드만 필터링
  const validNodes = nodes.filter(node => node && node.data && node.data.label);
  
  return {
    rootNode,
    nodesByLevel,
    nodesByType,
    totalNodes: validNodes.length,
    totalEdges: edges.length,
    maxDepth: Object.keys(nodesByLevel).length > 0 ? Math.max(...Object.keys(nodesByLevel).map(Number)) : 0
  };
}

// 마인드맵 기반 프롬프트 생성
function createMindmapPlanPrompt(structuredData: any, originalPrompt?: string, focusNode?: any, isFocusedGeneration?: boolean) {
  const { rootNode, nodesByLevel, nodesByType } = structuredData;
  
  // 안전한 라벨 추출
  const getRootLabel = () => {
    if (rootNode && rootNode.data && rootNode.data.label) {
      return rootNode.data.label;
    }
    return '새로운 프로젝트';
  };
  
  let prompt = `${isFocusedGeneration ? '선택된 노드를 중심으로' : '전체 마인드맵을 기반으로'} 상세한 프로젝트 기획서를 작성해주세요.

== 프로젝트 개요 ==
${isFocusedGeneration ? `포커스 노드: "${focusNode?.data?.label || getRootLabel()}"` : `프로젝트 주제: "${getRootLabel()}"`}
${isFocusedGeneration && focusNode?.data?.description ? `포커스 설명: "${focusNode.data.description}"` : ''}
${!isFocusedGeneration && rootNode && rootNode.data && rootNode.data.description ? `주제 설명: "${rootNode.data.description}"` : ''}
${originalPrompt ? `원본 요청: "${originalPrompt}"` : ''}
${isFocusedGeneration ? '\n== 주의: 이것은 전체 마인드맵의 일부분입니다 ==' : ''}
${isFocusedGeneration ? `선택된 "${focusNode?.data?.label || '노드'}" 및 그 하위 노드들만을 기반으로 기획서를 작성합니다.` : ''}

== 마인드맵 구조 분석 ==
`;

  // 계층별 노드 정보 (안전하게)
  if (nodesByLevel && Object.keys(nodesByLevel).length > 0) {
    Object.keys(nodesByLevel).forEach(level => {
      const levelNum = parseInt(level);
      const nodes = nodesByLevel[levelNum];
      
      if (nodes && nodes.length > 0) {
        prompt += `\n${levelNum === 0 ? '루트' : `${levelNum}차`} 레벨 (${nodes.length}개 노드):\n`;
        nodes.forEach((node: any) => {
          if (node && node.data && node.data.label) {
            prompt += `- ${node.data.label}`;
            if (node.data.type) {
              prompt += ` (${node.data.type})`;
            }
            if (node.data.description) {
              prompt += `: ${node.data.description}`;
            }
            prompt += '\n';
          }
        });
      }
    });
  } else {
    prompt += `\n루트 레벨 (1개 노드):\n- ${getRootLabel()}\n`;
  }
  
  // 노드 타입별 분류 (안전하게)
  prompt += `\n== 노드 타입별 분류 ==\n`;
  if (nodesByType && Object.keys(nodesByType).length > 0) {
    Object.keys(nodesByType).forEach(type => {
      const nodes = nodesByType[type];
      if (nodes && nodes.length > 0) {
        prompt += `\n${getTypeDescription(type)} (${nodes.length}개):\n`;
        nodes.forEach((node: any) => {
          if (node && node.data && node.data.label) {
            prompt += `- ${node.data.label}`;
            if (node.data.description) {
              prompt += `: ${node.data.description}`;
            }
            prompt += '\n';
          }
        });
      }
    });
  } else {
    prompt += `\n아이디어 (1개):\n- ${getRootLabel()}\n`;
  }

  prompt += `\n이 마인드맵 정보를 바탕으로 다음 JSON 형식의 상세한 프로젝트 기획서를 작성해주세요:

{
  "ideaPlan": {
    "project_name": "마인드맵 루트 노드나 포커스 노드를 기반으로 한 프로젝트명",
    "service_summary": "마인드맵 구조를 바탕으로 한 서비스 핵심 가치 요약 (1-2줄)",
    "project_type": "프로젝트 유형을 구체적으로 분류 (웹서비스, 모바일앱, SaaS, 플랫폼 등)",
    "core_idea": "마인드맵의 핵심 아이디어와 가치를 200-400자로 상세하게 설명하여 프로젝트의 본질과 차별점을 명확히 제시",
    "background": "마인드맵에서 도출한 프로젝트 배경과 필요성을 200-400자로 구체적으로 설명하며 현재 시장 상황, 사용자 니즈, 해결해야 할 문제의 맥락을 포함하여 작성",
    "target_customer": "마인드맵에서 식별된 주요 타겟 고객층을 구체적으로 세분화하여 설명하고, 각 고객군의 특성과 니즈를 명시",
    "problem_to_solve": "마인드맵에서 도출한 해결하려는 핵심 문제를 200-400자로 현실적이고 구체적으로 설명하며, 문제의 규모와 영향도를 포함하여 작성",
    "proposed_solution": "마인드맵 구조를 바탕으로 한 해결책을 200-400자로 기술적 접근법과 비즈니스 관점에서 상세하게 설명하고, 구체적인 구현 방안과 차별점을 포함",
    
    "main_objectives": "마인드맵에서 도출한 프로젝트의 주요 목표를 3-5개로 구체적이고 측정 가능하게 명시하여 프로젝트 성공 기준을 제시",
    "success_metrics": "성공 지표를 구체적인 수치와 달성 시점을 포함하여 명시 (예: 사용자 1만명 달성, 월매출 1000만원 등)",
    
    "project_scope_include": "마인드맵에서 식별된 프로젝트에 포함될 구체적인 기능, 서비스, 범위를 상세히 명시",
    "project_scope_exclude": "프로젝트에서 제외될 기능이나 범위를 명확히 명시하여 경계를 설정",
    
    "features": ["마인드맵의 feature 노드들을 기반으로 한 핵심기능1 - 구체적 설명", "핵심기능2 - 구체적 설명", "핵심기능3 - 구체적 설명", "핵심기능4 - 구체적 설명", "핵심기능5 - 구체적 설명"],
    "key_features": ["가장 중요한 핵심기능1 - 구체적 설명", "핵심기능2 - 구체적 설명", "핵심기능3 - 구체적 설명"],
    
    "difficulty": 기술_난이도_1부터_10까지_정수_숫자,
    "market_potential": 시장_잠재력_1부터_10까지_정수_숫자,
    "competition": 경쟁_강도_1부터_10까지_정수_숫자,
    "challenges": ["마인드맵에서 식별된_예상되는_도전과제1", "예상되는_도전과제2", "예상되는_도전과제3"],
    "success_factors": ["마인드맵 기반_성공_요인1", "성공_요인2", "성공_요인3"],
    
    "market_analysis": "마인드맵 정보를 바탕으로 한 시장 규모, 성장률, 트렌드 등을 포함한 시장 분석을 200-400자로 상세히 작성",
    "competitors": "주요 경쟁사 3-5개와 각각의 특징, 강점, 약점을 구체적으로 분석",
    "differentiation": "마인드맵에서 도출한 경쟁사 대비 차별화 포인트를 구체적이고 설득력 있게 설명",
    
    "swot_strengths": "마인드맵에서 식별된 프로젝트의 강점을 내부 역량, 기술력, 팀 등의 관점에서 구체적으로 분석",
    "swot_weaknesses": "프로젝트의 약점과 한계를 솔직하고 현실적으로 분석",
    "swot_opportunities": "외부 환경에서 찾을 수 있는 기회 요소들을 구체적으로 명시",
    "swot_threats": "외부 위험 요소와 잠재적 위협들을 현실적으로 분석",
    
    "tech_stack": "이 프로젝트의 특성, 규모, 성능 요구사항을 종합적으로 분석하여 가장 적합한 기술 스택을 자유롭게 제안하고 선택 이유를 구체적으로 설명하세요",
    "system_architecture": "마이크로서비스/모놀리식 구조, 클라우드/온프레미스 배포, API 설계, 데이터 플로우 등 프로젝트 규모와 특성에 맞는 시스템 아키텍처를 200-400자로 상세 설명",
    "database_type": "프로젝트의 데이터 특성(관계형/비관계형), 확장성 요구사항, 성능 요구사항을 고려한 데이터베이스 선택과 구체적인 이유를 명시",
    "development_environment": "개발팀 규모와 협업 방식에 적합한 IDE, 버전관리(Git), CI/CD 파이프라인, 컨테이너화(Docker), 클라우드 서비스 등을 구체적으로 설명",
    "security_requirements": "이 프로젝트에서 반드시 고려해야 할 보안 요구사항: 사용자 인증/인가, 데이터 암호화, API 보안, HTTPS, 개인정보보호 등을 구체적 구현 방안과 함께 설명",
    
    "project_phases": [
      {
        "phase": "1단계: MVP 개발 (4-6주)",
        "duration": "구체적인 소요 기간",
        "tasks": ["마인드맵 기반 세부 작업1", "세부 작업2", "세부 작업3"],
        "deliverables": ["구체적 산출물1", "구체적 산출물2"]
      },
      {
        "phase": "2단계: 베타 테스트 및 개선 (2-3주)",
        "duration": "구체적인 소요 기간",
        "tasks": ["테스트 작업1", "피드백 수집", "개선사항 반영"],
        "deliverables": ["베타 버전", "테스트 리포트"]
      },
      {
        "phase": "3단계: 정식 출시 및 운영 (지속적)",
        "duration": "구체적인 소요 기간",
        "tasks": ["정식 출시", "마케팅 진행", "운영 및 유지보수"],
        "deliverables": ["정식 서비스", "초기 사용자 확보"]
      }
    ],
    
    "expected_effects": "마인드맵에서 도출한 프로젝트 완료 후 기대되는 효과를 사용자, 비즈니스, 기술적 관점에서 구체적으로 설명",
    "business_impact": "비즈니스에 미칠 구체적인 영향과 가치를 매출, 효율성, 경쟁력 등의 관점에서 설명",
    "social_value": "사회적 가치와 기여도를 구체적으로 설명",
    "roi_prediction": "투자 대비 수익률 예측을 구체적인 수치와 근거를 포함하여 설명",
    
    "risk_factors": "이 프로젝트에서 발생 가능한 구체적 위험요소들: 1) 기술적 위험(기술 복잡도, 성능 이슈, 보안 취약점), 2) 시장 위험(경쟁사 진입, 사용자 외면), 3) 운영 위험(팀 역량 부족, 예산 초과, 일정 지연)을 각각 상세히 분석",
    "risk_response": "위에서 식별한 각 위험 요소별로 구체적인 대응 전략을 명시: 기술적 위험→프로토타입 검증, 코드 리뷰 강화; 시장 위험→사용자 피드백 수집, 차별화 강화; 운영 위험→팀 교육, 예산 관리 등",
    "contingency_plan": "프로젝트 실패 시나리오별 비상 대응 계획: 1) 기술적 실패 시 대안 기술 채택, 2) 시장 반응 부정적 시 피벗 전략, 3) 예산/일정 초과 시 기능 축소 및 단계적 출시 계획을 구체적으로 수립",
    
    "development_cost": 만원단위_숫자_50부터_500사이_현실적_개발비용_예시_100은_100만원,
    "operation_cost": 만원단위_숫자_10부터_50사이_현실적_운영비용_예시_30은_30만원,
    "marketing_cost": 만원단위_숫자_20부터_100사이_현실적_마케팅비용_예시_50은_50만원,
    "other_cost": 만원단위_숫자_5부터_30사이_현실적_기타비용_예시_10은_10만원
  },
  "keywords": ["마인드맵에서_추출한_핵심_키워드1", "핵심_키워드2", "핵심_키워드3", "핵심_키워드4", "핵심_키워드5"]
}`;

  return prompt;
}

// 노드 타입 설명
function getTypeDescription(type: string): string {
  const descriptions = {
    'root': '루트 노드',
    'idea': '아이디어',
    'feature': '기능',
    'problem': '문제점',
    'solution': '해결책',
    'detail': '세부사항'
  };
  return descriptions[type as keyof typeof descriptions] || type;
}

// 마인드맵에서 키워드 추출
function extractKeywordsFromMindmap(mindmapData: { nodes: any[]; edges: any[] }): string[] {
  const keywords: string[] = [];
  
  mindmapData.nodes.forEach(node => {
    if (node.data.label && node.data.label.length > 0) {
      keywords.push(node.data.label);
    }
  });
  
  return Array.from(new Set(keywords)); // 중복 제거
}

// default export 제거 - OpenAI 인스턴스는 이제 동적으로 생성됩니다