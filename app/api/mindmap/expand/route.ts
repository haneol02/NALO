import { NextRequest, NextResponse } from 'next/server';

// 텍스트에서 제안사항 추출하는 함수
function extractSuggestionsFromText(text: string, selectedNode: any) {
  const suggestions: any[] = [];
  
  try {
    console.log('텍스트 파싱 상세 로그 시작...');
    
    // 1. JSON 구조에서 정보 추출 시도
    const lines = text.split('\n');
    let currentSuggestion: any = null;
    let inSuggestions = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // suggestions 배열 시작 감지
      if (line.includes('"suggestions"') && line.includes('[')) {
        inSuggestions = true;
        continue;
      }
      
      // suggestions 배열 종료 감지
      if (inSuggestions && line.includes(']')) {
        inSuggestions = false;
        if (currentSuggestion) {
          suggestions.push(currentSuggestion);
          currentSuggestion = null;
        }
        break;
      }
      
      if (inSuggestions) {
        // 새로운 객체 시작
        if (line.includes('{')) {
          if (currentSuggestion) {
            suggestions.push(currentSuggestion);
          }
          currentSuggestion = {
            label: '',
            type: 'feature',
            description: '',
            priority: 'medium',
            complexity: 'moderate',
            value: ''
          };
        }
        
        // 각 필드 파싱
        if (currentSuggestion) {
          if (line.includes('"label"')) {
            const match = line.match(/"label":\s*"([^"]*?)"/);
            if (match) currentSuggestion.label = match[1];
          }
          
          if (line.includes('"type"')) {
            const match = line.match(/"type":\s*"([^"]*?)"/);
            if (match) currentSuggestion.type = match[1];
          }
          
          if (line.includes('"description"')) {
            // 여러 줄에 걸친 설명 처리
            let description = '';
            const match = line.match(/"description":\s*"([^"]*?)(?:",|"$|")/);
            if (match) {
              description = match[1];
              // 설명이 다음 줄까지 이어지는 경우 처리
              let j = i + 1;
              while (j < lines.length && !lines[j].trim().includes('"') && description.length < 200) {
                description += ' ' + lines[j].trim();
                j++;
              }
              currentSuggestion.description = description.trim();
            }
          }
          
          if (line.includes('"priority"')) {
            const match = line.match(/"priority":\s*"([^"]*?)"/);
            if (match) currentSuggestion.priority = match[1];
          }
          
          if (line.includes('"complexity"')) {
            const match = line.match(/"complexity":\s*"([^"]*?)"/);
            if (match) currentSuggestion.complexity = match[1];
          }
          
          if (line.includes('"value"')) {
            const match = line.match(/"value":\s*"([^"]*?)"/);
            if (match) currentSuggestion.value = match[1];
          }
        }
      }
    }
    
    // 마지막 객체 추가
    if (currentSuggestion && currentSuggestion.label) {
      suggestions.push(currentSuggestion);
    }
    
    console.log('구조적 파싱 결과:', suggestions.length, '개');
    
    // 2. 구조적 파싱이 실패했으면 키워드 기반 파싱
    if (suggestions.length === 0) {
      console.log('키워드 기반 파싱 시도...');
      const keywords = extractKeywords(text);
      
      // 특별한 패턴들 찾기
      const systemPattern = /시스템|시스템/g;
      const servicePattern = /서비스|프로그램/g;
      const safetyPattern = /안전|보안|경고/g;
      
      const systemMatches = text.match(systemPattern) || [];
      const serviceMatches = text.match(servicePattern) || [];
      const safetyMatches = text.match(safetyPattern) || [];
      
      if (systemMatches.length > 0) {
        suggestions.push({
          label: '실시간 경고 시스템',
          type: 'feature',
          description: '실시간으로 상태를 모니터링하고 경고를 전송하는 시스템',
          priority: 'high',
          complexity: 'moderate',
          value: '안전성 강화 및 사고 예방'
        });
      }
      
      if (serviceMatches.length > 0) {
        suggestions.push({
          label: '교육 프로그램 서비스',
          type: 'feature',
          description: '정기적인 교육 및 훈련을 제공하는 서비스',
          priority: 'medium',
          complexity: 'simple',
          value: '인식 제고 및 능력 향상'
        });
      }
      
      if (safetyMatches.length > 0) {
        suggestions.push({
          label: '안전 점검 관리',
          type: 'feature',
          description: '체계적인 안전 점검 및 관리 기능',
          priority: 'high',
          complexity: 'moderate',
          value: '예방적 관리를 통한 안전 확보'
        });
      }
      
      // 여전히 없으면 기본 키워드로
      if (suggestions.length === 0) {
        keywords.slice(0, 3).forEach((keyword, index) => {
          suggestions.push({
            label: `${keyword} 관련 기능`,
            type: index === 0 ? 'feature' : index === 1 ? 'solution' : 'detail',
            description: `${keyword}와 관련된 구체적인 구현 방안`,
            priority: 'medium',
            complexity: 'moderate',
            value: `${keyword} 개선을 통한 가치 창출`
          });
        });
      }
    }
    
    console.log('최종 텍스트 파싱 결과:', suggestions.length, '개');
    
  } catch (error) {
    console.error('텍스트 파싱 중 오류:', error);
  }
  
  return suggestions.slice(0, 5); // 최대 5개로 제한
}

// 텍스트에서 키워드 추출
function extractKeywords(text: string): string[] {
  const keywords: string[] = [];
  const commonWords = ['시스템', '기능', '서비스', '관리', '개발', '구현', '방안', '방법'];
  
  // 한글 키워드 추출 (2-10글자)
  const koreanMatches = text.match(/[가-힣]{2,10}/g) || [];
  const filteredKeywords = koreanMatches
    .filter(word => word.length >= 2 && word.length <= 10)
    .filter(word => !commonWords.includes(word))
    .slice(0, 10);
    
  return Array.from(new Set(filteredKeywords)); // 중복 제거
}

// 노드별 기본 제안 반환
function getDefaultSuggestions(selectedNode: any) {
  const nodeType = selectedNode.data.type;
  const fallbackSuggestions = {
    'root': [
      { label: '핵심 기능 정의', type: 'feature', description: '프로젝트의 주요 기능을 구체화', priority: 'high', complexity: 'moderate', value: '프로젝트 방향성 확립' },
      { label: '사용자 요구사항', type: 'problem', description: '대상 사용자의 핵심 니즈 분석', priority: 'high', complexity: 'simple', value: '사용자 중심 설계' },
      { label: '기술적 제약사항', type: 'problem', description: '구현 시 고려해야 할 기술적 한계', priority: 'medium', complexity: 'complex', value: '현실적 개발 계획' }
    ],
    'idea': [
      { label: '구현 방안', type: 'solution', description: '아이디어를 실현하기 위한 구체적 방법', priority: 'high', complexity: 'moderate', value: '실행력 확보' },
      { label: '필요한 기능', type: 'feature', description: '아이디어 실현을 위해 필요한 기능들', priority: 'medium', complexity: 'simple', value: '기능 명세화' }
    ],
    'feature': [
      { label: '세부 스펙', type: 'detail', description: '기능의 상세한 명세와 동작 방식', priority: 'high', complexity: 'moderate', value: '명확한 요구사항' },
      { label: '구현 이슈', type: 'problem', description: '기능 구현 시 예상되는 문제점', priority: 'medium', complexity: 'complex', value: '리스크 관리' }
    ],
    'problem': [
      { label: '해결 방안', type: 'solution', description: '문제를 해결하기 위한 구체적 방법', priority: 'high', complexity: 'moderate', value: '문제 해결' },
      { label: '대안 검토', type: 'solution', description: '다양한 접근 방식과 대안책', priority: 'medium', complexity: 'simple', value: '선택권 확보' }
    ],
    'solution': [
      { label: '실행 계획', type: 'detail', description: '솔루션의 단계별 실행 방안', priority: 'high', complexity: 'moderate', value: '체계적 실행' },
      { label: '효과 측정', type: 'detail', description: '솔루션 효과를 측정하는 방법', priority: 'medium', complexity: 'simple', value: '성과 검증' }
    ],
    'detail': [
      { label: '구체화', type: 'detail', description: '더욱 상세한 내용과 명세', priority: 'medium', complexity: 'simple', value: '완성도 향상' }
    ]
  };
  
  return (fallbackSuggestions as any)[nodeType] || fallbackSuggestions['idea'];
}

export async function POST(request: NextRequest) {
  try {
    const { selectedNode, context, expandOptions = {}, apiKey } = await request.json();

    console.log('=== 마인드맵 AI 확장 요청 ===');
    console.log('선택된 노드:', selectedNode);
    console.log('컨텍스트:', context);

    if (!selectedNode || !selectedNode.data) {
      return NextResponse.json(
        { success: false, error: '선택된 노드 정보가 없습니다.' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API 키가 필요합니다. 홈 화면에서 API 키를 입력해주세요.' },
        { status: 401 }
      );
    }

    // AI 프롬프트 생성
    const { mode, category, prompt: customPrompt, count, aiDetermineCount } = expandOptions;
    
    // 지능적 카테고리 선택 및 모드별 전략 설정
    let selectedCategory = category;
    let modeStrategy = '';
    let typeInstruction = '';
    
    // 모드별 지능적 전략 수립
    if (mode === 'simple') {
      modeStrategy = `**간편 모드 전략:**
- 사용자 친화적이고 이해하기 쉬운 제안
- 즉시 실행 가능한 실용적 아이디어 우선
- 복잡한 기술적 내용보다는 핵심 가치에 집중
- 명확하고 구체적인 액션 아이템 제공`;
      
      if (category && category !== 'mixed') {
        selectedCategory = category;
        typeInstruction = `지정된 "${category}" 카테고리 내에서 다양한 관점의 아이디어를 제안하되, 모든 제안의 타입은 "${category}"로 통일해주세요.`;
      } else {
        typeInstruction = `노드의 특성을 분석하여 가장 적합한 단일 카테고리를 선택한 후, 해당 카테고리 내에서 다양한 아이디어를 제안해주세요.`;
      }
    } else if (mode === 'advanced') {
      modeStrategy = `**고급 모드 전략:**
- 전문가 수준의 깊이 있는 분석과 제안
- 혁신적이고 창의적인 접근 방식 탐구  
- 기술적 세부사항과 구현 복잡성 고려
- 장기적 관점과 전략적 가치 평가
- 다각도 분석을 통한 종합적 솔루션 제시`;
      
      if (customPrompt && customPrompt.trim()) {
        selectedCategory = 'mixed';
        typeInstruction = `사용자 프롬프트 "${customPrompt}"를 심층 분석하여:
1. 프롬프트의 숨은 의도와 핵심 요구사항 파악
2. 가장 적합한 카테고리들을 전략적으로 선택
3. 각 아이디어마다 최적의 타입(idea/feature/problem/solution/detail) 할당
4. 프롬프트 요구사항을 초과하는 가치있는 인사이트 제공`;
      } else {
        typeInstruction = `선택된 노드를 전문가적 관점에서 분석하여 가장 가치있는 확장 방향을 결정하고, 각 아이디어의 타입을 전략적으로 선택해주세요.`;
      }
    } else {
      // auto 모드나 기타
      modeStrategy = `**자동 모드 전략:**
- AI가 상황을 종합 분석하여 최적의 접근 방식 결정
- 균형잡힌 실용성과 혁신성 추구
- 프로젝트 전체 맥락을 고려한 체계적 제안`;
      typeInstruction = `노드와 전체 맥락을 종합 분석하여 각 아이디어의 타입을 지능적으로 결정해주세요.`;
    }

    // 지능적 분석을 위한 고도화된 프롬프트
    const intelligentPrompt = `
**노드 확장 분석 요청**

**현재 노드 정보:**
- 노드명: "${selectedNode.data.label}"
- 노드 타입: ${selectedNode.data.type}
- 노드 설명: ${selectedNode.data.description || '없음'}
${selectedNode.data.description ? `
**주의: 노드 설명을 반드시 고려하여 확장하세요:**
"${selectedNode.data.description}"
이 설명은 노드의 핵심 의미와 방향을 나타내므로, 모든 제안은 이 설명과 일치해야 합니다.` : ''}

**전체 컨텍스트:**
${context || '전체 주제: 알 수 없음'}

**확장 설정:**
- 모드: ${mode || 'simple'}
${selectedCategory && selectedCategory !== 'mixed' ? `- 지정된 카테고리: ${selectedCategory}` : ''}
${mode === 'advanced' && customPrompt ? `- 사용자 프롬프트: "${customPrompt}"` : ''}

${modeStrategy}

**지능적 분석 단계:**

1. **노드 맥락 분석**: 
   - **노드 제목 분석**: "${selectedNode.data.label}"의 핵심 의미와 범위 파악
   ${selectedNode.data.description ? `- **노드 설명 심층 분석**: "${selectedNode.data.description}"에서 도출되는 구체적 요구사항과 방향성 파악` : ''}
   - **계층 구조 파악**: 제공된 노드 계층 경로를 통해 전체 맥락 이해
   - **상위 관계성 분석**: 직접 상위 노드 및 전체 상위 경로와의 연관성 파악
   - **현재 노드 역할**: 계층에서의 위치에 따른 역할과 중요도 평가
   - **프로젝트 내 위치**: 전체 구조에서 현재 노드의 의미와 영향 범위 분석

2. **모드별 확장 전략 적용**:
   ${mode === 'simple' ? 
     '- 사용자 친화적이고 이해하기 쉬운 접근\n   - 즉시 실행 가능한 실용적 아이디어 우선\n   - 복잡성보다는 명확성과 실용성 중시' :
     mode === 'advanced' ? 
     '- 전문가 수준의 깊이 있는 분석 적용\n   - 혁신적이고 창의적인 접근 방식 탐구\n   - 기술적 세부사항과 전략적 가치 종합 고려' :
     '- 상황에 최적화된 균형잡힌 접근 방식'}
   - 확장 깊이와 범위 최적화
   - ${mode === 'simple' ? '실용성과 접근성' : mode === 'advanced' ? '혁신성과 전문성' : '실무적 가치'}와 실현 가능성 고려

3. **모드별 창의적 아이디어 생성**:
   ${mode === 'simple' ? 
     '- 직관적이고 이해하기 쉬운 아이디어\n   - 바로 실행 가능한 구체적인 액션\n   - 사용자가 쉽게 따라할 수 있는 단계별 제안' :
     mode === 'advanced' ? 
     '- 기존 관점을 뛰어넘는 혁신적 접근\n   - 심층적 분석과 전문적 인사이트\n   - 복합적 문제에 대한 체계적 솔루션' :
     '- 균형잡힌 실용성과 창의성\n   - 다각도 관점의 종합적 제안'}
   - 구체적이고 실행 가능한 솔루션 도출

**모드별 생성 규칙:**
- 개수: ${aiDetermineCount || (mode === 'simple' && selectedCategory === 'mixed') ? 
  '최적의 개수(2-6개)를 상황에 맞게 지능적으로 결정' : 
  `정확히 ${count || 3}개`}
- 품질 기준: ${mode === 'simple' ? 
  '명확성, 실용성, 즉시 실행가능성을 핵심으로 한 사용자 친화적 내용' : 
  mode === 'advanced' ? 
  '독창성, 전문성, 혁신성을 갖춘 깊이 있는 고품질 내용' : 
  '실용성과 창의성을 균형있게 갖춘 고품질 내용'}
- 연관성: 선택된 노드와 강한 논리적 연결성 보장
- 다양성: ${mode === 'simple' ? 
  '다양한 실행 방법과 접근 각도로 실용적 다양성 확보' : 
  mode === 'advanced' ? 
  '서로 다른 전문 영역과 혁신적 관점으로 창의적 다양성 확보' : 
  '서로 다른 관점과 접근 방식으로 균형잡힌 다양성 확보'}
${typeInstruction}

**중요 지침:**
- **노드 정보 필수 반영**: 노드명 "${selectedNode.data.label}"${selectedNode.data.description ? `과 설명 "${selectedNode.data.description}"` : ''} 모두를 반드시 분석하고 활용
${selectedNode.data.description ? `- **설명 중심 확장**: "${selectedNode.data.description}"이 나타내는 구체적 의도와 요구사항에 정확히 부합하는 하위 아이디어만 생성` : ''}
- **계층 맥락 활용**: 제공된 노드 계층 경로를 충분히 활용하여 상위 맥락에 부합하는 하위 아이디어 생성
- **선택 노드 중심**: "${selectedNode.data.label}" 노드를 기준으로 하되, 전체 계층 구조를 고려한 확장
- **일관성 유지**: 상위 노드들의 목적과 방향성에 일치하는 아이디어 제안
- **구체성 증대**: 계층이 깊을수록 더욱 구체적이고 세분화된 내용으로 확장
- **실용성 반영**: 현실적 제약사항과 트렌드를 반영한 제안

응답 형식:
{
  "analysis": {
    "nodeContext": "노드 맥락 분석 결과",
    "expansionDirection": "확장 방향 및 전략",
    "reasoning": "아이디어 생성 근거"
  },
  "suggestions": [
    {
      "label": "아이디어 제목",
      "type": "idea|feature|problem|solution|detail",
      "description": "구체적이고 실용적인 설명",
      "priority": "high|medium|low",
      "complexity": "simple|moderate|complex",
      "value": "핵심 가치 제안"
    }
  ]
}
`;

    console.log('=== OpenAI API 호출 시작 ===');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
        {
          role: 'system',
          content: `당신은 전문적인 프로젝트 컨설턴트이자 창의적 사고 전문가입니다.

**전문 영역:**
- 체계적 분석과 전략적 사고
- 혁신적 아이디어 발굴과 구조화
- 실무 경험 기반의 실용적 솔루션 설계
- 다양한 산업 분야의 프로젝트 기획 경험

**작업 원칙:**
1. **노드 정보 완전 활용**: 노드의 제목과 설명을 모두 반드시 분석하여 정확한 맥락 파악
2. **설명 기반 확장**: 노드 설명이 있는 경우, 해당 설명의 의도와 방향성에 완전히 부합하는 아이디어만 생성
3. **계층 맥락 우선**: 제공된 노드 계층 경로를 필수적으로 분석하여 상위 맥락에 부합하는 아이디어 생성
4. **구조적 일관성**: 전체 계층 구조 내에서 논리적 일관성과 연결성 확보
5. **심층 분석**: 단순한 연상이 아닌 노드 설명과 계층적 맥락을 고려한 체계적 분석
6. **세분화 정도**: 계층 깊이에 따라 적절한 구체성과 세분화 수준 조절
7. **품질 우선**: 노드 설명과 상위 맥락을 완벽히 반영한 실무에서 바로 활용 가능한 고품질 아이디어
8. **실현 가능성**: 계층적 제약사항을 고려한 현실적이면서도 가치있는 제안

**모드별 전문성:**
${mode === 'simple' ? 
  `**간편 모드 전문성:**
- 사용자 친화적 커뮤니케이션과 명확한 가이드라인 제시
- 복잡한 개념을 단순하고 이해하기 쉽게 전달
- 즉시 실행 가능한 구체적 액션 아이템 설계
- 초보자도 쉽게 따라할 수 있는 단계별 접근법` :
  mode === 'advanced' ? 
  `**고급 모드 전문성:**
- 산업 전문가 수준의 깊이 있는 분석과 인사이트
- 최신 기술 트렌드와 혁신적 방법론 활용
- 복합적 문제에 대한 다층적 솔루션 설계
- 장기적 전략과 비즈니스 가치 관점 통합` :
  `**균형형 전문성:**
- 실용성과 혁신성을 겸비한 균형잡힌 접근
- 다양한 이해관계자 관점 고려
- 단계적 확장이 가능한 체계적 방법론`}

**결과물 요구사항:**
- ${mode === 'simple' ? '명확한 설명과 실행 방법' : mode === 'advanced' ? '심층적 분석과 전문적 근거' : '체계적 분석과 실용적 근거'} 제시
- ${aiDetermineCount || (mode === 'simple' && selectedCategory === 'mixed') ? '최적 개수 지능적 결정 (2-6개 범위)' : `정확히 ${expandOptions.count || 3}개 생성`}
- 각 아이디어마다 ${mode === 'simple' ? '실행 난이도와 효과' : mode === 'advanced' ? '혁신성과 전략적 가치' : '우선순위와 실현가능성'} 평가
- ${mode === 'simple' ? '구체적 실행 단계와 기대 효과' : mode === 'advanced' ? '전문적 구현 방안과 비즈니스 가치' : '실용적 실행 방안과 핵심 가치'} 명시

반드시 JSON 형식으로만 응답하세요.`
        },
          {
            role: 'user',
            content: intelligentPrompt
          }
        ],
        max_tokens: 1200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API 오류: ${errorData.error?.message || response.statusText}`);
    }

    const completion = await response.json();
    const aiResponse = completion.choices[0]?.message?.content;
    const tokensUsed = completion.usage?.total_tokens || 0;
    
    console.log('=== OpenAI API 응답 ===');
    console.log('사용된 토큰:', tokensUsed);
    console.log('응답 내용:', aiResponse);

    if (!aiResponse) {
      throw new Error('OpenAI 응답이 비어있습니다.');
    }

    // 강화된 JSON 파싱 및 품질 검증
    let suggestions;
    let analysis = null;
    
    const parseJsonResponse = (rawResponse: string) => {
      let cleanedResponse = rawResponse.trim();
      
      // 1. 마크다운 코드블록 제거
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.substring(7);
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.substring(3);
      }
      
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3);
      }
      
      // 2. 앞뒤 공백 및 개행 정리
      cleanedResponse = cleanedResponse.trim();
      
      // 3. AI가 설명 텍스트와 함께 JSON을 보낸 경우 처리
      // "Here's the JSON:" 같은 텍스트 제거
      const jsonStartPatterns = [
        /^[\s\S]*?(?=\{)/,  // 첫 번째 {까지의 모든 텍스트 제거 (s 플래그 대신 [\s\S] 사용)
        /^[^{]*(?=\{)/  // { 이전의 모든 비JSON 텍스트 제거
      ];
      
      for (const pattern of jsonStartPatterns) {
        if (pattern.test(cleanedResponse)) {
          const match = cleanedResponse.match(pattern);
          if (match && match[0].length > 0) {
            // 설명 텍스트가 있다면 제거
            cleanedResponse = cleanedResponse.substring(match[0].length);
            break;
          }
        }
      }
      
      // 4. JSON 끝 이후의 설명 텍스트 제거
      const jsonEndPattern = /\}(?:\s*\n.*)?$/;
      const lastBraceIndex = cleanedResponse.lastIndexOf('}');
      if (lastBraceIndex !== -1) {
        cleanedResponse = cleanedResponse.substring(0, lastBraceIndex + 1);
      }
      
      // 5. 잘못된 문자 처리
      cleanedResponse = cleanedResponse
        .replace(/'/g, '"')  // 단일 따옴표를 쌍따옴표로 변경
        .replace(/,(\s*[}\]])/g, '$1')  // 마지막 쉼표 제거
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":')  // 키에 따옴표 추가
        .replace(/"/g, '"')  // 왼쪽 따옴표를 일반 따옴표로 변경
        .replace(/"/g, '"')  // 오른쪽 따옴표를 일반 따옴표로 변경
        .replace(/'/g, '"')  // 왼쪽 작은따옴표를 따옴표로 변경
        .replace(/'/g, '"')  // 오른쪽 작은따옴표를 따옴표로 변경
        .trim();
      
      // 6. 다중 JSON 객체가 있는 경우 첫 번째만 추출
      if (cleanedResponse.includes('}\n{') || cleanedResponse.includes('} {')) {
        const firstJsonEnd = cleanedResponse.indexOf('}') + 1;
        cleanedResponse = cleanedResponse.substring(0, firstJsonEnd);
      }
      
      return cleanedResponse;
    };

    try {
      const cleanedResponse = parseJsonResponse(aiResponse);
      console.log('정제된 응답:', cleanedResponse);
      
      const parsed = JSON.parse(cleanedResponse);
      suggestions = parsed.suggestions || [];
      analysis = parsed.analysis || null;
      
      // 품질 검증: 각 제안의 필수 필드 확인
      suggestions = suggestions.map((suggestion: any) => ({
        label: suggestion.label || '제안 아이디어',
        type: suggestion.type || 'idea',
        description: suggestion.description || '상세 설명 필요',
        priority: suggestion.priority || 'medium',
        complexity: suggestion.complexity || 'moderate', 
        value: suggestion.value || '가치 분석 필요'
      }));
      
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      console.log('원본 응답:', aiResponse);
      
      // 추가 파싱 시도: 더 관대한 방법들
      try {
        // 1. 정규식으로 JSON 부분만 추출 시도
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          console.log('정규식으로 JSON 추출 시도...');
          const extractedJson = parseJsonResponse(jsonMatch[0]);
          const parsed = JSON.parse(extractedJson);
          suggestions = parsed.suggestions || [];
          analysis = parsed.analysis || null;
          console.log('정규식 추출 성공!');
        } else {
          throw new Error('JSON 구조를 찾을 수 없음');
        }
      } catch (secondParseError) {
        console.error('두 번째 파싱 시도도 실패:', secondParseError);

        // 2. 텍스트에서 키워드 기반 정보 추출 시도
        try {
          console.log('텍스트 파싱 시도...');
          const textParsedSuggestions = extractSuggestionsFromText(aiResponse, selectedNode);
          if (textParsedSuggestions.length > 0) {
            suggestions = textParsedSuggestions;
            analysis = {
              nodeContext: `${selectedNode.data.label} 노드에 대한 확장 제안을 텍스트 분석을 통해 추출했습니다.`,
              expansionDirection: `${selectedNode.data.type} 타입의 노드를 중심으로 한 실용적 확장`,
              reasoning: "AI 응답에서 핵심 키워드와 아이디어를 추출하여 구조화했습니다."
            };
            console.log('텍스트 파싱 성공! 제안 수:', textParsedSuggestions.length);
          } else {
            throw new Error('텍스트 파싱도 실패');
          }
        } catch (textParseError) {
          console.error('텍스트 파싱도 실패:', textParseError);
          // 최후의 수단: 노드별 기본 제안 사용
          console.log('기본 제안 사용...');
          suggestions = getDefaultSuggestions(selectedNode);
        }
      }
      
    }

    // 빈 배열이면 기본 제안 반환
    if (!suggestions || suggestions.length === 0) {
      suggestions = getDefaultSuggestions(selectedNode);
    }

    console.log('=== 최종 제안 ===');
    console.log('제안 수:', suggestions.length);

    return NextResponse.json({
      success: true,
      suggestions,
      analysis,
      tokensUsed,
      metadata: {
        generatedAt: new Date().toISOString(),
        nodeType: selectedNode.data.type,
        expandMode: mode,
        suggestionsCount: suggestions.length,
        hasAnalysis: !!analysis
      }
    });

  } catch (error) {
    console.error('마인드맵 AI 확장 오류:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: '아이디어 확장 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}