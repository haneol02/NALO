import OpenAI from 'openai';
import { SIMPLE_IDEA_PROMPT, DETAILED_PROJECT_PROMPT, createDetailedPrompt } from './project-templates';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerateIdeasParams {
  keywords: string[];
  searchResults?: any[];
  searchQuery?: string;
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
  const { keywords, searchResults = [], searchQuery = '' } = params;
  
  // 토큰 사용량 체크 (메모리 기반)
  checkAndResetDailyUsage();
  const maxDailyTokens = 2000000; // 200만 토큰
  
  if (dailyTokenUsage >= maxDailyTokens) {
    throw new Error('일일 토큰 사용량을 초과했습니다. 내일 다시 시도해주세요.');
  }

  // 검색 결과 기반 컨텍스트 구성
  const keywordContext = keywords.length > 0 ? `키워드: ${keywords.join(', ')}` : '';
  const searchContext = searchQuery ? `검색 쿼리: ${searchQuery}` : '';
  
  // 검색 결과 요약
  const searchResultsContext = searchResults.length > 0 
    ? `\n\n검색 결과 요약:\n${searchResults.slice(0, 5).map((result, i) => 
        `${i+1}. ${result.title}\n   - ${result.snippet?.substring(0, 100)}...`
      ).join('\n')}\n\n이 검색 결과를 바탕으로 실제 시장의 니즈와 트렌드를 반영한 아이디어를 생성해주세요.`
    : '';

  const timestamp = Date.now();
  const randomSeed = Math.floor(Math.random() * 10000);
  const sessionId = Math.floor(Math.random() * 100000);
  
  const prompt = `${SIMPLE_IDEA_PROMPT}

${keywordContext}
${searchContext}${searchResultsContext}

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
    console.log(`📊 일일 토큰 사용량: ${dailyTokenUsage}/${maxDailyTokens}`);

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
      
      console.log('정리된 JSON 응답:', cleanContent);
      
      const parsed = JSON.parse(cleanContent);
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
    
    console.error('💥 OpenAI API 호출 실패:', error);
    
    throw error;
  }
}

// JSON 파싱 실패시 대체 파싱
function parseAlternativeFormat(content: string, tokensUsed: number) {
  console.error('JSON 파싱 실패 - 원본 응답:', content);
  
  // 마지막 시도: 정규식으로 JSON 구조 찾기
  try {
    const titleMatch = content.match(/"title"\s*:\s*"([^"]+)"/);
    const summaryMatch = content.match(/"summary"\s*:\s*"([^"]+)"/);
    const descriptionMatch = content.match(/"description"\s*:\s*"([^"]+)"/);
    const targetMatch = content.match(/"target"\s*:\s*"([^"]+)"/);
    
    if (titleMatch && descriptionMatch && targetMatch) {
      const fallbackIdea = {
        title: titleMatch[1],
        summary: summaryMatch ? summaryMatch[1] : titleMatch[1] + " 서비스",
        description: descriptionMatch[1],
        coretech: ["웹개발", "데이터베이스"],
        target: targetMatch[1]
      };
      
      console.log('정규식으로 추출한 아이디어:', fallbackIdea);
      
      return {
        ideas: [fallbackIdea],
        tokensUsed,
        success: true,
      };
    }
  } catch (regexError) {
    console.error('정규식 파싱도 실패:', regexError);
  }
  
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
    console.log(`📊 일일 토큰 사용량: ${dailyTokenUsage}/${maxDailyTokens}`);

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
      
      // 대체 방법: 간단한 텍스트 응답으로 처리
      try {
        const fallbackProject = {
          title: idea.title,
          subtitle: idea.summary || idea.title + " 상세 기획",
          coreValue: "혁신적인 기술과 사용자 중심 설계를 통한 시장 가치 창출",
          targetUsers: [idea.target],
          coreFeatures: idea.coretech || ["핵심 기능 1", "핵심 기능 2"],
          keyDifferentiators: ["차별화된 사용자 경험", "효율적인 기술 구현"],
          techStack: {
            frontend: ["React", "TypeScript"],
            backend: ["Node.js", "Express"],
            database: ["MongoDB"],
            external: ["외부 API"]
          },
          architecture: "클라우드 기반 확장 가능한 시스템 아키텍처",
          marketSize: "성장 가능성이 높은 신규 시장",
          competitors: ["기존 경쟁사 1", "기존 경쟁사 2"],
          competitiveAdvantage: "독창적인 접근 방식과 우수한 사용자 경험",
          revenueModel: ["구독 수익", "거래 수수료", "광고 수익"],
          targetRevenue: {
            month1: "50만원",
            month6: "500만원", 
            year1: "5,000만원"
          },
          developmentPhases: [
            {
              phase: "1단계: MVP 개발",
              duration: "4-6주",
              tasks: ["핵심 기능 구현", "사용자 인터페이스 개발"],
              deliverables: ["기본 프로토타입", "사용성 테스트"]
            }
          ],
          estimatedCosts: {
            development: 300,
            infrastructure: 50,
            marketing: 200,
            total: 550
          },
          risks: [
            {
              risk: "기술 구현의 복잡성",
              probability: "Medium",
              impact: "High",
              mitigation: "단계적 개발과 전문가 자문"
            }
          ],
          kpis: [
            {
              metric: "월간 활성 사용자",
              target: "1,000명",
              timeframe: "3개월"
            }
          ],
          actionPlan: {
            immediate: ["팀 구성", "기술 검토"],
            month1: ["MVP 개발 시작", "초기 테스트"],
            month3: ["베타 버전 출시", "사용자 피드백 수집"]
          }
        };
        
        console.log('대체 상세 기획서 생성:', fallbackProject);
        
        return {
          detailedProject: fallbackProject,
          tokensUsed,
          success: true,
        };
      } catch (fallbackError) {
        console.error('대체 기획서 생성도 실패:', fallbackError);
        throw new Error(`상세 기획서 생성에 실패했습니다. 응답 내용: ${content.substring(0, 200)}...`);
      }
    }

  } catch (error) {
    // 디버그용 에러 로그 출력
    console.log('=== OpenAI API 에러 (상세 설명 생성) ===');
    console.log('에러 내용:', error);
    console.log('====================================');
    
    console.error('💥 OpenAI 상세 설명 생성 실패:', error);
    
    throw error;
  }
}

export default openai;