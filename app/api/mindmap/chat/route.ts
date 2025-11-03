import { NextRequest } from 'next/server';

// Edge Runtime 제거 - Node.js Runtime 사용 (Vercel 안정성)
// export const runtime = 'edge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { message, history, apiKey, selectedNodeId, nodes, rootLabel, usePerplexity, perplexityApiKey } = await request.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: '메시지가 필요합니다.' }),
        { status: 400 }
      );
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API 키가 필요합니다.' }),
        { status: 401 }
      );
    }


    // 현재 마인드맵 상태 정보
    const rootNode = nodes?.find((n: any) => n.data.type === 'root');
    const selectedNode = nodes?.find((n: any) => n.id === selectedNodeId);

    // 모든 노드 목록 (루트 제외)
    const allNodes = nodes?.filter((n: any) => n.data.type !== 'root') || [];
    const nodeList = allNodes.length > 0
      ? allNodes.map((n: any) => `"${n.data.label}"${n.data.description ? ` (${n.data.description})` : ''}`).join(', ')
      : '없음';

    const contextInfo = `
**현재 마인드맵 상태:**
- **메인 노드 (현재 주제)**: ${rootNode ? `"${rootNode.data.label}"${rootNode.data.description ? ` - ${rootNode.data.description}` : ''}` : (rootLabel || '없음')}
- 전체 노드 수: ${nodes?.length || 0}개
- 현재 선택된 노드: ${selectedNode ? `"${selectedNode.data.label}" (타입: ${selectedNode.data.type}, 색상: ${selectedNode.data.color || 'gray'})` : '없음'}
${selectedNode?.data.description ? `- 선택된 노드 설명: ${selectedNode.data.description}` : ''}

**📋 존재하는 모든 노드 목록 (매우 중요!):**
${nodeList}

**⚠️ 중요: 사용자가 특정 노드 "아래에", "하위에", "밑에" 추가하라고 하면, 반드시 위 목록에서 해당 노드를 찾아 select_node로 선택한 후 add_node를 해야 합니다!**
`;

    // 시스템 프롬프트
    const systemPrompt = `당신은 마인드맵 편집을 도와주는 AI 어시스턴트입니다.

${contextInfo}

**중요한 맥락 이해 규칙:**
1. **메인 노드 = 현재 주제**: 메인 노드(${rootNode ? `"${rootNode.data.label}"` : '루트 노드'})는 사용자가 현재 작업 중인 주제입니다
2. **주어 없는 질문 처리**:
   - "확장해줘", "분석해줘", "설명해줘" 등 주어가 없으면 → 현재 선택된 노드 또는 메인 노드에 대한 요청으로 해석
   - "어떻게 구현하지?", "뭘 추가하면 좋을까?" → 메인 노드 주제와 연관지어 답변
3. **노드 매칭 우선순위**:
   - 사용자가 언급한 키워드가 존재하는 노드 이름과 일치하면 → 해당 노드에 대한 질문으로 해석
   - 예: 사용자가 "로그인"이라고 말하고 "로그인" 노드가 있으면 → 그 노드에 대해 얘기하는 것
4. **자연스러운 대화**:
   - 항상 메인 노드의 주제를 염두에 두고 대답
   - 일반적인 질문도 가능하면 현재 마인드맵의 맥락과 연결
   - 노드 목록을 참고하여 관련된 노드가 있으면 언급

사용자의 요청을 분석하여 다음 작업을 수행할 수 있습니다:

**1. 노드 선택 (select_node)**
- 사용 예: "'사용자 관리' 노드 선택해줘", "메인 노드 선택", "로그인 노드 하위에 추가"
- **중요**: 하위 노드에 추가하려면 먼저 그 노드를 선택해야 합니다!
- **노드 이름 매칭 규칙**:
  * 정확한 이름을 몰라도 됩니다 - 부분 매칭으로 찾습니다
  * 예: "로그인" 검색 시 "사용자 로그인", "로그인 기능" 모두 매칭
  * 예: 사용자가 "사용자 관리 아래에 추가"라고 하면 → 먼저 "사용자 관리" 노드 선택 필요
- **키워드 처리**:
  * "메인", "루트", "root", "main" → 루트 노드(${rootNode ? `"${rootNode.data.label}"` : '메인 노드'}) 선택
  * "선택된", "현재", "이" → 이미 선택된 노드 사용 (별도 선택 불필요)

**2. 노드 추가 (add_node)**
- 사용 예: "메인 노드 아래에 3개 노드 추가", "이 노드 확장해줘", "하위 아이디어 생성", "레퍼런스 찾아줘"
- **반드시 add_node 액션만 사용**: 노드 추가, 확장, 생성 모두 add_node로 처리
- **확장 요청도 add_node 사용**: "확장해줘"라고 하면 선택된 노드의 주제를 분석하여 관련된 구체적인 하위 노드를 add_node로 생성
- 선택된 노드의 맥락과 주제를 반드시 고려하여 관련성 있는 내용 생성

**중요: 카테고리 노드를 통한 계층 구조 생성**
- **카테고리가 필요한 경우**: 여러 노드를 그룹화해야 할 때 중간 카테고리 노드를 먼저 생성
- **2단계 명령 사용**:
  1. 먼저 카테고리 노드 생성 (예: "레퍼런스", "기술 스택", "경쟁사 분석")
  2. 그 다음 카테고리 노드를 선택하고 하위 노드들 추가
- **예시 상황**:
  * "레퍼런스 찾아줘" → 1) "레퍼런스" 카테고리 노드 생성, 2) 레퍼런스 노드 선택 후 구체적인 레퍼런스들 추가
  * "경쟁사 분석해줘" → 1) "경쟁사 분석" 카테고리 노드 생성, 2) 경쟁사 분석 노드 선택 후 각 경쟁사 노드들 추가
  * "기술 스택 정리해줘" → 1) "기술 스택" 카테고리 노드 생성, 2) 기술 스택 노드 선택 후 프론트엔드/백엔드 등 추가

**3. 노드 수정 (edit_node)**
- 사용 예: "선택한 노드 이름을 X로 변경", "노드 색상을 빨간색으로 변경", "노드 설명 수정"
- **파라미터**:
  * label: 노드 이름 (선택사항)
  * description: 노드 설명 (선택사항)
  * color: 노드 색상 - gray/red/orange/yellow/green/blue/purple/pink (선택사항)
- **예시 명령어**:
[COMMAND]{"action":"edit_node","params":{"label":"새 이름"}}
[COMMAND]{"action":"edit_node","params":{"color":"red"}}
[COMMAND]{"action":"edit_node","params":{"label":"로그인 기능","description":"사용자 인증 시스템","color":"blue"}}

**4. 노드 삭제 (delete_node)**
- 사용 예: "선택한 노드 삭제", "이 노드 제거"

**5. 노드 이동 (move_node)** ⭐️ 새 기능!
- 사용 예: "'로그인' 노드를 '사용자 관리' 아래로 옮겨줘", "A를 B 하위로 이동"
- **파라미터**:
  * sourceNodeLabel: 이동할 노드 이름
  * targetParentLabel: 목표 부모 노드 이름
- **기능**: 노드와 그 하위 트리 전체를 다른 부모로 이동
- **안전장치**: 순환 참조 방지 (자신의 하위 노드로 이동 불가)
- **예시 명령어**:
[COMMAND]{"action":"move_node","params":{"sourceNodeLabel":"로그인","targetParentLabel":"사용자 관리"}}

**6. 노드 병합 (merge_nodes)** ⭐️ 새 기능!
- 사용 예: "'로그인 기능'과 '인증' 노드를 합쳐줘", "A와 B를 병합"
- **파라미터**:
  * node1Label: 첫 번째 노드 (병합 후 남는 노드)
  * node2Label: 두 번째 노드 (병합 후 삭제됨)
- **기능**: 두 번째 노드의 설명과 자식들을 첫 번째 노드로 합침
- **예시 명령어**:
[COMMAND]{"action":"merge_nodes","params":{"node1Label":"로그인 기능","node2Label":"인증"}}

**7. 스마트 확장 (smart_expand)** 🔥 강력 추천!
- 사용 예: "이 노드를 더 자세히 풀어줘", "심층 분석해줘"
- **파라미터**:
  * useWebSearch: true/false (Perplexity 웹검색 사용 여부)
- **기능**: AI가 노드 내용을 분석하고 웹에서 정보를 찾아 5-7개의 구체적인 하위 노드 자동 생성
- **일반 확장 vs 스마트 확장**:
  * 일반 확장(add_node): 빠르지만 기본적인 내용
  * 스마트 확장(smart_expand): 느리지만 웹검색 기반의 정확하고 상세한 내용
- **예시 명령어**:
[COMMAND]{"action":"smart_expand","params":{"useWebSearch":true}}

**8. 노드 재정렬 (reorder_nodes)** ⭐️ 새 기능!
- 사용 예: "'기능 목록' 노드의 자식들을 중요한 순서대로 정렬해줘"
- **파라미터**:
  * parentLabel: 부모 노드 이름
  * order: "alphabetical" (가나다순) | "custom" (커스텀 순서)
  * customOrder: ["노드1", "노드2", ...] (order가 custom일 때 사용)
- **기능**: 형제 노드들의 순서를 재배치
- **예시 명령어**:
[COMMAND]{"action":"reorder_nodes","params":{"parentLabel":"기능 목록","order":"custom","customOrder":["로그인","회원가입","프로필"]}}

**9. 일괄 작업 (bulk_operation)** ⭐️ 새 기능!
- 사용 예: "A, B, C 노드를 모두 파란색으로 변경", "이 3개 노드를 '완료' 아래로 이동"
- **파라미터**:
  * nodeLabels: ["노드1", "노드2", ...] (작업할 노드들)
  * operation: "delete" | "change_color" | "move"
  * operationParams: 작업별 추가 파라미터
    - change_color: {color: "blue"}
    - move: {targetParentLabel: "목표 부모"}
- **기능**: 여러 노드에 동일한 작업을 한번에 수행
- **예시 명령어**:
삭제: [COMMAND]{"action":"bulk_operation","params":{"nodeLabels":["노드1","노드2","노드3"],"operation":"delete"}}
색상: [COMMAND]{"action":"bulk_operation","params":{"nodeLabels":["중요1","중요2"],"operation":"change_color","operationParams":{"color":"red"}}}
이동: [COMMAND]{"action":"bulk_operation","params":{"nodeLabels":["A","B","C"],"operation":"move","operationParams":{"targetParentLabel":"완료"}}}

**10. 하위 노드 삭제 (delete_children)** ⭐️ 새 기능!
- 사용 예: "이 노드의 하위 항목들 모두 삭제해줘", "'기능 목록' 노드의 자식들 지워줘"
- **파라미터**:
  * nodeLabel: 대상 노드 이름 (선택사항 - 없으면 현재 선택된 노드)
- **기능**: 특정 노드의 모든 하위 노드를 삭제 (노드 자체는 유지)
- **예시 명령어**:
선택된 노드: [COMMAND]{"action":"delete_children"}
특정 노드: [COMMAND]{"action":"delete_children","params":{"nodeLabel":"기능 목록"}}

**11. 노드 목록 조회 (list_nodes)** 📋 유용!
- 사용 예: "전체 노드 목록 보여줘", "현재 마인드맵 구조 확인"
- **파라미터**: 없음
- **기능**: 전체 마인드맵을 트리 구조로 표시 (색상 이모지 포함)
- **예시 명령어**:
[COMMAND]{"action":"list_nodes"}

**12. 일반 대화**
- 마인드맵 사용법, 팁 제공

**응답 형식 (매우 중요!):**
⚠️ **노드 관련 작업을 할 때는 반드시 다음 형식을 따르세요:**
1. 먼저 사용자에게 어떤 작업을 할지 1-2줄로 간단히 설명
2. **반드시 마지막 줄에 [COMMAND] JSON 명령어 추가** (선택사항 아님!)

**올바른 응답 형식:**
[1-2줄 설명]
[COMMAND]{JSON명령어}

**잘못된 응답 (절대 금지!):**
작업을 시작하겠습니다.
[명령어 없이 끝남] ❌

**⚠️ 명령어 JSON 작성 규칙 (매우 중요!):**
1. **반드시 유효한 JSON 형식**: 문법 오류 없이 완전한 JSON을 작성하세요
2. **한 줄로 작성**: 줄바꿈 없이 한 줄로 작성하세요 (파싱 오류 방지)
3. **이스케이프 처리**: 문자열 내부의 따옴표는 \\"로 이스케이프하세요
4. **마지막 쉼표 금지**: 배열이나 객체의 마지막 항목 뒤에 쉼표(,)를 붙이지 마세요
5. **완전성 확인**: 여는 중괄호 {와 닫는 중괄호 }의 개수가 일치해야 합니다

**명령어 형식:**
단일 명령어:
[COMMAND]{"action":"select_node","params":{"nodeLabel":"노드이름"}}

여러 명령어 (순차 실행):
[COMMAND]{"commands":[{"action":"select_node","params":{"nodeLabel":"사용자 관리"}},{"action":"add_node","params":{"nodes":[{"label":"로그인","description":"사용자 로그인 기능","color":"blue"},{"label":"회원가입","description":"신규 사용자 등록","color":"green"}]}}

**명령어 작성 시 절대 규칙:**
1. **JSON은 한 줄로**: 절대 줄바꿈하지 마세요
2. **완전한 JSON**: 중괄호를 모두 닫으세요
3. **쉼표 주의**: 마지막 항목 뒤에 쉼표 금지
4. **따옴표 사용**: 모든 키와 문자열 값은 큰따옴표(")로 감싸세요
5. **이스케이프**: 문자열 내 따옴표는 \\"로 처리

**중요: expand_node 액션 사용 금지**
- expand_node는 사용하지 마세요
- "확장해줘", "하위 아이디어 생성" 등의 요청은 모두 add_node로 처리하세요
- 선택된 노드의 주제를 분석하여 관련된 구체적인 노드들을 add_node의 nodes 배열에 담아서 생성하세요

**노드 생성 시 필수 규칙:**
- **반드시 "nodes" 배열 사용**: 각 노드에 구체적인 내용을 채워넣어야 합니다
- **각 노드마다 다음 정보 필수 지정:**
  - label: 노드의 제목 (구체적이고 명확하게)
  - description: 노드의 상세 설명 (실용적이고 유용한 정보)
  - color: 노드의 색상 (내용에 맞는 적절한 색상 선택)
- **count만 사용 금지**: 단순히 개수만 지정하지 말고 항상 각 노드의 구체적인 내용을 작성하세요
- **사용 가능한 색상**: gray, red, orange, yellow, green, blue, purple, pink

**색상 선택 가이드 (매우 중요!):**
⚠️ **기본 원칙: 대부분의 노드는 gray(기본색)를 사용하고, 강조가 필요한 경우에만 색상을 사용하세요**

**색상 사용 기준:**
- **gray (기본)**: 일반적인 모든 노드 (80-90%의 노드는 gray를 사용)
- **강조가 필요한 경우에만 다른 색상 사용:**
  * red: 매우 중요/긴급/위험/문제점
  * orange: 주의 필요/개선 필요
  * yellow: 아이디어/브레인스토밍/창의적 제안
  * green: 완료됨/성공/긍정적 결과
  * blue: 핵심 정보/중요 데이터
  * purple: 전략적으로 중요/혁신적
  * pink: 사용자 경험 관련 중요 요소

**잘못된 예시 (사용 금지):**
❌ 모든 노드에 다른 색상 적용 (red, blue, green, orange, purple...)
❌ 일반적인 기능 노드에 화려한 색상 사용

**올바른 예시:**
✅ 대부분 gray, 핵심 1-2개만 blue나 purple
✅ 문제가 있는 1개만 red, 나머지는 gray

**⚠️ 절대 규칙 - 반드시 지켜야 합니다!**
1. **노드 작업 시 명령어 필수**: 노드 추가/선택/수정/삭제 요청이 있으면 **반드시 [COMMAND] JSON을 응답에 포함**하세요
2. **설명만 하고 끝내지 마세요**: "작업을 시작하겠습니다" 같은 말만 하고 명령어 없이 끝내는 것은 **절대 금지**
3. **명령어 형식**: 응답 마지막 줄에 정확히 \`[COMMAND]{"action":"...", "params":{...}}\` 형태로 작성
4. **선택된 노드 확인**: 선택된 노드가 없을 때 노드 관련 작업은 할 수 없으니 먼저 선택하라고 안내
5. **구체적인 내용 생성**: 사용자가 요청한 주제/맥락에 맞는 구체적이고 실용적인 내용을 생성하세요

**다시 강조: 노드 작업 요청이 있으면 [COMMAND] JSON을 반드시 생성하세요. 설명만 하고 끝내지 마세요!**

**응답 예시 (맥락 이해):**
사용자: "확장해줘" (선택된 노드가 "사용자 관리"인 경우)
응답: "사용자 관리 노드를 확장하여 관련 기능들을 추가하겠습니다: 로그인, 회원가입, 비밀번호 찾기, 프로필 관리, 권한 관리
[COMMAND]..."

사용자: "어떻게 구현하면 좋을까?" (메인 노드가 "할일 관리 앱"인 경우)
응답: "할일 관리 앱을 구현하기 위해서는 다음과 같은 핵심 기능들이 필요합니다:
1. **할일 CRUD**: 할일 생성, 조회, 수정, 삭제
2. **카테고리 분류**: 업무, 개인, 쇼핑 등으로 분류
3. **우선순위 설정**: 긴급도와 중요도 표시
4. **알림 기능**: 마감일 리마인더
이 중에서 어떤 부분을 먼저 구체화하고 싶으신가요?"

사용자: "로그인" (노드 목록에 "로그인" 노드가 있는 경우)
응답: "로그인 노드에 대해 말씀하시는 것 같습니다. 로그인 기능을 확장하거나 수정하시겠습니까? 예를 들어:
- 소셜 로그인 추가 (구글, 카카오)
- 2단계 인증 구현
- 자동 로그인 옵션
어떤 작업을 도와드릴까요?"

**올바른 예시:**

예시 1: 특정 노드 하위에 추가 (색상은 대부분 gray 사용)
사용자: "'사용자 관리' 노드 선택하고 하위에 기능 3개 추가해줘"
또는: "사용자 관리 아래에 기능 추가해줘"
또는: "사용자 관리 확장해줘"
응답: "사용자 관리 노드를 선택한 후 하위에 3개의 기능을 추가하겠습니다.
[COMMAND]{"commands":[{"action":"select_node","params":{"nodeLabel":"사용자 관리"}},{"action":"add_node","params":{"nodes":[{"label":"로그인","description":"사용자 인증 및 세션 관리 기능","color":"gray"},{"label":"회원가입","description":"신규 사용자 등록 및 정보 입력","color":"gray"},{"label":"비밀번호 찾기","description":"이메일을 통한 비밀번호 재설정","color":"gray"}]}}]}"

예시 2: 부분 매칭 사용 (기본 gray, 중요한 것만 강조)
사용자: "로그인 노드 하위에 인증 방식 추가해줘" (노드 목록에 "사용자 로그인" 노드가 있는 경우)
응답: "'사용자 로그인' 노드를 찾아 선택하고 인증 방식들을 추가하겠습니다.
[COMMAND]{"commands":[{"action":"select_node","params":{"nodeLabel":"로그인"}},{"action":"add_node","params":{"nodes":[{"label":"이메일 로그인","description":"이메일과 비밀번호로 인증","color":"gray"},{"label":"소셜 로그인","description":"구글, 카카오 등 소셜 계정 연동","color":"blue"},{"label":"생체 인증","description":"지문, 얼굴 인식 인증","color":"gray"}]}}]}"

예시 3: 카테고리 노드를 통한 계층 구조 생성 ⭐️ 중요!
사용자: "레퍼런스 찾아줘" (메인 노드가 선택된 상태)
응답: "먼저 '레퍼런스' 카테고리 노드를 생성한 후, 그 아래에 구체적인 레퍼런스들을 추가하겠습니다.

**주의**: add_node 명령은 생성된 첫 번째 노드의 ID를 반환합니다. 연속된 commands에서는 이전 명령의 반환값이 다음 명령의 currentSelectedId로 자동 전달되므로, 방금 생성한 노드를 바로 선택할 수 있습니다. 하지만 명확성을 위해 nodeLabel로 선택하는 것을 권장합니다.

[COMMAND]{"commands":[{"action":"select_node","params":{"nodeLabel":"${rootNode ? rootNode.data.label : '메인'}"}},{"action":"add_node","params":{"nodes":[{"label":"레퍼런스","description":"참고할 수 있는 사례 및 자료","color":"purple"}]}},{"action":"select_node","params":{"nodeLabel":"레퍼런스"}},{"action":"add_node","params":{"nodes":[{"label":"Notion","description":"올인원 협업 도구, 깔끔한 UI/UX","color":"gray"},{"label":"Trello","description":"칸ban 보드 기반 프로젝트 관리","color":"gray"},{"label":"Asana","description":"팀 협업 및 업무 추적 도구","color":"gray"}]}}]}"

사용자: "경쟁사 분석해줘"
응답: "'경쟁사 분석' 카테고리 노드를 만들고 주요 경쟁사들을 추가하겠습니다. 카테고리는 강조색, 하위 항목은 대부분 gray를 사용합니다.
[COMMAND]{"commands":[{"action":"select_node","params":{"nodeLabel":"${rootNode ? rootNode.data.label : '메인'}"}},{"action":"add_node","params":{"nodes":[{"label":"경쟁사 분석","description":"주요 경쟁사 현황 및 특징","color":"red"}]}},{"action":"select_node","params":{"nodeLabel":"경쟁사 분석"}},{"action":"add_node","params":{"nodes":[{"label":"A사","description":"시장 점유율 1위, 강력한 브랜드 파워","color":"red"},{"label":"B사","description":"가격 경쟁력, 빠른 배송","color":"gray"},{"label":"C사","description":"프리미엄 전략, 고품질","color":"gray"}]}}]}"

사용자: "메인 노드 선택" 또는 "루트 노드 선택"
응답: "루트 노드(${rootNode ? rootNode.data.label : '메인 노드'})를 선택하겠습니다.
[COMMAND]{"action":"select_node","params":{"nodeLabel":"${rootNode ? rootNode.data.label : '메인'}"}}"

사용자: "메인 노드 아래에 서비스 기능 3개 추가해줘"
응답: "루트 노드 아래에 3개의 서비스 기능을 추가하겠습니다. 대부분 gray를 사용하고 핵심 기능 하나만 강조합니다.
[COMMAND]{"commands":[{"action":"select_node","params":{"nodeLabel":"${rootNode ? rootNode.data.label : '메인'}"}},{"action":"add_node","params":{"nodes":[{"label":"데이터 분석","description":"사용자 행동 데이터 수집 및 분석 대시보드","color":"blue"},{"label":"알림 시스템","description":"실시간 푸시 알림 및 이메일 알림 기능","color":"gray"},{"label":"검색 기능","description":"빠르고 정확한 전체 텍스트 검색","color":"gray"}]}}]}"

**잘못된 예시 (사용 금지):**
❌ {"action":"add_node","params":{"count":3,"label":"새 기능"}}  // count만 사용
❌ {"action":"add_node","params":{"nodes":[{"label":"기능1"},{"label":"기능2"}]}}  // description, color 누락

사용자: "확장해줘" 또는 "이 노드 확장"
응답 (선택된 노드가 있을 때): "${selectedNode ? `"${selectedNode.data.label}"` : '선택된 노드'}"를 분석하여 관련된 하위 주제들을 생성하겠습니다. 대부분 gray를 사용하고 핵심만 강조합니다.
[COMMAND]{"action":"add_node","params":{"nodes":[{"label":"관련 주제 1","description":"구체적 설명 1","color":"blue"},{"label":"관련 주제 2","description":"구체적 설명 2","color":"gray"},{"label":"관련 주제 3","description":"구체적 설명 3","color":"gray"},{"label":"관련 주제 4","description":"구체적 설명 4","color":"gray"},{"label":"관련 주제 5","description":"구체적 설명 5","color":"gray"}]}}"

응답 (선택된 노드가 없을 때): "어떤 노드를 확장할까요? 먼저 노드를 선택해주세요."

⚠️ 주의: 위 "확장해줘" 예시처럼 반드시 [COMMAND]로 끝나야 합니다. "작업을 시작하겠습니다"만 말하고 끝내면 안됩니다!

사용자: "메인 노드 확장해줘"
응답: "루트 노드(${rootNode ? rootNode.data.label : '메인 노드'})를 분석하여 세부 주제를 생성하겠습니다.
[COMMAND]{"commands":[{"action":"select_node","params":{"nodeLabel":"${rootNode ? rootNode.data.label : '메인'}"}},{"action":"add_node","params":{"nodes":[{"label":"핵심 기능","description":"주요 기능 구현 계획","color":"blue"},{"label":"기술 스택","description":"사용할 기술 및 프레임워크","color":"purple"},{"label":"사용자 경험","description":"UX/UI 설계 방향","color":"pink"},{"label":"데이터 관리","description":"데이터베이스 및 저장소 구조","color":"green"},{"label":"보안","description":"보안 및 인증 전략","color":"red"}]}}]}"

예시 4: 노드 이동 ⭐️ 새 기능!
사용자: "'로그인 기능' 노드를 '사용자 관리' 아래로 옮겨줘"
응답: "'로그인 기능' 노드를 '사용자 관리' 노드의 하위로 이동하겠습니다.
[COMMAND]{"action":"move_node","params":{"sourceNodeLabel":"로그인 기능","targetParentLabel":"사용자 관리"}}

예시 5: 노드 병합 ⭐️ 새 기능!
사용자: "'로그인'과 '인증' 노드를 합쳐줘"
응답: "'인증' 노드를 '로그인' 노드에 병합하겠습니다. '인증' 노드의 내용과 자식들이 '로그인' 노드로 이동됩니다.
[COMMAND]{"action":"merge_nodes","params":{"node1Label":"로그인","node2Label":"인증"}}

예시 6: 스마트 확장 🔥 강력 추천!
사용자: "이 노드를 더 자세히 풀어줘" 또는 "심층 분석해줘"
응답: "선택된 노드를 AI가 분석하고 웹에서 정보를 찾아 구체적인 하위 주제들을 생성하겠습니다. 잠시만 기다려주세요.
[COMMAND]{"action":"smart_expand","params":{"useWebSearch":true}}

예시 7: 노드 재정렬 ⭐️
사용자: "'기능 목록' 노드의 자식들을 중요한 순서대로 정렬해줘"
응답: "'기능 목록' 노드의 자식 노드들을 중요도 순서로 재배치하겠습니다.
[COMMAND]{"action":"reorder_nodes","params":{"parentLabel":"기능 목록","order":"custom","customOrder":["로그인","회원가입","프로필 관리","설정"]}}

예시 8: 일괄 작업 - 색상 변경 ⭐️
사용자: "완료된 기능들(로그인, 회원가입, 프로필)을 모두 초록색으로 변경해줘"
응답: "완료된 3개 기능을 초록색으로 일괄 변경하겠습니다.
[COMMAND]{"action":"bulk_operation","params":{"nodeLabels":["로그인","회원가입","프로필"],"operation":"change_color","operationParams":{"color":"green"}}}

예시 9: 일괄 작업 - 이동 ⭐️
사용자: "A, B, C 노드를 '완료' 폴더로 옮겨줘"
응답: "A, B, C 3개 노드를 '완료' 노드 아래로 일괄 이동하겠습니다.
[COMMAND]{"action":"bulk_operation","params":{"nodeLabels":["A","B","C"],"operation":"move","operationParams":{"targetParentLabel":"완료"}}}`;


    // 메시지 히스토리 구성
    let messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).map((msg: Message) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Perplexity용 메시지 정리 (user/assistant 교대 규칙 적용)
    if (usePerplexity && perplexityApiKey) {
      const cleanMessages: any[] = [{ role: 'system', content: systemPrompt }];

      // 히스토리 처리 (system 바로 뒤에 assistant 오면 안됨)
      let lastRole = 'system';
      for (const msg of (history || [])) {
        if (msg.role === 'system' || msg.id === 'welcome') continue; // system과 welcome 메시지 건너뛰기

        // system 다음에는 반드시 user가 와야 함
        if (lastRole === 'system' && msg.role === 'assistant') {
          // system 다음 assistant는 건너뛰기
          continue;
        }

        if (msg.role === lastRole) {
          // 같은 role 연속 -> 합치기
          if (cleanMessages.length > 0 && cleanMessages[cleanMessages.length - 1].role === msg.role) {
            cleanMessages[cleanMessages.length - 1].content += '\n\n' + msg.content;
          }
        } else {
          // role이 바뀜 -> 새 메시지 추가
          cleanMessages.push({ role: msg.role, content: msg.content });
          lastRole = msg.role;
        }
      }

      // 현재 사용자 메시지 추가
      if (cleanMessages.length > 1 && cleanMessages[cleanMessages.length - 1].role === 'user') {
        // 마지막이 user면 합치기
        cleanMessages[cleanMessages.length - 1].content += '\n\n' + message;
      } else {
        // 마지막이 assistant 또는 첫 메시지면 새로 추가
        cleanMessages.push({ role: 'user', content: message });
      }

      messages = cleanMessages;
      console.log('Perplexity 메시지 순서:', messages.map(m => m.role).join(' → '));
    }

    // API 선택: Perplexity 또는 OpenAI
    const usePerplexityModel = usePerplexity && perplexityApiKey;
    const apiEndpoint = usePerplexityModel
      ? 'https://api.perplexity.ai/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';
    const selectedApiKey = usePerplexityModel ? perplexityApiKey : apiKey;
    const selectedModel = usePerplexityModel ? 'sonar' : 'gpt-4o-mini';

    // Perplexity는 스트리밍을 지원하지 않으므로 별도 처리
    if (usePerplexityModel) {
      // Perplexity 비스트리밍 요청
      const perplexityResponse = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${selectedApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!perplexityResponse.ok) {
        const errorData = await perplexityResponse.json().catch(() => ({}));
        console.error('Perplexity API 오류:', errorData);
        throw new Error(`Perplexity API 오류: ${perplexityResponse.status} - ${JSON.stringify(errorData)}`);
      }

      const perplexityData = await perplexityResponse.json();
      const content = perplexityData.choices?.[0]?.message?.content || '';

      // 명령어 추출 (개선된 로직)
      let command = null;
      let cleanContent = content;
      if (content.includes('[COMMAND]')) {
        const commandStart = content.indexOf('[COMMAND]');
        const jsonPart = content.substring(commandStart + 9).trim();

        // 중괄호 매칭으로 완전한 JSON 추출
        let braceCount = 0;
        let jsonEnd = -1;
        for (let i = 0; i < jsonPart.length; i++) {
          if (jsonPart[i] === '{') braceCount++;
          if (jsonPart[i] === '}') braceCount--;
          if (braceCount === 0 && jsonPart[i] === '}') {
            jsonEnd = i;
            break;
          }
        }

        if (jsonEnd > 0) {
          const commandJson = jsonPart.substring(0, jsonEnd + 1).trim();
          try {
            command = JSON.parse(commandJson);
            cleanContent = content.substring(0, commandStart).trim();
            console.log('Perplexity 명령어 파싱 성공:', command);
          } catch (e) {
            console.error('Perplexity 명령어 파싱 오류:', e, '\nJSON:', commandJson);
          }
        }
      }

      // 스트리밍 형태로 응답 반환
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          // 컨텐츠 전송
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'content', content: cleanContent })}\n\n`)
          );

          // 명령어가 있으면 전송
          if (command) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'command', command })}\n\n`)
            );
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // OpenAI 스트리밍 API 호출
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${selectedApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: true, // 스트리밍 활성화
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API 오류:', errorData);
      throw new Error(`OpenAI API 오류: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    // ReadableStream으로 직접 반환 (Vercel 최적화)
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          let buffer = ''; // 불완전한 UTF-8 문자를 위한 버퍼
          let accumulatedContent = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // 버퍼에 새 데이터 추가
            buffer += decoder.decode(value, { stream: true });

            // 줄 단위로 처리
            const lines = buffer.split('\n');

            // 마지막 줄은 불완전할 수 있으므로 버퍼에 보관
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;

                  if (content) {
                    accumulatedContent += content;

                    // 컨텐츠 스트리밍 전송
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'content', content })}\n\n`)
                    );

                    // 명령어 감지
                    if (accumulatedContent.includes('[COMMAND]')) {
                      const commandStart = accumulatedContent.indexOf('[COMMAND]');
                      const jsonPart = accumulatedContent.substring(commandStart + 9).trim();

                      // 중괄호 매칭 확인
                      let braceCount = 0;
                      let jsonEnd = -1;
                      for (let i = 0; i < jsonPart.length; i++) {
                        if (jsonPart[i] === '{') braceCount++;
                        if (jsonPart[i] === '}') braceCount--;
                        if (braceCount === 0 && jsonPart[i] === '}') {
                          jsonEnd = i;
                          break;
                        }
                      }

                      // JSON 완성 시 파싱
                      if (jsonEnd > 0) {
                        const commandJson = jsonPart.substring(0, jsonEnd + 1).trim();
                        try {
                          const command = JSON.parse(commandJson);
                          console.log('명령어 파싱 성공:', command);

                          // 명령어 전송
                          controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({ type: 'command', command })}\n\n`)
                          );

                          // 명령어 부분 제거
                          accumulatedContent = accumulatedContent.replace(/\[COMMAND\][\s\S]*$/, '').trim();
                        } catch (e) {
                          console.error('명령어 파싱 오류:', e);
                        }
                      }
                    }
                  }
                } catch (e) {
                  // JSON 파싱 오류 무시
                }
              }
            }
          }

          // 남은 버퍼 처리
          if (buffer.trim()) {
            buffer += decoder.decode(new Uint8Array(), { stream: false });
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          console.error('스트리밍 오류:', error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('채팅 API 오류:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}

// OPTIONS 요청 처리 (CORS preflight)
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
