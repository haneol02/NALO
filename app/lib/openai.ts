import OpenAI from 'openai';
import { SIMPLE_IDEA_PROMPT, DETAILED_PROJECT_PROMPT, IDEA_PLAN_PROMPT, createDetailedPrompt, createIdeaPlanPrompt } from './project-templates';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerateIdeasParams {
  keywords: string[];
  finalTopic?: string;
  topicContext?: any;
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
  const { keywords, finalTopic = '', topicContext = null } = params;
  
  // 토큰 사용량 체크 (메모리 기반)
  checkAndResetDailyUsage();
  const maxDailyTokens = 2000000; // 200만 토큰
  
  if (dailyTokenUsage >= maxDailyTokens) {
    throw new Error('일일 토큰 사용량을 초과했습니다. 내일 다시 시도해주세요.');
  }

  // 키워드와 주제 기반 컨텍스트 구성
  const keywordContext = keywords.length > 0 ? `입력 키워드: ${keywords.join(', ')}` : '';
  const topicContextString = finalTopic ? `최종 선택 주제: ${finalTopic}` : '';
  
  // Enhanced context utilization as per improvement plan
  const additionalContext = topicContext ? buildEnhancedPromptContext(keywords, finalTopic, topicContext) : '';

  const timestamp = Date.now();
  const randomSeed = Math.floor(Math.random() * 10000);
  const sessionId = Math.floor(Math.random() * 100000);
  
  const prompt = `${SIMPLE_IDEA_PROMPT}

${keywordContext}
${topicContextString}${additionalContext}

이 주제와 키워드를 바탕으로 실용적이고 구현 가능한 1개의 창의적이고 상세한 아이디어를 생성해주세요.

생성 시드: ${randomSeed} (매번 다른 아이디어를 위해 사용)
세션 ID: ${sessionId} (중복 방지용)
생성 시간: ${new Date(timestamp).toLocaleString()}`;

  // 디버그용 프롬프트 로그 출력
  console.log('=== OpenAI API 호출 시작 ===');
  console.log('프롬프트:');
  console.log(prompt);
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
          content: prompt
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
    if (!idea.title || !idea.summary || !idea.description) {
      console.warn('필수 아이디어 필드 누락:', idea);
      return false;
    }
    
    if (!Array.isArray(idea.coretech)) {
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
export async function testOpenAIConnection(): Promise<{ success: boolean; message: string; tokensUsed?: number }> {
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

export async function generateDetails(idea: any) {
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

export async function generateIdeaPlan(idea: any) {
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
  });

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
      
      // 기획서 구조 검증
      if (!validateIdeaPlanResponse(parsed)) {
        console.warn('기획서 JSON 구조가 예상과 다름');
        throw new Error('기획서 JSON 구조가 예상과 다릅니다.');
      }
      
      return {
        ideaPlan: parsed.ideaPlan,
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
  parentTopic?: string, 
  level: number = 1,
  additionalPrompt?: string
): Promise<{ success: boolean; topics: any[]; tokensUsed: number }> {
  // 토큰 사용량 체크
  checkAndResetDailyUsage();
  const maxDailyTokens = 2000000;
  
  if (dailyTokenUsage >= maxDailyTokens) {
    throw new Error('일일 토큰 사용량을 초과했습니다. 내일 다시 시도해주세요.');
  }

  // 단계별 프롬프트 생성
  let prompt = '';
  
  if (level === 1) {
    // 1단계: 초기 주제 생성
    prompt = `
다음 키워드들을 바탕으로 실제 개발 가능한 3가지 프로젝트 주제를 추천해주세요:

키워드: ${keywords.join(', ')}${additionalPrompt ? `
사용자 추가 요청사항: ${additionalPrompt}` : ''}

각 주제는 다음 JSON 형식으로 작성해주세요:
{
  "topics": [
    {
      "id": "topic_1",
      "title": "구체적인 프로젝트 제목",
      "description": "이 프로젝트가 무엇을 하는지 간단한 설명",
      "category": "분야명",
      "level": 1
    },
    {
      "id": "topic_2", 
      "title": "구체적인 프로젝트 제목",
      "description": "이 프로젝트가 무엇을 하는지 간단한 설명",
      "category": "분야명",
      "level": 1
    },
    {
      "id": "topic_3",
      "title": "구체적인 프로젝트 제목", 
      "description": "이 프로젝트가 무엇을 하는지 간단한 설명",
      "category": "분야명",
      "level": 1
    }
  ]
}

요구사항:
- 실제로 개발 가능한 현실적인 주제
- 각 주제는 서로 다른 접근 방식${additionalPrompt ? `
- 사용자의 추가 요청사항을 최대한 반영한 프로젝트 아이디어` : ''}
- 제목은 15자 이내로 간결하게
- 설명은 50자 이내로 핵심만`;
  } else {
    // 2단계 이상: 주제 확장
    prompt = `
다음 키워드와 선택된 주제를 바탕으로 3가지 새로운 메인 프로젝트 아이디어를 생성해주세요:

원본 키워드: ${keywords.join(', ')}
기반 주제: ${parentTopic}
확장 레벨: ${level}${additionalPrompt ? `
사용자 추가 요청사항: ${additionalPrompt}` : ''}

각 새 프로젝트는 다음 JSON 형식으로 작성해주세요:
{
  "topics": [
    {
      "id": "expanded_${level}_1",
      "title": "완전히 새로운 메인 프로젝트 제목",
      "description": "이 프로젝트가 해결하는 주요 문제와 가치",
      "category": "프로젝트 분야",
      "level": ${level}
    },
    {
      "id": "expanded_${level}_2",
      "title": "완전히 새로운 메인 프로젝트 제목",
      "description": "이 프로젝트가 해결하는 주요 문제와 가치", 
      "category": "프로젝트 분야",
      "level": ${level}
    },
    {
      "id": "expanded_${level}_3",
      "title": "완전히 새로운 메인 프로젝트 제목",
      "description": "이 프로젝트가 해결하는 주요 문제와 가치",
      "category": "프로젝트 분야", 
      "level": ${level}
    }
  ]
}

중요 요구사항:
- "${parentTopic}"과 관련이 있지만 완전히 독립적인 새로운 프로젝트여야 함
- 세부 기능이 아닌, 그 자체로 완성된 메인 프로젝트 아이디어여야 함
- 각각 다른 시장이나 사용자층을 타겟으로 해야 함${additionalPrompt ? `
- 사용자의 추가 요청사항(${additionalPrompt})을 최대한 반영하여 생성` : ''}
- 실제로 창업이나 사이드프로젝트로 가능한 수준
- 제목은 15자 이내, 설명은 50자 이내로 간결하게`;
  }

  console.log('=== 주제 확장 GPT 호출 시작 ===');
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

export default openai;