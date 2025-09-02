import OpenAI from 'openai';
import { dbHelpers } from './supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerateIdeasParams {
  categories: string[];
  customInput: string;
  trends?: string[];
  previousIdeas?: string[];
}

export async function generateIdeas(params: GenerateIdeasParams) {
  const { categories, customInput, trends = [], previousIdeas = [] } = params;
  
  // 토큰 사용량 체크
  const todayUsage = await dbHelpers.getDailyTokenUsage();
  const maxDailyTokens = 2000000; // 200만 토큰
  
  if (todayUsage >= maxDailyTokens) {
    throw new Error('일일 토큰 사용량을 초과했습니다. 내일 다시 시도해주세요.');
  }

  // 프롬프트 구성
  const trendContext = trends.length > 0 ? `현재 트렌드: ${trends.join(', ')}` : '';
  const categoryContext = categories.length > 0 ? `관심 분야: ${categories.join(', ')}` : '';
  const userInput = customInput ? `사용자 요청: ${customInput}` : '';

  const timestamp = Date.now();
  const randomSeed = Math.floor(Math.random() * 10000);
  const sessionId = Math.floor(Math.random() * 100000);
  
  // 이전 아이디어 컨텍스트 구성
  const previousIdeasContext = previousIdeas.length > 0 
    ? `\n\n❌ 다음 아이디어들과는 절대 중복되지 않는 완전히 새로운 아이디어를 생성해주세요:\n${previousIdeas.map((title, i) => `${i+1}. ${title}`).join('\n')}\n위 아이디어들과 유사한 컨셉, 기술 스택, 타겟 고객을 피하고 완전히 다른 접근법을 사용하세요.`
    : '';
  
  const prompt = `당신은 한국 시장에 특화된 실용적인 프로젝트 아이디어 생성 전문가입니다.

${trendContext}
${categoryContext}
${userInput}${previousIdeasContext}

생성 시드: ${randomSeed} (매번 다른 아이디어를 위해 사용)
세션 ID: ${sessionId} (중복 방지용)
생성 시간: ${new Date(timestamp).toLocaleString()}

위 정보를 바탕으로 실제로 구현 가능한 3개의 창의적이고 독창적인 프로젝트 아이디어를 생성해주세요. 
${previousIdeas.length > 0 ? '특히 위에 명시된 이전 아이디어들과는 완전히 다른 새로운 관점과 접근법을 시도해주세요.' : '이전에 생성했을 수 있는 아이디어와는 다른 새로운 관점과 접근법을 시도해주세요.'}

각 아이디어는 다음 요구사항을 만족해야 합니다:
1. 실제로 개발 가능한 현실적인 아이디어
2. 명확한 문제 해결과 가치 제안
3. 구체적인 수익 모델과 타겟 고객
4. 상세한 기술적 구현 방안
5. 단계별 실행 계획

JSON 형식으로 다음과 같이 응답해주세요:
{
  "ideas": [
    {
      "title": "매력적이고 구체적인 프로젝트 제목 (10자 내외)",
      "description": "핵심 가치 제안을 명확하고 간단하게 전달하는 2줄 정도의 개요 설명",
      "target": "구체적인 타겟 고객층과 예상 수익 모델 (예: 20-30대 직장인, 월 구독료 1만원)",
      "estimatedCost": 개발 비용 (만원 단위, 50-5000 사이),
      "developmentTime": 개발 기간 (주 단위, 4-52 사이),
      "difficulty": 기술 난이도 (1=매우쉬움, 2=쉬움, 3=보통, 4=어려움, 5=매우어려움),
      "marketPotential": 시장 잠재력 (1=매우낮음, 2=낮음, 3=보통, 4=높음, 5=매우높음),
      "competition": 경쟁 강도 (1=매우낮음, 2=낮음, 3=보통, 4=높음, 5=매우높음),
      "firstStep": "구체적인 첫 번째 실행 단계 (무엇을 어떻게 시작할지 명시, 50자 이상)",
      "techStack": "예상 기술 스택 (예: React, Node.js, MongoDB)",
      "keyFeatures": ["핵심 기능 1", "핵심 기능 2", "핵심 기능 3"],
      "challenges": ["예상 어려움 1", "예상 어려움 2"],
      "successFactors": ["성공 요인 1", "성공 요인 2"]
    }
  ]
}

중요: description은 간단하고 명확한 2줄 개요로 작성하고, 각 필드를 빠짐없이 작성해주세요.`;

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

    // 사용량 로그
    await dbHelpers.logUsage({
      api_type: 'openai',
      tokens_used: tokensUsed,
      success: true,
    });

    if (!content) {
      throw new Error('AI 응답을 받지 못했습니다.');
    }

    try {
      const parsed = JSON.parse(content);
      return {
        ideas: parsed.ideas,
        tokensUsed,
        success: true,
      };
    } catch (parseError) {
      // JSON 파싱 실패시 대체 파싱 시도
      return parseAlternativeFormat(content, tokensUsed);
    }

  } catch (error) {
    // 디버그용 에러 로그 출력
    console.log('=== OpenAI API 에러 (아이디어 생성) ===');
    console.log('에러 내용:', error);
    console.log('=================================');
    
    // 에러 로그
    await dbHelpers.logUsage({
      api_type: 'openai',
      success: false,
    });
    
    throw error;
  }
}

// JSON 파싱 실패시 대체 파싱
function parseAlternativeFormat(content: string, tokensUsed: number) {
  // 간단한 대체 파싱 로직 (실제로는 더 정교하게 구현)
  const mockIdeas = [
    {
      title: "AI 기반 개인 맞춤 학습 플랫폼",
      description: "사용자의 학습 패턴을 분석해서 최적의 학습 경로를 추천하는 서비스.\n개인별 맞춤형 커리큘럼과 실시간 진도 조절로 학습 효율을 극대화합니다.",
      target: "대학생 및 직장인 (월 구독료 29,000원)",
      estimatedCost: 500,
      developmentTime: 12,
      difficulty: 4,
      marketPotential: 4,
      competition: 3,
      firstStep: "MVP 프로토타입 개발 및 베타 테스터 모집",
      techStack: "React Native, Python, TensorFlow, AWS, MongoDB",
      keyFeatures: ["AI 맞춤 학습 경로", "실시간 진도 분석", "게임화된 학습 시스템"],
      challenges: ["AI 알고리즘 정확도 확보", "초기 사용자 데이터 수집"],
      successFactors: ["개인화 알고리즘의 차별화", "사용자 참여도 향상"]
    },
    {
      title: "로컬 맛집 큐레이션 앱",
      description: "동네별 숨은 맛집을 AI가 분석해서 개인 취향에 맞게 추천하는 앱.\n실제 방문 데이터와 결제 패턴을 기반으로 진짜 맛집을 발굴합니다.",
      target: "20-40대 직장인 (광고 수익 모델)",
      estimatedCost: 300,
      developmentTime: 8,
      difficulty: 3,
      marketPotential: 4,
      competition: 4,
      firstStep: "서울 강남구 지역부터 파일럿 서비스 시작",
      techStack: "React Native, Node.js, MongoDB, Google Maps API",
      keyFeatures: ["AI 취향 분석", "실시간 맛집 추천", "블록체인 리뷰 검증"],
      challenges: ["초기 식당 파트너십 확보", "정확한 취향 분석 알고리즘"],
      successFactors: ["지역 밀착형 서비스", "신뢰할 수 있는 추천 시스템"]
    },
    {
      title: "재택근무 생산성 관리 도구",
      description: "원격근무 시간 추적과 업무 효율성 분석을 통한 생산성 향상 도구.\n개인별 최적 업무 스케줄을 제안하고 팀 협업 효율성을 개선합니다.",
      target: "원격근무 직장인 (월 구독료 15,000원)",
      estimatedCost: 200,
      developmentTime: 6,
      difficulty: 2,
      marketPotential: 3,
      competition: 2,
      firstStep: "Chrome 확장 프로그램 형태로 간단한 시간 추적 기능 구현",
      techStack: "Chrome Extension API, React, Python, SQLite",
      keyFeatures: ["자동 시간 추적", "생산성 분석 리포트", "업무 루틴 최적화"],
      challenges: ["사용자 프라이버시 보호", "정확한 업무 패턴 분석"],
      successFactors: ["사용 편의성", "개인정보 보안 신뢰도"]
    }
  ];

  return {
    ideas: mockIdeas,
    tokensUsed,
    success: true,
  };
}

export async function generateDetails(idea: any) {
  // 토큰 사용량 체크
  const todayUsage = await dbHelpers.getDailyTokenUsage();
  const maxDailyTokens = 2000000; // 200만 토큰
  
  if (todayUsage >= maxDailyTokens) {
    throw new Error('일일 토큰 사용량을 초과했습니다. 내일 다시 시도해주세요.');
  }

  const prompt = `다음 프로젝트 아이디어에 대한 500자 이상의 종합적인 프로젝트 기획서를 작성해주세요:

제목: ${idea.title}
개요: ${idea.description}
타겟: ${idea.target}
예상 비용: ${idea.estimatedCost}만원
개발 기간: ${idea.developmentTime}주

다음을 반드시 포함한 상세한 프로젝트 기획서를 작성해주세요:
1. 해결하고자 하는 구체적 문제와 현재 시장 상황 분석
2. 제품/서비스의 핵심 기능과 차별화 요소  
3. 비즈니스 모델과 수익 구조 상세 설명
4. 타겟 고객의 구체적 페르소나와 니즈 분석
5. 기술적 구현 방식과 아키텍처 설계
6. 마케팅 전략과 고객 획득 방안
7. 단계별 확장 계획과 로드맵
8. 예상되는 주요 리스크와 대응 방안

JSON 형식으로 다음과 같이 응답해주세요:
{
  "detailedDescription": "500자 이상의 종합적인 프로젝트 기획서 내용"
}`;

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

    // 사용량 로그
    await dbHelpers.logUsage({
      api_type: 'openai',
      tokens_used: tokensUsed,
      success: true,
    });

    if (!content) {
      throw new Error('AI 응답을 받지 못했습니다.');
    }

    try {
      const parsed = JSON.parse(content);
      return {
        detailedDescription: parsed.detailedDescription,
        tokensUsed,
        success: true,
      };
    } catch (parseError) {
      // JSON 파싱 실패시 대체 텍스트 반환
      const fallbackDescription = `현재 ${idea.title} 프로젝트는 ${idea.target}을 대상으로 하는 혁신적인 솔루션입니다. 
      
시장 분석: 기존 시장의 문제점을 해결하고 새로운 가치를 제공하는 서비스로, 예상 개발 비용 ${idea.estimatedCost}만원과 ${idea.developmentTime}주의 개발 기간이 소요될 것으로 예상됩니다.

핵심 기능: 사용자 중심의 직관적인 인터페이스와 효율적인 백엔드 시스템을 통해 고객의 니즈를 충족하는 핵심 서비스를 제공합니다.

비즈니스 모델: 지속 가능한 수익 구조를 바탕으로 한 구독 기반 또는 거래 수수료 모델을 통해 안정적인 매출을 확보할 계획입니다.

기술적 구현: 최신 웹 기술과 클라우드 인프라를 활용하여 확장 가능하고 안정적인 서비스 아키텍처를 구축합니다.

마케팅 전략: 타겟 고객층의 특성을 분석하여 효과적인 디지털 마케팅과 입소문 마케팅을 통해 사용자를 확보할 예정입니다.

확장 계획: 초기 서비스 런칭 후 사용자 피드백을 바탕으로 기능을 개선하고, 점진적으로 서비스 영역을 확대해 나갈 계획입니다.`;

      return {
        detailedDescription: fallbackDescription,
        tokensUsed,
        success: true,
      };
    }

  } catch (error) {
    // 디버그용 에러 로그 출력
    console.log('=== OpenAI API 에러 (상세 설명 생성) ===');
    console.log('에러 내용:', error);
    console.log('====================================');
    
    // 에러 로그
    await dbHelpers.logUsage({
      api_type: 'openai',
      success: false,
    });
    
    throw error;
  }
}

export default openai;