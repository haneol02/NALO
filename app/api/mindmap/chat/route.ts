import { NextRequest } from 'next/server';

export const runtime = 'edge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { message, history, apiKey, selectedNodeId, nodes, rootLabel } = await request.json();

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
- 존재하는 모든 노드들: ${nodeList}
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
1. **노드 선택**: "'사용자 관리' 노드 선택해줘", "메인 노드 선택"
   - "메인", "루트", "root" 키워드는 자동으로 루트 노드(${rootNode ? `"${rootNode.data.label}"` : '메인 노드'})를 찾습니다
2. **노드 추가 및 확장**: "메인 노드 아래에 3개 노드 추가", "이 노드 확장해줘", "하위 아이디어 생성"
   - **반드시 add_node 액션만 사용**: 노드 추가, 확장, 생성 모두 add_node로 처리
   - **확장 요청도 add_node 사용**: "확장해줘"라고 하면 선택된 노드의 주제를 분석하여 관련된 구체적인 하위 노드를 add_node로 생성
   - 선택된 노드의 맥락과 주제를 반드시 고려하여 관련성 있는 내용 생성
3. **노드 수정**: "선택한 노드 이름을 X로 변경", "노드 설명 변경"
4. **노드 삭제**: "선택한 노드 삭제", "이 노드 제거"
5. **일반 대화**: 마인드맵 사용법, 팁 제공

**응답 형식:**
- 사용자에게 친절하고 명확하게 설명
- 작업 수행 시 어떤 작업을 할지 먼저 설명
- 명령어는 JSON 형식으로 별도 전달

**명령어 형식 (JSON):**
단일 명령어:
{
  "action": "select_node" | "add_node" | "edit_node" | "delete_node",
  "params": { ... }
}

여러 명령어 (순차 실행):
{
  "commands": [
    {"action": "select_node", "params": {"nodeLabel": "사용자 관리"}},
    {"action": "add_node", "params": {"nodes": [
      {"label": "로그인", "description": "사용자 로그인 기능", "color": "blue"},
      {"label": "회원가입", "description": "신규 사용자 등록", "color": "green"}
    ]}}
  ]
}

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

**색상 선택 가이드:**
- gray: 일반적/중립적 내용
- red: 중요/경고/문제점
- orange: 주의/개선사항
- yellow: 아이디어/창의적 제안
- green: 성공/완료/긍정적 요소
- blue: 정보/데이터/기술적 내용
- purple: 혁신/고급/전략적 내용
- pink: 사용자 중심/경험/디자인

**중요:**
- 명령어를 실행할 때는 반드시 응답 끝에 JSON 형식의 명령어를 작성하세요
- 명령어 형식: 응답 마지막 줄에 정확히 \`[COMMAND]{"action":"add_node","params":{...}}\` 형태로 작성
- 선택된 노드가 없을 때 노드 관련 작업은 할 수 없으니 먼저 선택하라고 안내
- 사용자가 요청한 주제/맥락에 맞는 구체적이고 실용적인 내용을 생성하세요

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
사용자: "'사용자 관리' 노드 선택하고 하위에 기능 3개 추가해줘"
응답: "1. '사용자 관리' 노드를 선택합니다.
2. 하위에 3개의 기능 노드를 추가합니다: 로그인, 회원가입, 비밀번호 찾기
[COMMAND]{"commands":[{"action":"select_node","params":{"nodeLabel":"사용자 관리"}},{"action":"add_node","params":{"nodes":[{"label":"로그인","description":"사용자 인증 및 세션 관리 기능","color":"blue"},{"label":"회원가입","description":"신규 사용자 등록 및 정보 입력","color":"green"},{"label":"비밀번호 찾기","description":"이메일을 통한 비밀번호 재설정","color":"orange"}]}}]}"

사용자: "메인 노드 선택" 또는 "루트 노드 선택"
응답: "루트 노드(${rootNode ? rootNode.data.label : '메인 노드'})를 선택하겠습니다.
[COMMAND]{"action":"select_node","params":{"nodeLabel":"${rootNode ? rootNode.data.label : '메인'}"}}"

사용자: "메인 노드 아래에 서비스 기능 3개 추가해줘"
응답: "루트 노드 아래에 3개의 서비스 기능을 추가하겠습니다.
[COMMAND]{"commands":[{"action":"select_node","params":{"nodeLabel":"${rootNode ? rootNode.data.label : '메인'}"}},{"action":"add_node","params":{"nodes":[{"label":"데이터 분석","description":"사용자 행동 데이터 수집 및 분석 대시보드","color":"blue"},{"label":"알림 시스템","description":"실시간 푸시 알림 및 이메일 알림 기능","color":"purple"},{"label":"검색 기능","description":"빠르고 정확한 전체 텍스트 검색","color":"green"}]}}]}"

**잘못된 예시 (사용 금지):**
❌ {"action":"add_node","params":{"count":3,"label":"새 기능"}}  // count만 사용
❌ {"action":"add_node","params":{"nodes":[{"label":"기능1"},{"label":"기능2"}]}}  // description, color 누락

사용자: "확장해줘" 또는 "이 노드 확장"
응답 (선택된 노드가 있을 때): "${selectedNode ? `"${selectedNode.data.label}"(${selectedNode.data.description || '설명 없음'})` : '선택된 노드'}"를 분석하여 관련된 하위 주제 5개를 생성하겠습니다.
[COMMAND]{"action":"add_node","params":{"nodes":[{"label":"관련 주제 1","description":"${selectedNode ? selectedNode.data.label : ''}에 대한 구체적 설명 1","color":"blue"},{"label":"관련 주제 2","description":"${selectedNode ? selectedNode.data.label : ''}에 대한 구체적 설명 2","color":"green"},{"label":"관련 주제 3","description":"${selectedNode ? selectedNode.data.label : ''}에 대한 구체적 설명 3","color":"purple"},{"label":"관련 주제 4","description":"${selectedNode ? selectedNode.data.label : ''}에 대한 구체적 설명 4","color":"orange"},{"label":"관련 주제 5","description":"${selectedNode ? selectedNode.data.label : ''}에 대한 구체적 설명 5","color":"pink"}]}}"

응답 (선택된 노드가 없을 때): "어떤 노드를 확장할까요? 먼저 노드를 선택해주세요."

사용자: "메인 노드 확장해줘"
응답: "루트 노드(${rootNode ? rootNode.data.label : '메인 노드'})를 분석하여 세부 주제를 생성하겠습니다.
[COMMAND]{"commands":[{"action":"select_node","params":{"nodeLabel":"${rootNode ? rootNode.data.label : '메인'}"}},{"action":"add_node","params":{"nodes":[{"label":"핵심 기능","description":"주요 기능 구현 계획","color":"blue"},{"label":"기술 스택","description":"사용할 기술 및 프레임워크","color":"purple"},{"label":"사용자 경험","description":"UX/UI 설계 방향","color":"pink"},{"label":"데이터 관리","description":"데이터베이스 및 저장소 구조","color":"green"},{"label":"보안","description":"보안 및 인증 전략","color":"red"}]}}]}"`;


    // 메시지 히스토리 구성
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).map((msg: Message) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // OpenAI 스트리밍 API 호출
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.status}`);
    }

    // 스트리밍 응답 생성
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          controller.close();
          return;
        }

        try {
          let accumulatedContent = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;

                  if (content) {
                    accumulatedContent += content;

                    // 컨텐츠 스트리밍
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'content', content })}\n\n`)
                    );

                    // 명령어 감지 ([COMMAND]로 시작)
                    if (accumulatedContent.includes('[COMMAND]')) {
                      const commandMatch = accumulatedContent.match(/\[COMMAND\]\s*({[\s\S]*})/);
                      if (commandMatch) {
                        try {
                          const commandJson = commandMatch[1].trim();
                          console.log('명령어 JSON 추출:', commandJson);
                          const command = JSON.parse(commandJson);
                          console.log('명령어 파싱 성공:', command);

                          // 명령어 전송
                          controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({ type: 'command', command })}\n\n`)
                          );

                          // 명령어 부분은 응답에서 제거
                          accumulatedContent = accumulatedContent.replace(/\[COMMAND\][\s\S]*$/, '').trim();
                        } catch (e) {
                          console.error('명령어 JSON 파싱 오류:', e);
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
      },
    });
  } catch (error) {
    console.error('채팅 API 오류:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      }),
      { status: 500 }
    );
  }
}
