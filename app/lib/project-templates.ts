// 프로젝트 기획서 템플릿 정의

export interface SimpleIdeaFormat {
  title: string;
  summary: string;
  description: string;
  coretech: string[];
  target: string;
}

export interface DetailedProjectFormat {
  // 1. 프로젝트 개요
  title: string;
  subtitle: string;
  coreValue: string;
  targetUsers: string[];
  
  // 2. 기능 및 특징
  coreFeatures: string[];
  keyDifferentiators: string[];
  
  // 3. 기술적 구현
  techStack: {
    frontend: string[];
    backend: string[];
    database: string[];
    external: string[];
  };
  architecture: string;
  
  // 4. 시장 분석
  marketSize: string;
  competitors: string[];
  competitiveAdvantage: string;
  
  // 5. 비즈니스 모델
  revenueModel: string[];
  targetRevenue: {
    month1: string;
    month6: string;
    year1: string;
  };
  
  // 6. 개발 계획
  developmentPhases: {
    phase: string;
    duration: string;
    tasks: string[];
    deliverables: string[];
  }[];
  
  // 7. 예상 비용 및 자원
  estimatedCosts: {
    development: number;
    infrastructure: number;
    marketing: number;
    total: number;
  };
  
  // 8. 위험 요소 및 대응
  risks: {
    risk: string;
    probability: 'Low' | 'Medium' | 'High';
    impact: 'Low' | 'Medium' | 'High';
    mitigation: string;
  }[];
  
  // 9. 성공 지표
  kpis: {
    metric: string;
    target: string;
    timeframe: string;
  }[];
  
  // 10. 실행 계획
  actionPlan: {
    immediate: string[];
    month1: string[];
    month3: string[];
  };
}

// 간소화된 아이디어 생성을 위한 프롬프트 템플릿
export const SIMPLE_IDEA_PROMPT = `
당신은 실용적인 프로젝트 아이디어 생성 전문가입니다.

다음 검색 결과와 키워드를 바탕으로 실제로 개발 가능한 1개의 상세하고 구체적인 프로젝트 아이디어를 생성해주세요.

아이디어는 다음 JSON 형식으로 상세하게 작성해주세요:
{
  "ideas": [
    {
      "title": "프로젝트 제목 (15자 내외)",
      "summary": "핵심 가치를 한 문장으로 요약",
      "description": "무엇을 하는 서비스인지 상세히 설명 (5-7줄)",
      "coretech": ["핵심기술1", "핵심기술2", "핵심기술3", "핵심기술4", "핵심기술5"],
      "target": "주요 타겟 사용자와 시장 규모",
      "estimatedCost": 예상_개발비용_만원단위_숫자,
      "developmentTime": 예상_개발기간_주단위_숫자,
      "difficulty": 기술난이도_1부터5까지_숫자,
      "marketPotential": 시장잠재력_1부터5까지_숫자,
      "competition": 경쟁강도_1부터5까지_숫자,
      "firstStep": "프로젝트 시작을 위한 첫 번째 구체적 실행 단계",
      "techStack": "구체적인 기술 스택 조합 (예: React + Node.js + MongoDB + AWS)",
      "keyFeatures": ["핵심기능1", "핵심기능2", "핵심기능3", "핵심기능4", "핵심기능5"],
      "challenges": ["예상되는 기술적 도전과제1", "예상되는 기술적 도전과제2", "예상되는 기술적 도전과제3"],
      "successFactors": ["성공요인1", "성공요인2", "성공요인3"]
    }
  ]
}

중요 요구사항:
1. 실제로 개발 가능한 현실적인 아이디어
2. 명확한 문제 해결과 가치 제안
3. 구체적인 타겟 고객
4. 간단명료한 설명 (복잡한 내용 지양)
`;

// 기획서 양식 생성을 위한 프롬프트 템플릿
export const IDEA_PLAN_PROMPT = `
당신은 전문 프로젝트 기획서 작성 전문가입니다.

다음 아이디어를 바탕으로 완전한 프로젝트 기획서를 작성해주세요.

아이디어 정보:
제목: {title}
요약: {summary}
설명: {description}
핵심기술: {coretech}
타겟: {target}

다음 JSON 형식으로 완전한 기획서를 작성해주세요. 모든 필드는 반드시 채워주시고, 데이터가 없거나 불분명한 경우 '데이터 없음' 또는 '추가 분석 필요'로 명시해주세요:

{
  "ideaPlan": {
    "project_name": "아이디어를 바탕으로 AI가 새롭게 만들어낸 창의적이고 브랜드처럼 들리는 서비스명 (예: 카카오톡, 네이버, 토스처럼 기억하기 쉽고 브랜딩 가능한 이름으로 생성)",
    "service_summary": "아이디어의 핵심 가치를 한 문장으로 명확하게 요약",
    "created_date": "2025-01-14",
    "project_type": "프로젝트 유형을 구체적으로 분류 (웹서비스, 모바일앱, SaaS, 플랫폼 등)",
    "core_idea": "핵심 아이디어와 가치를 200-400자로 상세하게 설명하여 프로젝트의 본질과 차별점을 명확히 제시",
    "background": "프로젝트 배경과 필요성을 200-400자로 구체적으로 설명하며 현재 시장 상황, 사용자 니즈, 해결해야 할 문제의 맥락을 포함하여 작성",
    "target_customer": "주요 타겟 고객층을 구체적으로 세분화하여 설명하고, 각 고객군의 특성과 니즈를 명시",
    "problem_to_solve": "해결하려는 핵심 문제를 200-400자로 현실적이고 구체적으로 설명하며, 문제의 규모와 영향도를 포함하여 작성",
    "proposed_solution": "제안하는 해결책을 200-400자로 기술적 접근법과 비즈니스 관점에서 상세하게 설명하고, 구체적인 구현 방안과 차별점을 포함",
    
    "main_objectives": "프로젝트의 주요 목표를 3-5개로 구체적이고 측정 가능하게 명시하여 프로젝트 성공 기준을 제시",
    "success_metrics": "성공 지표를 구체적인 수치와 달성 시점을 포함하여 명시 (예: 사용자 1만명 달성, 월매출 1000만원 등)",
    
    "project_scope_include": "프로젝트에 포함될 구체적인 기능, 서비스, 범위를 상세히 명시",
    "project_scope_exclude": "프로젝트에서 제외될 기능이나 범위를 명확히 명시하여 경계를 설정",
    
    "features": ["핵심기능1 - 구체적 설명", "핵심기능2 - 구체적 설명", "핵심기능3 - 구체적 설명", "핵심기능4 - 구체적 설명", "핵심기능5 - 구체적 설명"],
    "key_features": ["핵심기능1 - 구체적 설명", "핵심기능2 - 구체적 설명", "핵심기능3 - 구체적 설명", "핵심기능4 - 구체적 설명", "핵심기능5 - 구체적 설명"],
    
    "difficulty": 기술_난이도_1부터_5까지_정수_숫자,
    "market_potential": 시장_잠재력_1부터_5까지_정수_숫자,
    "competition": 경쟁_우위도_1부터_5까지_정수_숫자,
    "challenges": ["예상되는_도전과제1", "예상되는_도전과제2", "예상되는_도전과제3"],
    "success_factors": ["성공_요인1", "성공_요인2", "성공_요인3"],
    
    "market_analysis": "시장 규모, 성장률, 트렌드 등을 포함한 시장 분석을 200-400자로 상세히 작성",
    "competitors": "주요 경쟁사 3-5개와 각각의 특징, 강점, 약점을 구체적으로 분석",
    "differentiation": "경쟁사 대비 차별화 포인트를 구체적이고 설득력 있게 설명",
    
    "swot_strengths": "프로젝트의 강점을 내부 역량, 기술력, 팀 등의 관점에서 구체적으로 분석",
    "swot_weaknesses": "프로젝트의 약점과 한계를 솔직하고 현실적으로 분석",
    "swot_opportunities": "외부 환경에서 찾을 수 있는 기회 요소들을 구체적으로 명시",
    "swot_threats": "외부 위험 요소와 잠재적 위협들을 현실적으로 분석",
    
    "tech_stack": "사용할 기술 스택을 프론트엔드, 백엔드, 데이터베이스 등으로 구분하여 구체적으로 명시",
    "system_architecture": "시스템 아키텍처를 확장성, 보안, 성능 관점에서 200-300자로 설명",
    "database_type": "사용할 데이터베이스 종류와 선택 이유를 구체적으로 명시",
    "development_environment": "개발 환경, 협업 도구, 배포 방식 등을 구체적으로 설명",
    "security_requirements": "보안 요구사항과 구현 방안을 데이터 보호, 접근 제어 등의 관점에서 설명",
    
    "project_phases": [
      {
        "phase": "1단계: MVP 개발 (4-6주)",
        "duration": "구체적인 소요 기간",
        "tasks": ["세부 작업1", "세부 작업2", "세부 작업3"],
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
    
    "expected_effects": "프로젝트 완료 후 기대되는 효과를 사용자, 비즈니스, 기술적 관점에서 구체적으로 설명",
    "business_impact": "비즈니스에 미칠 구체적인 영향과 가치를 매출, 효율성, 경쟁력 등의 관점에서 설명",
    "social_value": "사회적 가치와 기여도를 구체적으로 설명",
    "roi_prediction": "투자 대비 수익률 예측을 구체적인 수치와 근거를 포함하여 설명",
    
    "risk_factors": "프로젝트 진행 시 발생할 수 있는 주요 위험 요소들을 기술적, 시장적, 운영적 관점에서 분석",
    "risk_response": "각 위험 요소에 대한 구체적인 대응 방안과 완화 전략을 설명",
    "contingency_plan": "최악의 시나리오에 대비한 비상 계획을 구체적으로 수립",
    
    "development_cost": 현실적인_개발비용_만원단위_50만원부터_500만원_사이_숫자,
    "operation_cost": 현실적인_운영비용_만원단위_10만원부터_50만원_사이_숫자,
    "marketing_cost": 현실적인_마케팅비용_만원단위_20만원부터_100만원_사이_숫자,
    "other_cost": 현실적인_기타비용_만원단위_5만원부터_30만원_사이_숫자
  }
}

중요 요구사항:
1. **모든 필드를 빠짐없이 채우기**: 위에 명시된 모든 필드를 반드시 포함하고, 불분명한 정보는 '데이터 없음' 또는 '추가 분석 필요'로 명시
2. **더미 데이터 금지**: 더미 데이터나 임의의 값을 넣지 말고, 아이디어 정보를 기반으로 논리적으로 도출된 내용만 작성
3. **구체적인 분석**: 프로젝트 목표, 프로젝트 범위, 시장 분석, SWOT 분석, 기술적 요구사항, 위험관리, 기대효과 섹션은 특히 상세하고 구체적으로 작성
4. **현실적인 비용**: 비용 필드는 현실적인 추정치를 제시하되, 불분명한 경우 0으로 설정
5. **단계별 계획**: project_phases는 반드시 3단계로 구성하고 각 단계별 구체적인 내용 포함
6. **핵심 기능**: features 배열은 정확히 5개 항목으로 구성하되 각각 구체적으로 설명
7. **상세한 설명**: 모든 설명 필드는 200-400자로 상세하게 작성 (main_objectives, success_metrics 등 포함)
8. **전문적 작성**: 한국어로만 작성하며 전문적이고 현실적으로 작성
9. **완전성 검증**: JSON 응답에 위의 모든 필드가 포함되었는지 반드시 확인 후 응답
`;

// 상세 기획서 생성을 위한 프롬프트 템플릿
export const DETAILED_PROJECT_PROMPT = `
당신은 전문 프로젝트 기획자입니다. 다음 아이디어를 바탕으로 상세하고 구체적인 프로젝트 기획서를 작성해주세요.

프로젝트: {title}
개요: {summary}
설명: {description}
핵심기술: {coretech}
타겟: {target}

다음 JSON 형식으로 상세 기획서를 작성해주세요. 모든 설명은 최소 300자 이상으로 작성하고, 구체적인 개발 일정과 타임라인을 포함해주세요:

{
  "detailedProject": {
    "title": "프로젝트 제목",
    "subtitle": "부제목 (한 줄 설명)",
    "coreValue": "핵심 가치 제안 (300자 이상의 상세한 설명으로 왜 이 프로젝트가 필요한지, 어떤 문제를 해결하는지, 사용자에게 어떤 가치를 제공하는지 구체적으로 서술)",
    "targetUsers": ["1차 타겟 (구체적인 사용자 페르소나)", "2차 타겟 (구체적인 사용자 페르소나)", "3차 타겟 (구체적인 사용자 페르소나)"],
    
    "coreFeatures": ["핵심기능1 (구체적인 기능 설명)", "핵심기능2 (구체적인 기능 설명)", "핵심기능3 (구체적인 기능 설명)", "핵심기능4 (구체적인 기능 설명)", "핵심기능5 (구체적인 기능 설명)"],
    "keyDifferentiators": ["차별화포인트1 (경쟁사와의 구체적 차이점)", "차별화포인트2 (고유한 장점)", "차별화포인트3 (혁신적 접근법)"],
    
    "techStack": {
      "frontend": ["기술1", "기술2"],
      "backend": ["기술1", "기술2"],
      "database": ["기술1"],
      "external": ["외부API1", "외부API2"]
    },
    "architecture": "시스템 아키텍처 설명 (300자 이상의 상세한 기술적 구현 방안과 확장성, 보안, 성능 최적화 방안 포함)",
    
    "marketSize": "시장 규모와 성장 가능성에 대한 300자 이상의 상세한 분석 (구체적인 수치와 근거 포함)",
    "competitors": ["경쟁사1 (구체적인 서비스명과 특징)", "경쟁사2 (구체적인 서비스명과 특징)", "경쟁사3 (구체적인 서비스명과 특징)"],
    "competitiveAdvantage": "경쟁 우위 요소에 대한 300자 이상의 상세한 설명 (기술적, 비즈니스적 우위점과 지속가능성 포함)",
    
    "revenueModel": ["수익모델1", "수익모델2", "수익모델3"],
    "targetRevenue": {
      "month1": "첫 달 목표 수익",
      "month6": "6개월 후 목표 수익", 
      "year1": "1년 후 목표 수익"
    },
    
    "developmentPhases": [
      {
        "phase": "1단계: MVP 개발 (최소 기능 제품)",
        "duration": "4-6주 (구체적인 주별 일정 포함)",
        "tasks": ["상세 작업1 (담당자와 예상 소요시간 명시)", "상세 작업2 (기술적 난이도와 위험도 포함)", "상세 작업3 (의존성과 선후행 관계 명시)"],
        "deliverables": ["구체적 산출물1 (품질 기준 포함)", "구체적 산출물2 (검증 방법 포함)"],
        "milestones": ["주요 마일스톤1", "주요 마일스톤2"],
        "resources": "필요한 인력과 장비 (구체적 명시)"
      },
      {
        "phase": "2단계: 베타 테스트 및 피드백 수집",
        "duration": "2-3주 (테스트 시나리오별 일정 포함)", 
        "tasks": ["상세 테스트 작업1 (테스트 범위와 방법)", "상세 테스트 작업2 (피드백 수집 계획)"],
        "deliverables": ["테스트 결과 리포트", "개선사항 도출 문서"],
        "milestones": ["베타 버전 출시", "사용자 피드백 완료"],
        "resources": "테스트 참여자와 도구"
      },
      {
        "phase": "3단계: 정식 출시 및 마케팅",
        "duration": "2-4주 (출시 전략별 타임라인)",
        "tasks": ["출시 준비 작업1 (인프라 구축)", "마케팅 작업2 (홍보 전략 실행)"],
        "deliverables": ["정식 버전 출시", "초기 사용자 확보"],
        "milestones": ["정식 출시", "초기 목표 사용자 달성"],
        "resources": "운영팀과 마케팅 예산"
      }
    ],
    
    "estimatedCosts": {
      "development": 개발비용(만원),
      "infrastructure": 인프라비용(만원), 
      "marketing": 마케팅비용(만원),
      "total": 총비용(만원)
    },
    
    "risks": [
      {
        "risk": "위험요소1",
        "probability": "Medium",
        "impact": "High", 
        "mitigation": "대응방안"
      },
      {
        "risk": "위험요소2",
        "probability": "Low",
        "impact": "Medium",
        "mitigation": "대응방안" 
      }
    ],
    
    "kpis": [
      {
        "metric": "핵심지표1",
        "target": "목표수치",
        "timeframe": "달성기간"
      },
      {
        "metric": "핵심지표2", 
        "target": "목표수치",
        "timeframe": "달성기간"
      }
    ],
    
    "actionPlan": {
      "immediate": ["즉시할일1", "즉시할일2"],
      "month1": ["1개월내할일1", "1개월내할일2"],
      "month3": ["3개월내할일1", "3개월내할일2"]
    }
  }
}

중요 요구사항:
1. 모든 설명 항목은 최소 300자 이상의 상세한 내용으로 작성
2. 개발 일정은 구체적인 주별/단계별 타임라인 포함
3. 각 단계별 필요 리소스와 담당자 역할 명시
4. 실행 가능한 구체적인 액션 아이템 제시
5. 한국 시장 상황과 문화적 특성 반영
6. 기술적 구현의 현실성과 확장성 고려
7. 비즈니스 모델의 수익성과 지속가능성 검토
`;

// 프롬프트에 데이터 삽입하는 헬퍼 함수
export function createDetailedPrompt(idea: SimpleIdeaFormat): string {
  return DETAILED_PROJECT_PROMPT
    .replace('{title}', idea.title)
    .replace('{summary}', idea.summary) 
    .replace('{description}', idea.description)
    .replace('{coretech}', idea.coretech.join(', '))
    .replace('{target}', idea.target);
}

export function createIdeaPlanPrompt(idea: SimpleIdeaFormat): string {
  return IDEA_PLAN_PROMPT
    .replace('{title}', idea.title)
    .replace('{summary}', idea.summary) 
    .replace('{description}', idea.description)
    .replace('{coretech}', idea.coretech.join(', '))
    .replace('{target}', idea.target);
}

// 결과 검증 함수
export function validateSimpleIdea(idea: any): idea is SimpleIdeaFormat {
  return (
    typeof idea.title === 'string' &&
    typeof idea.summary === 'string' &&
    typeof idea.description === 'string' &&
    Array.isArray(idea.coretech) &&
    typeof idea.target === 'string'
  );
}

export function validateDetailedProject(project: any): project is DetailedProjectFormat {
  return (
    typeof project.title === 'string' &&
    typeof project.subtitle === 'string' &&
    typeof project.coreValue === 'string' &&
    Array.isArray(project.targetUsers) &&
    Array.isArray(project.coreFeatures) &&
    typeof project.techStack === 'object' &&
    typeof project.revenueModel === 'object'
  );
}