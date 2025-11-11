# NALO 프로젝트 설정

## 프로젝트 개요
<<<<<<< Updated upstream
- **이름**: NALO (날로 먹는 아이디어 기획)
- **슬로건**: "날로 먹는 아이디어 기획 - AI 리서치와 마인드맵으로 아이디어를 구체화하세요"
- **목적**: AI 기반 아이디어 리서치 & 마인드맵 브레인스토밍 플랫폼
- **핵심 기능**:
  - **주제 탐색 (리서치)**: Wikipedia, 학술논문(OpenAlex), Perplexity Web 리서치 기반 아이디어 생성
  - **브레인스토밍 (마인드맵)**: 시각적 마인드맵으로 아이디어를 구체화하고 확장
- **타겟**: 개발자, 기획자, 창업자를 위한 완전 무료 서비스
=======
- **이름**: NALO (날로 먹는 프로젝트 기획)
- **목적**: 사용자 API 키 기반, AI 브레인스토밍과 학술 리서치를 결합한 완전 무료 프로젝트 기획 플랫폼
- **타겟**: 개발자, 기획자, 창업자를 위한 지속 가능한 무료 서비스
- **핵심 차별점**:
  - 사용자 API 키 방식으로 서버 비용 제로
  - ReactFlow 기반 대화형 마인드맵 브레인스토밍
  - Wikipedia + OpenAlex 학술 논문 데이터 기반 시장 검증
>>>>>>> Stashed changes

## 기술 스택

### 프론트엔드
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.0+
- **Styling**: Tailwind CSS 3.4
- **Icons**: Lucide React
- **UI**: Custom Components + ReactFlow 11

### 백엔드
- **API**: Next.js API Routes (서버리스)
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o-mini (사용자 API 키 방식)
- **Search**: Duck-Duck-Scrape
- **Research**: Wikipedia API, OpenAlex API, Perplexity API

### 라이브러리
- **PDF 생성**: jspdf + html2canvas
- **HTTP Client**: Built-in fetch
- **Utils**: clsx, tailwind-merge
- **마인드맵**: reactflow
- **인증**: @supabase/auth-ui-react

## 개발 환경

### 필수 명령어
- **개발 서버**: `npm run dev`
- **빌드**: `npm run build`
- **프로덕션 서버**: `npm run start`
- **린트**: `npm run lint`

### 환경 변수
```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (선택)

# 참고: OpenAI API 키는 사용자가 UI에서 직접 입력
```

## 코딩 규칙

### TypeScript 설정
- **Strict 모드** 사용
- 모든 컴포넌트는 **함수형** 컴포넌트
- **Interface**는 대문자로 시작 (예: `IdeaPlan`)
- **Props type**은 컴포넌트명 + Props (예: `IdeasPageProps`)

### React 컴포넌트
- **'use client'** 지시어 필요시 파일 최상단 명시
- **useState, useEffect** 등 훅은 컴포넌트 최상단에 배치
- **Event handler**는 handle 접두사 사용 (예: `handlePageChange`)

### 스타일링
- **Tailwind CSS** 유틸리티 클래스 우선 사용
- **반응형 디자인** 필수 (sm, md, lg 브레이크포인트)
- **커스텀 클래스**: globals.css에 정의된 것만 사용
  - `.card`, `.btn-primary`, `.btn-secondary`, `.gradient-text` 등

### 파일 구조
```
app/
├── api/                      # API 라우트
│   ├── generate/             # 빠른 아이디어 생성
│   ├── ideas/                # 기획서 CRUD
│   │   └── [id]/plan/        # 기획서 생성
│   ├── topics/               # 트렌드 키워드
│   ├── extract-keywords/     # 키워드 추출
│   ├── research/             # 통합 리서치
│   │   ├── wikipedia/        # Wikipedia 검색
│   │   └── openalex/         # OpenAlex 논문 검색
│   └── mindmap/              # 마인드맵 관련
│       ├── auto-setup/       # 자동 구조 생성
│       ├── expand/           # 노드 확장
│       └── to-plan/          # 기획서 변환
├── components/               # 재사용 컴포넌트
│   ├── IdeaGenerator.tsx     # 메인 입력 폼
│   ├── MindmapViewer.tsx     # 마인드맵 뷰어
│   ├── SimpleTopicExplorer.tsx # 주제 탐색
│   ├── ResearchResults.tsx   # 리서치 결과
│   ├── ResultDisplay.tsx     # 아이디어 결과
│   ├── ApiKeyInput.tsx       # API 키 입력
│   └── AuthButton.tsx        # 인증 버튼
├── lib/                      # 유틸리티, 설정
│   ├── supabase.ts           # Supabase 클라이언트
│   ├── apiKeyStorage.ts      # API 키 관리
│   ├── openai.ts             # OpenAI 유틸
│   └── simple-topic-generator.ts # 주제 생성
├── ideas/                    # 기획서 목록 페이지
├── plan/[id]/                # 기획서 상세 페이지
├── login/                    # 로그인 페이지
├── globals.css               # 글로벌 스타일
├── layout.tsx                # 루트 레이아웃
└── page.tsx                  # 홈페이지
```

## API 설계

### 응답 형식
```typescript
// 성공 응답
{
  success: true,
  data: any,
  message?: string
}

// 실패 응답
{
  success: false,
  error: string,
  details?: any
}
```

### 주요 API 엔드포인트
- `/api/generate` - 빠른 아이디어 생성 (POST)
- `/api/ideas` - 기획서 목록 조회/생성 (GET/POST)
- `/api/ideas/[id]` - 기획서 상세 조회/수정 (GET/PATCH)
- `/api/ideas/[id]/plan` - 아이디어 → 기획서 변환 (POST)
- `/api/topics` - 트렌드 키워드 조회 (GET)
- `/api/extract-keywords` - 키워드 추출 (POST)
- `/api/research` - 통합 리서치 (POST)
- `/api/research/wikipedia` - Wikipedia 검색 (POST)
- `/api/research/openalex` - OpenAlex 논문 검색 (POST)
- `/api/research/perplexity` - Perplexity 웹 검색 (POST)
- `/api/mindmap/auto-setup` - 마인드맵 자동 구조 생성 (POST)
- `/api/mindmap/expand` - 마인드맵 노드 확장 (POST)
- `/api/mindmap/to-plan` - 마인드맵 → 기획서 변환 (POST)

## 데이터베이스

### 주요 테이블
- **idea_plans**: 생성된 기획서 저장
  - id (UUID, PK)
  - user_id (UUID, FK to auth.users)
  - title (VARCHAR 500)
  - original_prompt (TEXT)
  - keywords (TEXT[])
  - plan_data (JSONB)
  - created_at, updated_at (TIMESTAMPTZ)

### 명명 규칙
- 테이블명: snake_case
- 컬럼명: snake_case
- Primary Key: id (UUID)
- Timestamp: created_at, updated_at (TIMESTAMPTZ)

### RLS (Row Level Security)
- 사용자는 자신의 기획서만 조회 가능
- 비로그인 사용자도 기획서 생성 가능 (user_id NULL)

## UI/UX 가이드라인

### 디자인 시스템
- **색상**: Blue/Purple 계열 (blue-600, purple-500 등)
- **폰트**: 시스템 폰트 스택
- **간격**: Tailwind spacing (p-4, m-6 등)
- **그림자**: shadow-lg, shadow-xl 사용

### 반응형 설계
- **모바일 우선** (Mobile First)
- **브레이크포인트**: sm(640px), md(768px), lg(1024px)
- **플로팅 네비게이션**: 모바일에서 하단 고정

### 사용자 경험
- **로딩 상태** 표시 필수
- **에러 처리** 사용자 친화적 메시지
- **페이지네이션**: 6개 아이템씩
- **애니메이션**: page-transition, card-hover 클래스

## 성능 최적화

### 이미지 최적화
- Next.js Image 컴포넌트 사용
- WebP 포맷 우선
- Lazy loading 적용

### 번들 최적화
- 동적 import 사용 (PDF 생성 라이브러리 등)
- Tree shaking 적용
- 코드 스플리팅

## 보안 및 모범 사례

### API 보안
- 사용자 API 키는 LocalStorage에 저장 (서버 전송 시만 사용)
- Supabase RLS로 데이터 접근 제어
- 입력값 검증 및 sanitization

### 코드 품질
- **린트 규칙** 준수
- **타입 안전성** 보장
- **에러 바운더리** 적용 (ErrorBoundary.tsx)
- **로깅** 시스템 활용

## 배포 및 운영

### 배포 환경
- **호스팅**: Vercel
- **데이터베이스**: Supabase
- **도메인**: Custom domain 설정 가능

### 모니터링
- Vercel Analytics
- Supabase Dashboard
- 사용자 API 키 사용량은 사용자가 직접 모니터링

## 자주 사용하는 패턴

### 사용자 API 키 가져오기
```typescript
import { getApiKey } from '@/app/lib/apiKeyStorage';

const apiKey = getApiKey();
if (!apiKey) {
  setError('API 키가 설정되지 않았습니다.');
  return;
}
```

### 데이터 fetching
```typescript
const [data, setData] = useState<Type[]>([]);
const [loading, setLoading] = useState(true);

const fetchData = async () => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error('API 키 필요');

    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, ...params })
    });
    const result = await response.json();
    if (result.success) {
      setData(result.data);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setLoading(false);
  }
};
```

### 페이지네이션
```typescript
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 6;
const totalPages = Math.ceil(items.length / itemsPerPage);
const currentItems = items.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);
```

### 한국어 날짜 포맷
```typescript
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul'
  });
};
```

## 주의사항
- **한글 주석** 허용 및 권장
- **console.log** 프로덕션에서 제거
- **민감 정보** 절대 하드코딩 금지
- **API 응답 형식** 일관성 유지
- **에러 처리** 사용자 친화적으로
- **로딩 상태** 모든 비동기 작업에 적용
- **사용자 API 키** 서버에 저장하지 않음 (요청 시에만 전달)

## 핵심 워크플로우

### 1. 주제 탐색 모드
1. 사용자 입력 → `/api/extract-keywords` (키워드 추출)
2. 키워드 확장 → SimpleTopicExplorer (주제 선택)
3. 리서치 선택 → `/api/research` (Wikipedia + OpenAlex + Perplexity)
4. 아이디어 생성 → `/api/ideas` (POST)

### 2. 브레인스토밍 모드
1. 사용자 입력 → `/api/mindmap/auto-setup` (구조 생성)
2. 마인드맵 표시 → MindmapViewer
3. 노드 확장 → `/api/mindmap/expand` (대화형)
4. 기획서 변환 → `/api/mindmap/to-plan`

### 3. 기획서 생성
1. 아이디어 선택 → `/api/ideas/[id]/plan` (상세 기획서 생성)
2. Supabase 저장 → idea_plans 테이블
3. PDF 생성 → jsPDF + html2canvas

**참고**: `/api/generate` (빠른 생성 모드)는 현재 비활성화 상태
