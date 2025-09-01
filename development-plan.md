# NALO(날로) 개발 계획서
> 날로 먹는 프로젝트 기획 - 완전 무료 트렌드 기반 아이디어 생성 플랫폼

## 📋 개발 개요

### 서비스 목표
- **완전 무료**: 모든 기능을 0원으로 제공하는 아이디어 생성 플랫폼
- **빠른 생성**: 3분 내에 맞춤형 프로젝트 아이디어 제공
- **실용성**: 실제로 구현 가능한 현실적인 아이디어 생성
- **한국 특화**: 한국 시장과 트렌드에 최적화

### 핵심 기능
1. **실시간 트렌드 수집**: DDGS API를 통한 글로벌 이슈 모니터링
2. **AI 기반 아이디어 생성**: OpenAI GPT를 활용한 맞춤형 제안
3. **사용자 맞춤화**: 관심 분야 기반 개인화 서비스
4. **실행 가능성 평가**: 기술 난이도, 시장성, 예상 비용 자동 산출

## 🛠️ 기술 스택 (완전 무료)

### 프론트엔드
- **Framework**: Next.js 14 (App Router)
- **스타일링**: Tailwind CSS
- **UI 컴포넌트**: Headless UI
- **상태 관리**: React Context + Local Storage

### 백엔드
- **API**: Next.js API Routes (서버리스)
- **데이터베이스**: Supabase (무료 500MB)
- **AI**: OpenAI GPT API (무료 250만 토큰/일)
- **검색**: DDGS (DuckDuckGo Search) - 무제한 무료

### 인프라
- **호스팅**: Vercel (무료 플랜)
- **도메인**: .vercel.app (서브도메인)
- **CDN**: Vercel Edge Network
- **버전관리**: GitHub (무료 public repo)

### 모니터링 & 분석
- **에러 추적**: Sentry (무료 5,000 에러/월)
- **분석**: Google Analytics 4 (무료)
- **성능**: Vercel Analytics (무료)

## 📁 프로젝트 구조

```
NALO/
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.js
├── .env.local
├── .env.example
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── api/
│   │   ├── trends/route.ts
│   │   ├── generate/route.ts
│   │   └── analytics/route.ts
│   ├── components/
│   │   ├── ui/
│   │   ├── TrendKeywords.tsx
│   │   ├── IdeaGenerator.tsx
│   │   ├── ResultDisplay.tsx
│   │   └── ShareButton.tsx
│   └── lib/
│       ├── supabase.ts
│       ├── openai.ts
│       ├── ddgs.ts
│       └── utils.ts
├── types/
│   └── index.ts
└── public/
    ├── favicon.ico
    └── images/
```

## 🗄️ 데이터베이스 설계

### Supabase 테이블 구조

```sql
-- 트렌드 키워드 저장
CREATE TABLE trends (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(100) NOT NULL,
    search_volume INTEGER,
    category VARCHAR(50),
    source VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 생성된 아이디어 저장 (캐싱용)
CREATE TABLE ideas (
    id SERIAL PRIMARY KEY,
    input_keywords TEXT[],
    category VARCHAR(50),
    title VARCHAR(200),
    description TEXT,
    difficulty INTEGER, -- 1-5 점수
    market_potential INTEGER, -- 1-5 점수
    estimated_cost INTEGER, -- 예상 비용 (만원)
    development_time INTEGER, -- 예상 개발 기간 (주)
    first_step TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 사용자 피드백 (선택사항)
CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    idea_id INTEGER REFERENCES ideas(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- API 사용량 모니터링
CREATE TABLE usage_logs (
    id SERIAL PRIMARY KEY,
    api_type VARCHAR(50), -- 'openai', 'ddgs', etc.
    tokens_used INTEGER,
    success BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 개발 일정 (4주 스프린트)

### Week 1: 기반 구축 (Day 1-7)
- **Day 1-2**: 
  - Next.js 프로젝트 생성 및 Vercel 배포 설정
  - Tailwind CSS 및 기본 레이아웃 구성
  - GitHub 저장소 생성 및 CI/CD 파이프라인 설정

- **Day 3-4**:
  - Supabase 프로젝트 생성 및 데이터베이스 스키마 구축
  - 환경변수 설정 및 보안 구성
  - 기본 API 라우트 구조 생성

- **Day 5-6**:
  - DDGS API 연동 테스트
  - 트렌드 키워드 수집 로직 구현
  - 데이터 저장 및 캐싱 시스템 구축

- **Day 7**:
  - OpenAI API 연동 및 토큰 사용량 모니터링 시스템
  - 기본 프롬프트 템플릿 작성
  - Week 1 마무리 및 베타 배포

### Week 2: 핵심 기능 개발 (Day 8-14)
- **Day 8-10**:
  - 아이디어 생성 API 구현
  - GPT 프롬프트 최적화 (토큰 효율성 중심)
  - 실행 가능성 평가 로직 구현

- **Day 11-12**:
  - 사용자 입력 폼 컴포넌트 개발
  - 키워드 선택 및 직접 입력 인터페이스
  - 입력 유효성 검사 및 에러 처리

- **Day 13-14**:
  - 결과 표시 컴포넌트 구현
  - 아이디어 상세 정보 레이아웃
  - 로딩 상태 및 사용자 경험 개선

### Week 3: UI/UX 구현 (Day 15-21)
- **Day 15-17**:
  - 메인 랜딩 페이지 디자인 구현
  - 트렌드 키워드 표시 컴포넌트
  - 브랜드 아이덴티티 적용 (NALO 로고, 컬러 테마)

- **Day 18-19**:
  - 공유 기능 구현 (소셜 미디어 연동)
  - 아이디어 저장 및 히스토리 관리
  - 사용자 피드백 시스템

- **Day 20-21**:
  - 모바일 반응형 디자인 구현
  - 터치 친화적 인터페이스 최적화
  - 크로스 브라우저 호환성 테스트

### Week 4: 최적화 및 배포 (Day 22-28)
- **Day 22-23**:
  - 성능 최적화 (이미지, 코드 스플리팅)
  - 캐싱 전략 구현 (Redis 대신 메모리 캐시 활용)
  - SEO 최적화

- **Day 24-25**:
  - 토큰 사용량 모니터링 대시보드
  - 에러 추적 및 로깅 시스템 강화
  - 사용자 분석 도구 연동

- **Day 26-27**:
  - 베타 테스트 진행 (최소 10명)
  - 버그 수정 및 사용자 피드백 반영
  - 최종 품질 보증 테스트

- **Day 28**:
  - 정식 서비스 론칭
  - 초기 마케팅 콘텐츠 준비
  - 커뮤니티 채널 개설

## 💰 비용 관리 전략

### 일일 리소스 사용량 목표
- **OpenAI GPT 토큰**: 200만/일 (목표), 250만/일 (한계)
- **Supabase DB**: 일 증가량 1MB 이하
- **Vercel 대역폭**: 일 3GB 이하
- **DDGS API 호출**: 1,000회/일

### 효율성 최적화
1. **토큰 절약**:
   - 프롬프트 압축 및 최적화
   - 결과 캐싱으로 중복 요청 방지
   - 배치 처리로 API 호출 횟수 감소

2. **데이터베이스 최적화**:
   - 텍스트 데이터 압축
   - 오래된 데이터 자동 정리
   - 인덱스 최적화로 쿼리 성능 향상

3. **대역폭 최적화**:
   - 이미지 최적화 및 CDN 활용
   - Gzip 압축 활성화
   - 불필요한 리소스 로딩 방지

## 📊 성공 지표 (KPI)

### 기술적 지표
- **응답 속도**: 아이디어 생성 3초 이내
- **가용성**: 99% 이상 업타임
- **에러율**: 2% 이하
- **토큰 효율성**: 아이디어당 평균 1,500 토큰 이하

### 사용자 지표
- **일평균 사용자**: 1개월 내 50명 달성
- **아이디어 생성 성공률**: 95% 이상
- **사용자 만족도**: 4.0/5.0 이상
- **재방문률**: 30% 이상

### 비즈니스 지표
- **바이럴 계수**: 15% 이상의 공유율
- **사용자 참여도**: 세션당 평균 3개 아이디어 생성
- **성공 사례**: 월 5개 이상의 실제 프로젝트 진행

## 🛡️ 위험 관리 계획

### 주요 위험 요소
1. **GPT 토큰 소진**: 사용량 제한, 다중 AI 모델 준비
2. **API 장애**: 백업 데이터 소스 확보
3. **사용자 급증**: 대기열 시스템, 단계별 확장
4. **품질 저하**: A/B 테스트, 지속적 프롬프트 개선

### 대응 방안
- **모니터링**: 실시간 리소스 사용량 추적
- **알림 시스템**: 임계값 도달 시 자동 알림
- **백업 계획**: 대체 서비스 및 응급 조치 방안
- **점진적 확장**: 사용자 증가에 따른 단계적 대응

## 🎯 론칭 후 계획

### 첫 달 목표
- 일평균 사용자 50명 달성
- 누적 아이디어 1,000개 생성
- 사용자 피드백 100개 수집
- 첫 성공 사례 3개 확보

### 3개월 목표
- PMF(Product-Market Fit) 달성
- 일평균 사용자 200명
- 커뮤니티 구축 및 입소문 확산
- 오픈소스 기여자 모집

### 장기 비전
- 한국 대표 아이디어 생성 플랫폼
- 글로벌 서비스 확장
- API 오픈으로 생태계 구축
- 지속 가능한 무료 서비스 모델 확립

---

**NALO(날로)**: 완전 무료, 3분 완성, 실용적 아이디어 생성
> "어렵게 생각하지 말고, 일단 시작해보자" 🚀