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

다음 검색 결과와 키워드를 바탕으로 실제로 개발 가능한 3개의 간단명료한 프로젝트 아이디어를 생성해주세요.

각 아이디어는 다음 JSON 형식으로 작성해주세요:
{
  "ideas": [
    {
      "title": "프로젝트 제목 (10자 내외)",
      "summary": "핵심 가치를 한 문장으로 요약",
      "description": "무엇을 하는 서비스인지 2-3줄로 설명",
      "coretech": ["핵심기술1", "핵심기술2", "핵심기술3"],
      "target": "주요 타겟 사용자와 예상 수익모델"
    }
  ]
}

중요 요구사항:
1. 실제로 개발 가능한 현실적인 아이디어
2. 명확한 문제 해결과 가치 제안
3. 구체적인 타겟 고객
4. 간단명료한 설명 (복잡한 내용 지양)
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