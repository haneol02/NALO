# 🚀 NALO(날로) - 날로 먹는 프로젝트 기획

**3분 만에 완성하는 트렌드 기반 프로젝트 아이디어 생성 플랫폼**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--3.5-412991?logo=openai)](https://openai.com/)

## 📖 프로젝트 개요

NALO는 "날로 먹는다"는 뜻에서 착안한 **완전 무료 아이디어 생성 플랫폼**입니다.  
실시간 트렌드 데이터와 AI를 활용해 누구나 쉽고 빠르게 실용적인 프로젝트 아이디어를 얻을 수 있습니다.

### ✨ 핵심 특징
- 🚀 **빠른 생성**: 3분 내 맞춤형 아이디어 3개 제공
- 💰 **완전 무료**: 모든 기능 무료 이용 (숨겨진 비용 없음)
- 🎯 **실용적**: 실제 구현 가능한 현실적 아이디어 생성
- 📊 **트렌드 기반**: 실시간 글로벌 트렌드 반영
- 🇰🇷 **한국 특화**: 한국 시장과 문화에 최적화

## 🛠️ 기술 스택

### 프론트엔드
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Headless UI

### 백엔드
- **API**: Next.js API Routes (서버리스)
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-3.5-turbo
- **Search**: Duck Duck Go Search API

### 인프라 (완전 무료)
- **Hosting**: Vercel
- **Database**: Supabase 무료 플랜 (500MB)
- **CDN**: Vercel Edge Network
- **Analytics**: Vercel Analytics + Google Analytics 4

## 🚀 빠른 시작

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/nalo.git
cd nalo
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env.example` 파일을 `.env.local`로 복사하고 실제 값으로 수정:

```bash
cp .env.example .env.local
```

```env
# OpenAI API 키 (https://platform.openai.com/)
OPENAI_API_KEY=sk-your-api-key-here

# Supabase 설정 (https://supabase.com/)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. 데이터베이스 설정
Supabase 프로젝트에서 다음 SQL을 실행:

```sql
-- 트렌드 키워드 테이블
CREATE TABLE trends (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(100) NOT NULL,
    search_volume INTEGER,
    category VARCHAR(50),
    source VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 생성된 아이디어 테이블 (캐싱용)
CREATE TABLE ideas (
    id SERIAL PRIMARY KEY,
    input_keywords TEXT[],
    category VARCHAR(50),
    title VARCHAR(200),
    description TEXT,
    difficulty INTEGER,
    market_potential INTEGER,
    estimated_cost INTEGER,
    development_time INTEGER,
    first_step TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 사용량 로그 테이블
CREATE TABLE usage_logs (
    id SERIAL PRIMARY KEY,
    api_type VARCHAR(50),
    tokens_used INTEGER,
    success BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 피드백 테이블
CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    idea_id INTEGER REFERENCES ideas(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

## 📁 프로젝트 구조

```
NALO/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API 라우트
│   │   ├── generate/      # 아이디어 생성 API
│   │   ├── trends/        # 트렌드 수집 API
│   │   └── analytics/     # 분석 API
│   ├── components/        # React 컴포넌트
│   ├── lib/              # 라이브러리 및 유틸리티
│   ├── globals.css       # 글로벌 스타일
│   ├── layout.tsx        # 루트 레이아웃
│   └── page.tsx          # 메인 페이지
├── types/                 # TypeScript 타입 정의
├── public/               # 정적 파일
├── development-plan.md   # 개발 계획서
├── todo.md              # 작업 진행 상황
└── README.md            # 프로젝트 문서
```

## 🎯 주요 기능

### 1. 실시간 트렌드 모니터링
- DuckDuckGo Search API를 통한 글로벌 이슈 수집
- 카테고리별 트렌드 키워드 분류
- 한국어 최적화된 검색 결과

### 2. AI 기반 아이디어 생성
- OpenAI GPT-3.5를 활용한 맞춤형 아이디어 생성
- 토큰 사용량 최적화 (일일 250만 토큰 한도 관리)
- 실행 가능성 자동 평가 (기술 난이도, 시장성, 경쟁도)

### 3. 사용자 맞춤화
- 8개 카테고리 기반 관심사 선택
- 직접 키워드 입력 지원
- 로컬 스토리지를 통한 개인화 설정 저장

### 4. 결과 분석 및 공유
- 상세한 프로젝트 정보 (비용, 기간, 난이도)
- 구체적인 첫 번째 실행 단계 제공
- SNS 공유 기능 (#날로먹었어요 캠페인)

## 📊 무료 운영 모델

### 리소스 사용량 목표
- **OpenAI 토큰**: 일 200만 토큰 (한도 250만)
- **Supabase DB**: 500MB 이하
- **Vercel 대역폭**: 월 100GB 이하

### 효율성 최적화
- 프롬프트 압축 및 캐싱
- 중복 요청 방지 시스템
- 데이터 압축 및 정리 자동화

## 🚀 배포

### Vercel에 배포하기

1. [Vercel](https://vercel.com)에서 GitHub 저장소 연결
2. 환경 변수 설정
3. 자동 배포 확인

```bash
# 또는 Vercel CLI 사용
npx vercel --prod
```

## 📈 개발 로드맵

### Phase 1: MVP (4주)
- [x] 기본 UI/UX 구현
- [x] 트렌드 수집 시스템
- [x] AI 아이디어 생성
- [ ] 베타 테스트 및 버그 수정

### Phase 2: 최적화 (4주)
- [ ] 성능 최적화
- [ ] 모바일 반응형 완성
- [ ] 사용자 피드백 시스템
- [ ] SEO 최적화

### Phase 3: 확장 (8주)
- [ ] 커뮤니티 기능
- [ ] 성공 사례 큐레이션
- [ ] API 오픈
- [ ] 글로벌 서비스 확장

## 🤝 기여하기

NALO는 오픈소스 프로젝트입니다! 기여를 환영합니다.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 지원 및 문의

- **Issues**: [GitHub Issues](https://github.com/your-username/nalo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/nalo/discussions)
- **Email**: hello@nalo.dev

---

**NALO(날로)**: 어렵게 생각하지 말고, 일단 시작해보세요! 🚀

*Made with ❤️ in Korea*