# 4. 시스템 아키텍처

## 4.1 전체 시스템 구조

```
┌─────────────────────────────────────────────────────────────┐
│                         사용자 (User)                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Next.js 14 Frontend (Vercel)               │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ 홈 페이지    │  │ 아이디어 목록 │  │ 기획서 상세 페이지│   │
│  │ (page.tsx)  │  │ (/ideas)     │  │ (/plan/[id])    │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │             React 컴포넌트 (13개)                      │  │
│  │  - IdeaGenerator, SimpleTopicExplorer               │  │
│  │  - MindmapViewer (ReactFlow), MindmapChat           │  │
│  │  - ResearchResults, ResultDisplay                   │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│            Next.js API Routes (서버리스 함수, Vercel)          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ /api/generate│  │ /api/ideas   │  │ /api/mindmap     │  │
│  │              │  │ /api/ideas/  │  │ - auto-setup     │  │
│  │              │  │   [id]/plan  │  │ - chat (stream)  │  │
│  └──────────────┘  └──────────────┘  │ - expand         │  │
│                                       │ - smart-expand   │  │
│  ┌──────────────────────────────────┐│ - to-plan        │  │
│  │      /api/research (통합)         │└──────────────────┘  │
│  │  - /api/research/wikipedia       │                      │
│  │  - /api/research/openalex        │                      │
│  │  - /api/research/perplexity      │                      │
│  └──────────────────────────────────┘                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      외부 서비스 계층                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  OpenAI API  │  │ Perplexity   │  │   Supabase       │  │
│  │ GPT-4o-mini  │  │   Sonar AI   │  │  (PostgreSQL)    │  │
│  └──────────────┘  └──────────────┘  │   - Auth         │  │
│                                       │   - DB           │  │
│  ┌──────────────┐  ┌──────────────┐  └──────────────────┘  │
│  │  OpenAlex    │  │  Wikipedia   │                         │
│  │  학술 논문    │  │     API      │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

## 4.2 서버리스 아키텍처

NALO는 **서버리스 아키텍처**를 채택하여 다음과 같은 이점을 얻습니다:

### 장점
1. **자동 스케일링**: 트래픽에 따라 자동으로 인스턴스 증감
2. **비용 효율**: 사용한 만큼만 과금 (유휴 시간 비용 없음)
3. **운영 부담 감소**: 서버 관리, 패치, 모니터링 불필요
4. **빠른 배포**: Git push만으로 즉시 배포
5. **글로벌 분산**: Vercel Edge Network를 통한 전 세계 빠른 응답

### 트레이드오프
1. **콜드 스타트**: 오랜만에 호출 시 초기 지연 (약 1-2초)
2. **실행 시간 제한**: Vercel은 10초 제한 (Hobby), 60초 (Pro)
3. **상태 유지 불가**: 각 요청은 독립적 (세션 저장소 필요 시 외부 DB 활용)

## 4.3 데이터 흐름

### 주제 탐색 플로우 데이터 흐름
```
사용자 입력 (프롬프트)
    ↓
[프론트엔드] 입력 검증
    ↓
[API: /api/extract-keywords] → OpenAI → 키워드 배열 반환
    ↓
[프론트엔드] 키워드 표시
    ↓
[API: /api/topics] → OpenAI → 주제 확장 3개 생성
    ↓
[프론트엔드] 주제 선택 UI (최대 3단계 확장)
    ↓
[API: /api/research] → 병렬 호출:
    ├─ Wikipedia API
    ├─ OpenAlex API
    └─ Perplexity API
    ↓
[API: /api/research] → 리서치 데이터 통합 및 필터링
    ↓
[프론트엔드] 리서치 결과 표시
    ↓
[API: /api/ideas] → OpenAI (리서치 데이터 포함) → 아이디어 3개 생성
    ↓
[프론트엔드] 아이디어 선택
    ↓
[API: /api/ideas/[id]/plan] → OpenAI → 상세 기획서 생성
    ↓
[API: /api/ideas/[id]/plan] → Supabase → 기획서 저장
    ↓
[프론트엔드] 기획서 ID로 리다이렉트 (/plan/[id])
```

### 마인드맵 플로우 데이터 흐름
```
사용자 입력 (프롬프트)
    ↓
[API: /api/mindmap/auto-setup] → OpenAI → 마인드맵 JSON 생성
    ↓
[프론트엔드] ReactFlow로 마인드맵 렌더링
    ↓
[사용자 편집] 수동 편집 or AI 채팅
    ↓
[AI 채팅 선택 시]
    ├─ [API: /api/mindmap/chat] → OpenAI/Perplexity (스트리밍)
    ├─ [프론트엔드] 스트리밍 응답 표시
    ├─ [프론트엔드] 명령어 파싱 ([COMMAND]{...})
    └─ [프론트엔드] 마인드맵 자동 업데이트
    ↓
[스마트 확장 선택 시]
    ├─ [API: /api/mindmap/smart-expand] → Perplexity (웹 검색)
    ├─ [API: /api/mindmap/smart-expand] → OpenAI (하위 아이디어 생성)
    └─ [프론트엔드] 노드 추가
    ↓
[기획서 생성]
    ├─ [프론트엔드] 마인드맵 구조 분석
    ├─ [API: /api/mindmap/to-plan] → OpenAI → 기획서 생성
    ├─ [API: /api/mindmap/to-plan] → Supabase → 저장
    └─ [프론트엔드] 리다이렉트 (/plan/[id])
```

## 4.4 컴포넌트 간 관계

```
App (app/layout.tsx)
└─ Page (app/page.tsx)
    ├─ IdeaGenerator (프롬프트 입력)
    │   ├─ ApiKeyInput (API 키 관리)
    │   └─ AuthButton (로그인/로그아웃)
    │
    ├─ SimpleTopicExplorer (주제 탐색)
    │   ├─ ResearchOptionModal (리서치 옵션)
    │   └─ ResearchResults (리서치 결과)
    │       ├─ WikipediaSection
    │       ├─ AcademicSection
    │       ├─ PerplexitySection
    │       └─ ComprehensiveAnalysis
    │
    ├─ MindmapViewer (마인드맵 편집)
    │   ├─ ReactFlow (노드 시각화)
    │   │   ├─ Controls
    │   │   └─ Background
    │   └─ MindmapChat (AI 채팅)
    │
    └─ ResultDisplay (아이디어 결과)

Ideas Page (app/ideas/page.tsx)
├─ AuthButton
└─ Idea Card 리스트 (페이지네이션)

Plan Detail Page (app/plan/[id]/page.tsx)
├─ AuthButton
└─ Plan Content (PDF 다운로드 버튼)
```

---

# 5. 주요 워크플로우 상세

## 5.1 주제 탐색 플로우

### 단계 1: 키워드 추출
```typescript
// /api/extract-keywords 호출
const response = await fetch('/api/extract-keywords', {
  method: 'POST',
  body: JSON.stringify({ prompt: "친환경 배달 서비스" }),
});
// 결과: ["친환경", "배달", "서비스", "전기차", "포장"]
```

### 단계 2: 주제 확장
```typescript
// /api/topics 호출
const response = await fetch('/api/topics', {
  method: 'POST',
  body: JSON.stringify({
    keywords: ["친환경", "배달"],
    existingTopics: [],
  }),
});
// 결과: [
//   "전기 자전거 배달 플랫폼",
//   "재사용 가능한 포장 시스템",
//   "탄소 발자국 추적 앱"
// ]
```

### 단계 3: 리서치 실행
```typescript
// /api/research 호출 (통합 리서치)
const response = await fetch('/api/research', {
  method: 'POST',
  body: JSON.stringify({
    topic: "전기 자전거 배달 플랫폼",
    researchOptions: {
      wikipedia: true,
      academic: true,
      perplexity: true,
    },
  }),
});
// 결과: {
//   wikipedia: [...],
//   academic: [...],
//   perplexity: { content: "...", sources: [...] }
// }
```

### 단계 4: 아이디어 생성
```typescript
// /api/ideas 호출 (리서치 데이터 포함)
const response = await fetch('/api/ideas', {
  method: 'POST',
  body: JSON.stringify({
    topic: "전기 자전거 배달 플랫폼",
    researchData: { ... },
  }),
});
// 결과: [아이디어 3개]
```

---

## 5.2 마인드맵 플로우

### 단계 1: 자동 마인드맵 생성
```typescript
// /api/mindmap/auto-setup 호출
const response = await fetch('/api/mindmap/auto-setup', {
  method: 'POST',
  body: JSON.stringify({
    prompt: "AI 학습 도우미 플랫폼",
  }),
});
// 결과: {
//   rootNode: { id: 'root', label: 'AI 학습 도우미' },
//   childNodes: [
//     { id: '1', label: '개인 맞춤형 학습 경로', parentId: 'root' },
//     ...
//   ]
// }
```

### 단계 2: AI 채팅 기반 편집
```typescript
// /api/mindmap/chat 호출 (스트리밍)
const response = await fetch('/api/mindmap/chat', {
  method: 'POST',
  body: JSON.stringify({
    messages: [
      { role: 'user', content: '게임화 요소를 추가해줘' }
    ],
    mindmapState: { nodes, edges },
  }),
});

// 스트리밍 응답 처리
const reader = response.body.getReader();
let accumulatedText = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = new TextDecoder().decode(value);
  accumulatedText += text;

  // 화면에 실시간 표시
  setChatResponse(accumulatedText);
}

// 명령어 파싱
const commandMatch = accumulatedText.match(/\[COMMAND\](\{.*?\})/);
if (commandMatch) {
  const command = JSON.parse(commandMatch[1]);
  executeCommand(command); // 마인드맵 업데이트
}
```

### 단계 3: 스마트 확장
```typescript
// /api/mindmap/smart-expand 호출
const response = await fetch('/api/mindmap/smart-expand', {
  method: 'POST',
  body: JSON.stringify({
    nodeLabel: "블록체인 보안",
    nodeId: "node-5",
  }),
});
// 결과: {
//   newNodes: [
//     { label: '스마트 컨트랙트 감사' },
//     { label: '다중 서명 지갑' },
//     ...
//   ]
// }
```

---

# 6. API 설계

## 6.1 API 엔드포인트 목록

| 엔드포인트 | 메서드 | 설명 | 인증 필요 |
|-----------|--------|------|----------|
| `/api/generate` | POST | 직접 아이디어 생성 | ❌ |
| `/api/ideas` | POST | 주제 기반 아이디어 생성 | ❌ |
| `/api/ideas` | GET | 저장된 기획서 목록 조회 | ⚠️ 선택 |
| `/api/ideas/[id]` | GET | 특정 기획서 조회 | ❌ |
| `/api/ideas/[id]` | DELETE | 기획서 삭제 | ✅ |
| `/api/ideas/[id]/plan` | POST | 상세 기획서 생성 | ⚠️ 선택 |
| `/api/mindmap/auto-setup` | POST | 자동 마인드맵 생성 | ❌ |
| `/api/mindmap/chat` | POST | AI 채팅 (스트리밍) | ❌ |
| `/api/mindmap/expand` | POST | 노드 확장 | ❌ |
| `/api/mindmap/smart-expand` | POST | 스마트 확장 (웹 검색) | ❌ |
| `/api/mindmap/to-plan` | POST | 마인드맵 → 기획서 | ⚠️ 선택 |
| `/api/research` | POST | 통합 리서치 | ❌ |
| `/api/research/wikipedia` | POST | Wikipedia 검색 | ❌ |
| `/api/research/openalex` | POST | 학술 논문 검색 | ❌ |
| `/api/research/perplexity` | POST | Perplexity 웹 리서치 | ❌ |
| `/api/extract-keywords` | POST | 키워드 추출 | ❌ |
| `/api/topics` | POST | 주제 확장 생성 | ❌ |

## 6.2 RESTful 설계 원칙

1. **HTTP 메서드 활용**
   - GET: 조회
   - POST: 생성
   - DELETE: 삭제
   - (PUT/PATCH: 향후 업데이트 기능 추가 시)

2. **명확한 리소스 경로**
   - `/api/ideas` - 아이디어 컬렉션
   - `/api/ideas/[id]` - 특정 아이디어
   - `/api/ideas/[id]/plan` - 아이디어의 상세 기획서

3. **일관된 응답 형식**
   ```typescript
   // 성공
   { success: true, data: any, message?: string }

   // 실패
   { success: false, error: string, details?: any }
   ```

## 6.3 에러 처리

### HTTP 상태 코드
- `200 OK`: 성공
- `201 Created`: 생성 성공
- `400 Bad Request`: 잘못된 요청 (입력 검증 실패)
- `401 Unauthorized`: 인증 필요
- `403 Forbidden`: 권한 없음
- `404 Not Found`: 리소스 없음
- `500 Internal Server Error`: 서버 오류

### 에러 응답 예시
```typescript
// 입력 검증 실패
{
  success: false,
  error: '프롬프트를 입력해주세요',
  details: { field: 'prompt', message: 'Required' }
}

// API 키 오류
{
  success: false,
  error: 'OpenAI API 키가 유효하지 않습니다',
  details: { code: 'INVALID_API_KEY' }
}

// 서버 오류
{
  success: false,
  error: '아이디어 생성 중 오류가 발생했습니다',
  details: { message: error.message }
}
```

---

# 7. 데이터베이스 설계

## 7.1 Supabase (PostgreSQL) 스키마

### 테이블: `idea_plans`

기획서 데이터를 저장하는 메인 테이블입니다.

```sql
CREATE TABLE idea_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 기본 정보
  project_name TEXT NOT NULL,
  service_summary TEXT,
  created_date TEXT NOT NULL,
  project_type TEXT,

  -- 프로젝트 개요
  core_idea TEXT,
  background TEXT,
  target_customer TEXT,

  -- 문제 정의 및 솔루션
  problem_to_solve TEXT,
  proposed_solution TEXT,

  -- 목표 및 지표
  main_objectives TEXT[],           -- 배열
  success_metrics TEXT[],            -- 배열

  -- 기능 명세
  features JSONB,                    -- JSON 배열
  key_features TEXT[],               -- 배열

  -- 기술 스택
  tech_stack TEXT,
  system_architecture TEXT,
  database_type TEXT,

  -- 예산 및 비용
  development_cost INTEGER,          -- 만원 단위
  operation_cost INTEGER,            -- 월별, 만원
  marketing_cost INTEGER,            -- 만원
  other_cost INTEGER,                -- 만원

  -- 일정
  development_time INTEGER,          -- 주 단위

  -- 리스크 분석
  risk_factors TEXT[],               -- 배열
  risk_response TEXT,
  contingency_plan TEXT,

  -- 메타 데이터
  input_keywords TEXT[],             -- 검색에 사용된 키워드
  search_query TEXT,

  -- 인증 및 소유권
  user_id UUID REFERENCES auth.users(id),
  author_email TEXT,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_idea_plans_user_id ON idea_plans(user_id);
CREATE INDEX idx_idea_plans_created_at ON idea_plans(created_at DESC);
CREATE INDEX idx_idea_plans_project_name ON idea_plans(project_name);
```

### 테이블: `trends`

트렌드 키워드 캐싱용 테이블입니다.

```sql
CREATE TABLE trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  search_volume INTEGER,
  category TEXT,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_trends_keyword ON trends(keyword);
CREATE INDEX idx_trends_created_at ON trends(created_at DESC);
```

### 테이블: `usage_logs`

API 사용량 추적용 테이블입니다.

```sql
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_type TEXT NOT NULL,           -- 'openai', 'perplexity', 'supabase'
  tokens_used INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_usage_logs_api_type ON usage_logs(api_type);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at DESC);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
```

## 7.2 Row Level Security (RLS)

Supabase의 RLS를 활용하여 데이터 접근을 제어합니다.

```sql
-- idea_plans 테이블 RLS 정책

-- 모든 사용자가 조회 가능 (공개)
CREATE POLICY "Anyone can view plans"
ON idea_plans FOR SELECT
USING (true);

-- 인증된 사용자만 생성 가능
CREATE POLICY "Authenticated users can create plans"
ON idea_plans FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 소유자만 삭제 가능
CREATE POLICY "Users can delete their own plans"
ON idea_plans FOR DELETE
USING (auth.uid() = user_id);

-- 소유자만 업데이트 가능
CREATE POLICY "Users can update their own plans"
ON idea_plans FOR UPDATE
USING (auth.uid() = user_id);
```

## 7.3 데이터 관계도

```
auth.users (Supabase Auth)
    │
    │ 1:N
    ↓
idea_plans (기획서)

usage_logs (사용량 로그)
    │
    │ N:1
    ↓
auth.users (선택적)
```

---

# 8. 주요 컴포넌트 및 구현

## 8.1 MindmapViewer (마인드맵 편집기)

**파일**: `/app/components/MindmapViewer.tsx` (134KB, 가장 큰 컴포넌트)

### 주요 기능
1. **노드 관리**: 추가, 삭제, 수정, 이동, 병합
2. **AI 채팅**: 자연어로 마인드맵 편집
3. **스마트 확장**: 웹 검색 기반 노드 확장
4. **저장/불러오기**: JSON 형식 저장
5. **기획서 생성**: 마인드맵 → 기획서 변환

### 핵심 코드

```typescript
// 노드 타입 정의
type NodeData = {
  label: string;
  color?: string;
};

type CustomNode = Node<NodeData>;

// 상태 관리
const [nodes, setNodes] = useState<CustomNode[]>([]);
const [edges, setEdges] = useState<Edge[]>([]);

// AI 채팅 기반 편집
const executeMindmapCommand = (command: MindmapCommand) => {
  switch (command.action) {
    case 'ADD_NODE':
      setNodes([...nodes, {
        id: generateId(),
        data: { label: command.label },
        position: { x: 0, y: 0 },
      }]);
      break;

    case 'DELETE_NODE':
      setNodes(nodes.filter(n => n.id !== command.nodeId));
      setEdges(edges.filter(e =>
        e.source !== command.nodeId && e.target !== command.nodeId
      ));
      break;

    // ... 더 많은 액션
  }
};
```

---

## 8.2 MindmapChat (AI 채팅 인터페이스)

**파일**: `/app/components/MindmapChat.tsx`

### 주요 기능
1. **스트리밍 응답**: 실시간 텍스트 표시
2. **명령어 파싱**: `[COMMAND]{...}` 형식 추출
3. **대화 히스토리**: 컨텍스트 유지
4. **AI 모델 선택**: OpenAI vs Perplexity

### 스트리밍 처리 코드

```typescript
const sendMessage = async (message: string) => {
  const response = await fetch('/api/mindmap/chat', {
    method: 'POST',
    body: JSON.stringify({ messages: [...history, { role: 'user', content: message }] }),
  });

  const reader = response.body.getReader();
  let accumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = new TextDecoder().decode(value);
    accumulated += chunk;
    setResponse(accumulated); // 실시간 업데이트
  }

  // 명령어 추출
  const commandMatch = accumulated.match(/\[COMMAND\](\{.*?\})/g);
  if (commandMatch) {
    commandMatch.forEach(cmd => {
      const json = cmd.replace('[COMMAND]', '');
      const parsed = JSON.parse(json);
      onCommand(parsed); // 마인드맵 업데이트
    });
  }
};
```

---

## 8.3 ResearchResults (리서치 통합 컴포넌트)

**파일**: `/app/components/ResearchResults.tsx`

### 주요 기능
1. **다중 소스 통합 표시**: Wikipedia, OpenAlex, Perplexity
2. **탭 네비게이션**: 소스별 탭
3. **통합 분석**: 모든 리서치 데이터 종합

### 구조

```tsx
<ResearchResults data={researchData}>
  <Tabs>
    <Tab label="종합 분석">
      <ComprehensiveAnalysis data={researchData} />
    </Tab>
    <Tab label="Wikipedia">
      <WikipediaSection results={researchData.wikipedia} />
    </Tab>
    <Tab label="학술 논문">
      <AcademicSection results={researchData.academic} />
    </Tab>
    <Tab label="웹 리서치">
      <PerplexitySection result={researchData.perplexity} />
    </Tab>
  </Tabs>
</ResearchResults>
```

---

# 9. AI 통합 및 프롬프트 엔지니어링

## 9.1 프롬프트 템플릿

NALO는 **3가지 프롬프트 템플릿**을 사용합니다:

### 1. SIMPLE_IDEA_PROMPT
- 간단한 아이디어 생성용
- 약 50줄
- 필드: title, description, target, techStack 등

### 2. IDEA_PLAN_PROMPT (표준)
- 실무용 기획서 생성
- **243줄**의 상세한 프롬프트
- 리서치 데이터 통합 지원
- 모든 필드 포함

### 3. DETAILED_PROJECT_PROMPT (초상세)
- 투자 유치용, IR 자료
- **365줄**의 초상세 프롬프트
- 시장 분석, 경쟁 분석, 재무 계획 포함

## 9.2 프롬프트 엔지니어링 기법

### 1. **Few-Shot Learning**
```typescript
const prompt = `
다음은 좋은 아이디어 예시입니다:

[예시 1]
{
  "title": "AI 기반 식단 추천 앱",
  "description": "사용자의 건강 데이터를 분석하여...",
  ...
}

[예시 2]
{
  "title": "스마트 에너지 관리 시스템",
  ...
}

이제 다음 주제로 아이디어를 생성해주세요:
주제: ${userPrompt}
`;
```

### 2. **Chain of Thought (사고 과정)**
```typescript
const prompt = `
1단계: 주제의 본질을 파악하세요.
2단계: 타겟 사용자를 정의하세요.
3단계: 해결할 문제를 명확히 하세요.
4단계: 솔루션을 구체화하세요.
5단계: 기술 스택을 선정하세요.

주제: ${userPrompt}
`;
```

### 3. **JSON Mode 활용**
```typescript
// OpenAI JSON Mode
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [...],
  response_format: { type: 'json_object' }, // JSON 보장
});
```

### 4. **Temperature 조절**
```typescript
// 창의적 아이디어 생성 (높은 온도)
temperature: 0.8

// 구조화된 데이터 생성 (낮은 온도)
temperature: 0.3
```

## 9.3 응답 검증 및 파싱

### JSON 파싱 강화
```typescript
// /app/lib/openai.ts

function cleanAndParseJson(text: string) {
  // Markdown 코드 블록 제거
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');

  // 앞뒤 공백 제거
  cleaned = cleaned.trim();

  // 잘못된 이스케이프 수정
  cleaned = cleaned.replace(/\\n/g, ' ');

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    // 추가 정리 시도
    const match = cleaned.match(/\{.*\}/s);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw error;
  }
}
```

### 응답 검증
```typescript
function validateIdeaPlanResponse(data: any) {
  const required = [
    'project_name',
    'service_summary',
    'core_idea',
    'features',
  ];

  for (const field of required) {
    if (!data[field]) {
      throw new Error(`필수 필드 누락: ${field}`);
    }
  }

  return true;
}
```

---

# 10. 성능 최적화

## 10.1 API 호출 최적화

### 병렬 처리
```typescript
// 리서치 API에서 3개 소스 병렬 호출
const [wikipediaResults, openalexResults, perplexityResult] =
  await Promise.all([
    searchWikipedia(keywords),
    searchOpenAlex(keywords),
    searchPerplexity(query),
  ]);
```

### 캐싱 전략
```typescript
// Supabase에 트렌드 키워드 캐싱
const cachedTrends = await getTrendKeywords(category);
if (cachedTrends && isRecent(cachedTrends.created_at)) {
  return cachedTrends; // 캐시 사용
}

// 캐시 없으면 새로 생성
const newTrends = await generateTrends(category);
await saveTrendKeywords(newTrends);
return newTrends;
```

## 10.2 토큰 사용량 관리

### 일일 토큰 제한
```typescript
// /app/lib/openai.ts

const DAILY_TOKEN_LIMIT = 2_000_000; // 200만 토큰/일

let dailyTokenUsage = 0;
let lastResetDate = new Date().toDateString();

function trackTokenUsage(tokens: number) {
  const today = new Date().toDateString();

  // 날짜 변경 시 리셋
  if (today !== lastResetDate) {
    dailyTokenUsage = 0;
    lastResetDate = today;
  }

  dailyTokenUsage += tokens;

  // 제한 초과 체크
  if (dailyTokenUsage > DAILY_TOKEN_LIMIT) {
    throw new Error('일일 토큰 사용량 초과');
  }
}
```

### 토큰 절약 기법
1. **GPT-4o-mini 사용**: GPT-4 대비 15배 저렴
2. **max_tokens 제한**: 불필요한 긴 응답 방지
3. **시스템 메시지 최적화**: 짧고 명확하게
4. **컨텍스트 압축**: 불필요한 정보 제거

## 10.3 프론트엔드 최적화

### 코드 스플리팅
```typescript
// jsPDF는 사용 시에만 로드
const jsPDF = await import('jspdf');
const html2canvas = await import('html2canvas');
```

### 이미지 최적화
```tsx
import Image from 'next/image';

<Image
  src="/logo.png"
  width={200}
  height={50}
  alt="NALO"
  loading="lazy"
/>
```

---

# 11. 개발 환경 및 배포

## 11.1 개발 환경 설정

### 필수 도구
- Node.js 18+ (20 권장)
- npm 또는 yarn
- Git
- VS Code (권장 IDE)

### 환경 변수 설정
```bash
# .env.local

# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...

# Perplexity (선택)
PERPLEXITY_API_KEY=pplx-...
```

### 로컬 실행
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:3000 접속
```

## 11.2 Git 워크플로우

```
main (프로덕션 브랜치)
  ↑
  ├─ feature/mindmap-chat (기능 개발)
  ├─ feature/research-integration
  ├─ bugfix/pdf-download-issue
  └─ ...
```

### 커밋 컨벤션
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 스타일 변경 (포매팅 등)
refactor: 리팩토링
test: 테스트 추가/수정
chore: 빌드, 설정 변경
```

## 11.3 Vercel 배포

### 자동 배포 흐름
```
1. Git push to main
    ↓
2. Vercel이 자동 감지
    ↓
3. 빌드 시작 (npm run build)
    ↓
4. 빌드 성공
    ↓
5. 프로덕션 배포
    ↓
6. URL: https://nalo.vercel.app
```

### 환경 변수 설정 (Vercel)
1. Vercel 대시보드 접속
2. 프로젝트 선택
3. Settings → Environment Variables
4. `.env.local`의 변수들 추가
5. Production, Preview, Development 선택

### 프리뷰 배포
```
1. 새 브랜치에서 작업
    ↓
2. Pull Request 생성
    ↓
3. Vercel이 자동으로 프리뷰 배포
    ↓
4. PR에 프리뷰 URL 댓글로 추가
    ↓
5. 테스트 후 Merge
```

---

# 12. 프로젝트 통계 및 규모

## 12.1 코드 통계

- **총 파일 수**: 40+ 파일 (TypeScript/TSX)
- **총 코드 라인**: 약 10,000줄 이상
- **API 라우트**: 14개
- **React 컴포넌트**: 13개
- **페이지**: 4개 (홈, 아이디어 목록, 기획서 상세, 로그인)
- **가장 큰 파일**: `MindmapViewer.tsx` (134KB), `openai.ts` (1,478줄)

## 12.2 파일 구조

```
app/
├── api/ (14개 라우트)
│   ├── generate/
│   ├── ideas/
│   ├── mindmap/ (5개 하위 라우트)
│   ├── research/ (4개 하위 라우트)
│   ├── extract-keywords/
│   └── topics/
├── components/ (13개 컴포넌트)
│   ├── IdeaGenerator.tsx
│   ├── SimpleTopicExplorer.tsx
│   ├── MindmapViewer.tsx (134KB)
│   ├── MindmapChat.tsx
│   ├── ResearchResults.tsx
│   ├── research/ (4개 서브 컴포넌트)
│   └── ...
├── lib/
│   ├── openai.ts (1,478줄, 핵심 AI 로직)
│   ├── project-templates.ts (608줄, 프롬프트 템플릿)
│   ├── supabase.ts (DB 헬퍼)
│   └── apiKeyStorage.ts
├── ideas/ (페이지)
├── plan/[id]/ (동적 페이지)
├── login/ (페이지)
├── auth/ (인증 콜백)
├── globals.css
├── layout.tsx
└── page.tsx
```

## 12.3 의존성

- **dependencies**: 15개
- **devDependencies**: 7개
- **총 패키지**: 22개

## 12.4 개발 기간 및 인원

- **개발 기간**: 추정 2-3개월
- **개발 인원**: 1-2명 (추정)
- **주요 언어**: TypeScript (100%)

---

# 13. 향후 계획

## 13.1 단기 계획 (1-3개월)

### 기능 개선
- [ ] **협업 기능**: 팀 프로젝트 공유, 실시간 협업 편집
- [ ] **템플릿 다양화**: 산업별, 프로젝트 유형별 템플릿
- [ ] **더 많은 리서치 소스**: Google Scholar, arXiv, 특허 검색
- [ ] **AI 모델 확장**: Claude, Gemini 등 다양한 모델 지원
- [ ] **마인드맵 내보내기**: PNG, SVG, PDF 형식 지원

### UI/UX 개선
- [ ] **다크 모드**: 사용자 선택 가능
- [ ] **모바일 최적화**: 터치 인터페이스 개선
- [ ] **키보드 단축키**: 파워 유저를 위한 단축키
- [ ] **튜토리얼**: 신규 사용자 온보딩
- [ ] **애니메이션 개선**: 부드러운 전환 효과

### 성능 개선
- [ ] **Edge Functions**: Vercel Edge Functions로 전환 (더 빠른 응답)
- [ ] **Redis 캐싱**: 자주 사용되는 데이터 캐싱
- [ ] **이미지 CDN**: 정적 리소스 최적화

## 13.2 중기 계획 (3-6개월)

### 비즈니스 모델
- [ ] **프리미엄 플랜**: 고급 AI 모델, 무제한 생성, 우선 지원
- [ ] **팀 플랜**: 협업 기능 강화, 멤버 관리
- [ ] **API 제공**: 개발자들이 NALO API를 사용할 수 있도록

### 고급 기능
- [ ] **아이디어 평가 시스템**: AI 기반 시장성, 실현 가능성 자동 분석
- [ ] **프로젝트 추적**: 기획 → 개발 → 런칭까지 진행 상황 관리
- [ ] **AI 멘토링**: 프로젝트 진행 중 AI가 조언 제공
- [ ] **마켓플레이스**: 아이디어 사고팔기, 개발자 매칭

### 다국어 지원
- [ ] **영어**: 글로벌 진출
- [ ] **일본어, 중국어**: 아시아 시장

## 13.3 장기 계획 (1년 이상)

### 플랫폼 확장
- [ ] **프로젝트 매칭**: 아이디어 - 개발자 - 투자자 연결
- [ ] **펀딩 통합**: 크라우드펀딩 플랫폼 연동
- [ ] **교육 콘텐츠**: 아이디어 구체화, 기획서 작성 강의

### AI 에이전트
- [ ] **프로젝트 관리 에이전트**: 자동으로 일정 관리, 리마인더
- [ ] **시장 분석 에이전트**: 실시간 시장 동향 분석
- [ ] **기술 자문 에이전트**: 기술 스택 추천, 아키텍처 제안

### 생태계 구축
- [ ] **오픈 소스 커뮤니티**: 템플릿, 플러그인 공유
- [ ] **파트너십**: 개발 도구, 클라우드 서비스 연동
- [ ] **대학 협력**: 교육 기관과 협력하여 학생들에게 제공

## 13.4 기술 부채 해결

- [ ] **테스트 코드**: 유닛 테스트, E2E 테스트 추가
- [ ] **타입 개선**: any 타입 제거, 더 엄격한 타입 정의
- [ ] **에러 핸들링**: 더 세밀한 에러 처리 및 로깅
- [ ] **문서화**: API 문서, 컴포넌트 Storybook
- [ ] **접근성**: WCAG 2.1 AA 준수

---

**NALO는 계속 진화하는 플랫폼입니다. 사용자 피드백을 반영하여 지속적으로 개선해 나가겠습니다.**
