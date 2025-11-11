# 3. 기술 스택 상세

NALO는 **현대적이고 확장 가능한 기술 스택**을 사용하여 개발되었습니다. 각 기술은 프로젝트의 요구사항과 목표에 맞춰 신중하게 선택되었습니다.

---

## 3.1 프론트엔드 기술

### 3.1.1 Next.js 14 (App Router)

**버전**: `^14.2.32`

#### 선택 이유
Next.js 14는 React 기반의 **풀스택 프레임워크**로, 다음과 같은 이유로 선택했습니다:

1. **App Router의 강력함**
   - 파일 시스템 기반 라우팅 (`app/` 디렉토리)
   - 레이아웃, 로딩, 에러 처리의 표준화
   - 동적 라우팅 (`/plan/[id]`)으로 유연한 페이지 구성

2. **서버 컴포넌트 (React Server Components)**
   - 초기 로딩 속도 개선
   - SEO 최적화 (검색 엔진 친화적)
   - 클라이언트 번들 크기 감소

3. **API Routes (서버리스 함수)**
   - 별도 백엔드 서버 불필요
   - Vercel 배포 시 자동으로 서버리스 함수로 변환
   - 비용 효율적 (사용한 만큼만 과금)

4. **이미지 최적화**
   - `next/image` 컴포넌트로 자동 최적화
   - WebP 변환, Lazy Loading

5. **TypeScript 네이티브 지원**
   - 타입 안전성 보장
   - 개발자 경험 향상

#### 주요 기능 활용

```typescript
// app/layout.tsx - 루트 레이아웃
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}

// app/plan/[id]/page.tsx - 동적 라우팅
export default function PlanDetailPage({
  params
}: {
  params: { id: string }
}) {
  // id를 사용한 데이터 fetch
}

// app/api/generate/route.ts - API Route
export async function POST(request: Request) {
  const body = await request.json();
  // 비즈니스 로직 처리
  return Response.json({ success: true, data: result });
}
```

---

### 3.1.2 React 18

**버전**: `^18`

#### 선택 이유
React 18은 **최신 웹 UI 라이브러리**로, 다음과 같은 장점이 있습니다:

1. **Concurrent Rendering**
   - 더 부드러운 사용자 경험
   - 우선순위 기반 렌더링

2. **Automatic Batching**
   - 여러 상태 업데이트를 한 번에 처리
   - 불필요한 리렌더링 감소

3. **Suspense for Data Fetching**
   - 비동기 데이터 로딩 처리 간소화
   - 로딩 상태 관리 용이

4. **Hooks 생태계**
   - `useState`, `useEffect` 등으로 상태 관리
   - 커스텀 훅으로 로직 재사용

#### NALO에서의 활용

```typescript
// 상태 관리
const [ideas, setIdeas] = useState<Idea[]>([]);
const [loading, setLoading] = useState(false);

// 사이드 이펙트 처리
useEffect(() => {
  fetchIdeas();
}, []);

// 이벤트 핸들러
const handleGenerateIdea = async () => {
  setLoading(true);
  try {
    const result = await generateIdea(prompt);
    setIdeas(result.data);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

---

### 3.1.3 TypeScript 5

**버전**: `^5`

#### 선택 이유
TypeScript는 **정적 타입 시스템**을 제공하여 코드 품질을 크게 향상시킵니다:

1. **타입 안전성**
   - 컴파일 타임에 에러 발견
   - 런타임 에러 감소

2. **IDE 지원**
   - 자동 완성, 타입 힌트
   - 리팩토링 용이

3. **코드 가독성**
   - 인터페이스로 데이터 구조 명확히 정의
   - 함수 시그니처로 입출력 명확화

4. **대규모 프로젝트에 적합**
   - 팀 협업 시 코드 이해 용이
   - 유지보수성 향상

#### 타입 정의 예시

```typescript
// types/index.ts

interface Idea {
  id?: string;
  title: string;
  summary?: string;
  description: string;
  coretech?: string[];
  target: string;
  estimatedCost?: number;        // 만원 단위
  developmentTime?: number;      // 주 단위
  difficulty?: number;           // 1-5
  marketPotential?: number;      // 1-5
  competition?: number;          // 1-5
  firstStep?: string;
  techStack?: string;
  keyFeatures?: string[];
  challenges?: string[];
  successFactors?: string[];
  createdAt?: Date;
}

interface IdeaPlan {
  id?: string;
  project_name: string;
  service_summary: string;
  created_date: string;
  // ... 더 많은 필드
}
```

---

### 3.1.4 Tailwind CSS 3.4

**버전**: `^3.4.1`

#### 선택 이유
Tailwind CSS는 **유틸리티 우선 CSS 프레임워크**로, 다음과 같은 장점이 있습니다:

1. **빠른 개발 속도**
   - HTML에서 직접 스타일 지정
   - 별도 CSS 파일 작성 불필요
   - 클래스 조합으로 빠른 프로토타이핑

2. **일관된 디자인 시스템**
   - 색상, 간격, 크기 등 표준화
   - 팀 협업 시 스타일 일관성 유지

3. **반응형 디자인 용이**
   - `sm:`, `md:`, `lg:` 접두사로 브레이크포인트 지정
   - 모바일 우선 디자인 구현 쉬움

4. **번들 크기 최적화**
   - 사용하지 않는 CSS 자동 제거 (PurgeCSS)
   - 프로덕션 빌드 시 최소화

5. **커스터마이징 가능**
   - `tailwind.config.ts`로 디자인 토큰 정의
   - 프로젝트 브랜드에 맞춘 색상, 폰트 등 설정

#### NALO의 Tailwind 커스터마이징

```typescript
// tailwind.config.ts

export default {
  theme: {
    extend: {
      colors: {
        'nalo-primary': '#2563eb',      // blue-600
        'nalo-secondary': '#3b82f6',    // blue-500
        'nalo-accent': '#60a5fa',       // blue-400
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
}
```

#### 사용 예시

```tsx
<div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
  <h2 className="text-2xl font-bold text-nalo-primary mb-4">
    프로젝트 제목
  </h2>
  <p className="text-gray-600 leading-relaxed">
    설명 텍스트
  </p>
  <button className="mt-4 px-6 py-2 bg-nalo-primary text-white rounded-md hover:bg-nalo-secondary transition-colors">
    자세히 보기
  </button>
</div>
```

---

### 3.1.5 ReactFlow 11

**버전**: `^11.11.4`

#### 선택 이유
ReactFlow는 **노드 기반 그래프 시각화 라이브러리**로, 마인드맵 기능 구현에 핵심적입니다:

1. **강력한 노드/엣지 시스템**
   - 노드와 연결선을 자유롭게 구성
   - 커스텀 노드 타입 정의 가능
   - 드래그 앤 드롭 지원

2. **성능 최적화**
   - 대규모 그래프도 부드럽게 렌더링
   - 가상화 (Virtualization) 지원

3. **TypeScript 지원**
   - 타입 안전한 노드/엣지 정의

4. **플러그인 생태계**
   - 미니맵, 컨트롤, 백그라운드 등 다양한 플러그인

#### NALO에서의 활용

```typescript
// app/components/MindmapViewer.tsx

import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background
} from 'reactflow';

const MindmapViewer = () => {
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: 'root',
      data: { label: '중심 아이디어' },
      position: { x: 250, y: 0 },
      type: 'root'
    },
    // ... 더 많은 노드
  ]);

  const [edges, setEdges] = useState<Edge[]>([
    { id: 'e1-2', source: 'root', target: 'node1' },
    // ... 더 많은 엣지
  ]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
    >
      <Controls />
      <Background />
    </ReactFlow>
  );
};
```

---

### 3.1.6 Lucide React

**버전**: `^0.542.0`

#### 선택 이유
Lucide React는 **아름다운 오픈소스 아이콘 라이브러리**입니다:

1. **방대한 아이콘 컬렉션**
   - 1,000개 이상의 아이콘
   - 일관된 디자인 스타일

2. **React 네이티브**
   - React 컴포넌트로 제공
   - Props로 크기, 색상 조정 용이

3. **Tree Shaking 지원**
   - 사용하는 아이콘만 번들에 포함
   - 번들 크기 최소화

4. **Feather Icons 호환**
   - Feather Icons의 후속 프로젝트
   - 더 많은 아이콘과 기능

#### 사용 예시

```tsx
import {
  Lightbulb,
  Search,
  Download,
  Trash2,
  Plus
} from 'lucide-react';

<button className="flex items-center gap-2">
  <Lightbulb size={20} />
  아이디어 생성
</button>

<Search className="text-gray-400" size={24} />
```

---

## 3.2 백엔드 & 인프라

### 3.2.1 Next.js API Routes (서버리스)

#### 선택 이유
Next.js의 **API Routes**는 별도 백엔드 서버 없이 서버리스 함수를 제공합니다:

1. **통합 개발 환경**
   - 프론트엔드와 백엔드를 한 프로젝트에서 관리
   - 타입 공유로 타입 안전성 확보

2. **서버리스 아키텍처**
   - 자동 스케일링 (트래픽에 따라 자동 확장)
   - 비용 효율적 (사용한 만큼만 과금)
   - 서버 관리 불필요

3. **Vercel 최적화**
   - Vercel 배포 시 Edge Functions로 변환 가능
   - 전 세계 CDN을 통한 빠른 응답

4. **간단한 API 구조**
   - 파일 시스템 기반 라우팅
   - RESTful API 쉽게 구현

#### API 구조

```
app/api/
├── generate/
│   └── route.ts              # POST /api/generate
├── ideas/
│   ├── route.ts              # GET, POST /api/ideas
│   └── [id]/
│       ├── route.ts          # GET, DELETE /api/ideas/[id]
│       └── plan/
│           └── route.ts      # POST /api/ideas/[id]/plan
├── mindmap/
│   ├── auto-setup/
│   │   └── route.ts          # POST /api/mindmap/auto-setup
│   ├── chat/
│   │   └── route.ts          # POST /api/mindmap/chat (스트리밍)
│   ├── expand/
│   │   └── route.ts          # POST /api/mindmap/expand
│   ├── smart-expand/
│   │   └── route.ts          # POST /api/mindmap/smart-expand
│   └── to-plan/
│       └── route.ts          # POST /api/mindmap/to-plan
└── research/
    ├── route.ts              # POST /api/research (통합)
    ├── wikipedia/
    │   └── route.ts          # POST /api/research/wikipedia
    ├── openalex/
    │   └── route.ts          # POST /api/research/openalex
    └── perplexity/
        └── route.ts          # POST /api/research/perplexity
```

#### API Route 예시

```typescript
// app/api/generate/route.ts

export async function POST(request: Request) {
  try {
    const { prompt, apiKey } = await request.json();

    // 입력 검증
    if (!prompt) {
      return Response.json(
        { success: false, error: '프롬프트를 입력해주세요' },
        { status: 400 }
      );
    }

    // OpenAI API 호출
    const ideas = await generateIdeas(prompt, apiKey);

    // 응답 반환
    return Response.json({
      success: true,
      data: ideas
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json(
      { success: false, error: '아이디어 생성 실패' },
      { status: 500 }
    );
  }
}
```

---

### 3.2.2 Supabase (Backend as a Service)

**버전**: `@supabase/supabase-js ^2.45.4`

#### 선택 이유
Supabase는 **오픈소스 Firebase 대안**으로, 다음과 같은 장점이 있습니다:

1. **PostgreSQL 기반**
   - 강력한 관계형 데이터베이스
   - 복잡한 쿼리 지원
   - JSON 필드 지원 (유연성)

2. **실시간 기능**
   - WebSocket 기반 실시간 데이터 동기화
   - 향후 협업 기능 구현 용이

3. **인증 시스템**
   - 이메일/비밀번호, OAuth (Google, GitHub 등) 지원
   - JWT 기반 보안
   - Row Level Security (RLS)로 데이터 접근 제어

4. **서버리스 함수**
   - Edge Functions 지원 (Deno 기반)
   - 복잡한 로직을 백엔드에서 처리

5. **Storage**
   - 파일 업로드/다운로드 (이미지, PDF 등)
   - CDN 통합

6. **무료 티어**
   - 소규모 프로젝트는 완전 무료
   - 500MB 데이터베이스, 1GB 스토리지

#### Supabase 클라이언트 설정

```typescript
// app/lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### 데이터베이스 헬퍼 함수

```typescript
// 기획서 저장
export async function saveIdeaPlan(plan: IdeaPlan, userId?: string) {
  const { data, error } = await supabase
    .from('idea_plans')
    .insert({
      ...plan,
      user_id: userId,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 기획서 조회
export async function getIdeaPlan(id: string) {
  const { data, error } = await supabase
    .from('idea_plans')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// 사용자별 기획서 목록
export async function getUserIdeaPlans(userId: string) {
  const { data, error } = await supabase
    .from('idea_plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
```

#### Supabase Auth 사용

```typescript
// 로그인
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

// OAuth 로그인
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
});

// 로그아웃
await supabase.auth.signOut();

// 현재 사용자 정보
const { data: { user } } = await supabase.auth.getUser();
```

---

## 3.3 AI & 외부 API

### 3.3.1 OpenAI GPT-4o-mini

**버전**: `openai ^4.67.1`

#### 선택 이유
OpenAI의 **GPT-4o-mini**는 NALO의 핵심 AI 엔진입니다:

1. **비용 효율적**
   - GPT-4 대비 **훨씬 저렴** (입력 $0.15/1M 토큰)
   - 무료 서비스 운영에 적합

2. **빠른 응답 속도**
   - GPT-4 대비 **2-3배 빠름**
   - 실시간 대화에 적합

3. **충분한 성능**
   - 아이디어 생성, 키워드 추출, 기획서 작성 등에 충분한 품질
   - 128K 컨텍스트 윈도우 (긴 문서 처리 가능)

4. **JSON Mode 지원**
   - 구조화된 데이터 생성 용이
   - 파싱 에러 감소

5. **Function Calling**
   - 명령어 기반 마인드맵 편집에 활용 가능
   - 향후 확장성

#### OpenAI API 사용 예시

```typescript
// app/lib/openai.ts

import OpenAI from 'openai';

export async function generateIdeas(
  prompt: string,
  apiKey?: string
): Promise<Idea[]> {
  const openai = new OpenAI({
    apiKey: apiKey || process.env.OPENAI_API_KEY,
  });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: SIMPLE_IDEA_PROMPT
      },
      {
        role: 'user',
        content: prompt
      },
    ],
    temperature: 0.8,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  const responseText = completion.choices[0].message.content;
  const parsed = JSON.parse(responseText);

  // 토큰 사용량 추적
  trackTokenUsage(completion.usage?.total_tokens || 0);

  return parsed.ideas;
}
```

#### 스트리밍 응답 (마인드맵 채팅)

```typescript
// app/api/mindmap/chat/route.ts

export async function POST(request: Request) {
  const { messages, apiKey } = await request.json();

  const openai = new OpenAI({ apiKey });

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    stream: true,
  });

  // Server-Sent Events 방식으로 스트리밍
  const encoder = new TextEncoder();
  const customStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        controller.enqueue(encoder.encode(`data: ${text}\n\n`));
      }
      controller.close();
    },
  });

  return new Response(customStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

### 3.3.2 Perplexity AI

#### 선택 이유
Perplexity AI는 **최신 웹 검색 기반 AI**로, 다음과 같은 장점이 있습니다:

1. **실시간 웹 검색**
   - 최신 정보 반영 (OpenAI는 학습 데이터 기준일까지만)
   - 현재 트렌드, 최신 기사 검색

2. **출처 제공**
   - 답변과 함께 출처 URL 제공
   - 신뢰성 확보

3. **빠른 응답**
   - Sonar 모델은 매우 빠름
   - 리서치 용도로 적합

4. **OpenAI API와 유사한 인터페이스**
   - 통합 용이
   - 코드 재사용 가능

#### Perplexity API 사용 예시

```typescript
// app/api/research/perplexity/route.ts

export async function POST(request: Request) {
  const { query, apiKey } = await request.json();

  const response = await fetch(
    'https://api.perplexity.ai/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'user',
            content: query
          },
        ],
      }),
    }
  );

  const data = await response.json();
  return Response.json({
    success: true,
    data: data.choices[0].message.content
  });
}
```

---

### 3.3.3 OpenAlex (학술 논문 검색)

#### 선택 이유
OpenAlex는 **무료 오픈 학술 데이터베이스**입니다:

1. **방대한 데이터**
   - 2억 개 이상의 학술 논문
   - 지속적으로 업데이트

2. **완전 무료**
   - API 키 불필요
   - 무제한 호출 가능

3. **Google Scholar 대안**
   - Google Scholar API는 공식 미제공
   - OpenAlex는 공식 API 제공

4. **풍부한 메타데이터**
   - 저자, 인용 수, 초록, 출판 정보 등
   - 필터링 및 정렬 용이

#### OpenAlex API 사용 예시

```typescript
// app/api/research/openalex/route.ts

export async function POST(request: Request) {
  const { query } = await request.json();

  const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=10&sort=cited_by_count:desc`;

  const response = await fetch(url);
  const data = await response.json();

  const papers = data.results.map((work: any) => ({
    title: work.title,
    authors: work.authorships.map((a: any) => a.author.display_name).join(', '),
    abstract: work.abstract || 'No abstract available',
    citationCount: work.cited_by_count,
    year: work.publication_year,
    url: work.doi ? `https://doi.org/${work.doi}` : work.id,
  }));

  return Response.json({
    success: true,
    data: papers
  });
}
```

---

### 3.3.4 Wikipedia API

#### 선택 이유
Wikipedia는 **신뢰할 수 있는 무료 백과사전**입니다:

1. **광범위한 정보**
   - 거의 모든 주제에 대한 기본 정보
   - 다국어 지원

2. **무료 API**
   - API 키 불필요
   - 무제한 호출

3. **구조화된 데이터**
   - 요약, 본문, 섹션 등 체계적
   - 파싱 용이

4. **신뢰성**
   - 편집 검증 시스템
   - 출처 명시

#### Wikipedia API 사용 예시

```typescript
// app/api/research/wikipedia/route.ts

export async function POST(request: Request) {
  const { query } = await request.json();

  // 검색
  const searchUrl = `https://ko.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
  const searchResponse = await fetch(searchUrl);
  const searchData = await searchResponse.json();

  const results = [];
  for (const item of searchData.query.search.slice(0, 3)) {
    // 상세 정보 조회
    const pageUrl = `https://ko.wikipedia.org/w/api.php?action=query&pageids=${item.pageid}&prop=extracts&exintro&format=json&origin=*`;
    const pageResponse = await fetch(pageUrl);
    const pageData = await pageResponse.json();

    const page = pageData.query.pages[item.pageid];
    results.push({
      title: page.title,
      extract: page.extract,
      url: `https://ko.wikipedia.org/?curid=${item.pageid}`,
    });
  }

  return Response.json({
    success: true,
    data: results
  });
}
```

---

## 3.4 UI/UX 라이브러리

### 3.4.1 jsPDF & html2canvas

**버전**: `jspdf ^3.0.2`, `html2canvas ^1.4.1`

#### 선택 이유
기획서를 **PDF로 다운로드**하기 위해 사용합니다:

1. **클라이언트 사이드 PDF 생성**
   - 서버 부하 없음
   - 빠른 생성 속도

2. **HTML 기반**
   - 웹 페이지 그대로 PDF화
   - 스타일링 유지

3. **무료 오픈소스**
   - 라이선스 문제 없음

#### 사용 예시

```typescript
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const downloadPDF = async () => {
  const element = document.getElementById('plan-content');
  const canvas = await html2canvas(element, {
    scale: 2, // 고해상도
    useCORS: true,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');

  const imgWidth = 210; // A4 width
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  pdf.save('기획서.pdf');
};
```

---

### 3.4.2 react-markdown & remark-gfm

**버전**: `react-markdown ^10.1.0`, `remark-gfm ^4.0.1`

#### 선택 이유
AI가 생성한 마크다운 텍스트를 **HTML로 렌더링**하기 위해 사용합니다:

1. **React 네이티브**
   - React 컴포넌트로 마크다운 렌더링

2. **GitHub Flavored Markdown (GFM) 지원**
   - 테이블, 체크박스, 취소선 등
   - 일반 마크다운보다 풍부한 표현

3. **보안**
   - XSS 공격 방지
   - 안전한 HTML 렌더링

#### 사용 예시

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  className="prose"
>
  {markdownContent}
</ReactMarkdown>
```

---

### 3.4.3 clsx & tailwind-merge

**버전**: `clsx ^2.1.1`, `tailwind-merge ^3.3.1`

#### 선택 이유
**조건부 클래스**와 **Tailwind 클래스 충돌 해결**을 위해 사용합니다:

1. **clsx**: 조건부 클래스 병합
2. **tailwind-merge**: Tailwind 클래스 충돌 방지

#### 사용 예시

```typescript
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 사용
<div className={cn(
  'px-4 py-2',
  isActive && 'bg-blue-500',
  isDisabled && 'opacity-50 cursor-not-allowed'
)}>
  버튼
</div>
```

---

## 3.5 배포 및 호스팅

### 3.5.1 Vercel

#### 선택 이유
Vercel은 **Next.js의 공식 호스팅 플랫폼**입니다:

1. **Next.js 최적화**
   - 자동 빌드 및 배포
   - Edge Functions 지원
   - 이미지 최적화

2. **자동 CI/CD**
   - Git push 시 자동 배포
   - 프리뷰 배포 (PR마다 별도 URL)

3. **글로벌 CDN**
   - 전 세계 엣지 네트워크
   - 빠른 응답 속도

4. **서버리스 함수**
   - API Routes 자동 서버리스 함수화
   - 자동 스케일링

5. **무료 티어**
   - 개인 프로젝트는 무료
   - 충분한 트래픽 제공

---

## 3.6 개발 도구

### 3.6.1 ESLint

**버전**: `^8`

#### 선택 이유
**코드 품질 유지**를 위한 린터입니다:

1. **일관된 코드 스타일**
2. **잠재적 버그 발견**
3. **Best Practice 강제**

---

### 3.6.2 PostCSS & Autoprefixer

**버전**: `postcss ^8`, `autoprefixer ^10.4.20`

#### 선택 이유
**CSS 호환성 보장**을 위해 사용합니다:

1. **자동 벤더 프리픽스 추가**
   - `-webkit-`, `-moz-` 등 자동 추가
2. **구형 브라우저 지원**

---

## 3.7 기술 스택 요약

| 계층 | 기술 | 역할 |
|-----|------|------|
| **프론트엔드** | Next.js 14 | 풀스택 프레임워크 |
| | React 18 | UI 라이브러리 |
| | TypeScript 5 | 정적 타입 시스템 |
| | Tailwind CSS 3.4 | 스타일링 |
| | ReactFlow 11 | 마인드맵 시각화 |
| | Lucide React | 아이콘 |
| **백엔드** | Next.js API Routes | 서버리스 API |
| | Supabase | BaaS (DB, Auth) |
| **AI** | OpenAI GPT-4o-mini | 아이디어 생성, 기획서 작성 |
| | Perplexity AI | 웹 검색 기반 리서치 |
| | OpenAlex | 학술 논문 검색 |
| | Wikipedia API | 백과사전 검색 |
| **유틸리티** | jsPDF, html2canvas | PDF 생성 |
| | react-markdown | 마크다운 렌더링 |
| | clsx, tailwind-merge | 클래스 병합 |
| **배포** | Vercel | 호스팅 및 CI/CD |
| **개발 도구** | ESLint | 린터 |
| | PostCSS, Autoprefixer | CSS 처리 |

---

**다음 섹션에서는 시스템 아키텍처와 데이터 흐름을 상세히 살펴보겠습니다.**
