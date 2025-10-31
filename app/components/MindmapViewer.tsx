'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  NodeTypes,
  ReactFlowInstance,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Lightbulb, FileText, Sparkles, Target, Wrench, Settings, X, ChevronUp, ChevronDown, Edit3, Trash2, Eye, ArrowUp, ArrowDown, Save, Upload, Download, MessageSquare } from 'lucide-react';
import { getApiKey } from '@/app/lib/apiKeyStorage';
import MindmapChat from './MindmapChat';

// 노드 타입 정의
interface MindmapNodeData {
  label: string;
  type: 'root' | 'node';
  description?: string;
  color?: string; // 노드 색상 (기본값: gray)
  isEditing?: boolean;
  isEmpty?: boolean;
  isNewNode?: boolean;
}

// 커스텀 노드 컴포넌트
const CustomNode = ({ 
  data, 
  selected, 
  id 
}: { 
  data: MindmapNodeData; 
  selected: boolean;
  id: string;
}) => {
  const [isEditing, setIsEditing] = React.useState(data.isEditing || data.isEmpty || false);
  const [editLabel, setEditLabel] = React.useState(data.label);
  const [editDescription, setEditDescription] = React.useState(data.description || '');
  const [editType, setEditType] = React.useState(data.type);
  const [editColor, setEditColor] = React.useState(data.color || 'gray');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const descriptionRef = React.useRef<HTMLTextAreaElement>(null);
  
  // 편집 모드 진입 시 포커스 및 data.isEditing 변경 감지
  React.useEffect(() => {
    if (data.isEditing !== undefined) {
      setIsEditing(data.isEditing);
    }
  }, [data.isEditing]);

  // 설명 textarea 자동 크기 조절
  const adjustTextareaHeight = React.useCallback(() => {
    if (descriptionRef.current) {
      // 먼저 높이를 초기화
      descriptionRef.current.style.height = 'auto';
      // 컨텐츠에 맞게 높이 설정 (최대 100px)
      const newHeight = Math.min(descriptionRef.current.scrollHeight, 100);
      descriptionRef.current.style.height = newHeight + 'px';
    }
  }, []);
  
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (data.isEmpty) {
        inputRef.current.select();
      }
    }
    // 편집 모드 시작할 때 textarea 높이도 조절
    if (isEditing) {
      setTimeout(() => {
        adjustTextareaHeight();
      }, 10); // DOM 업데이트 후 실행
    }
  }, [isEditing, data.isEmpty, adjustTextareaHeight]);

  // 편집 상태나 설명 내용이 바뀔 때마다 높이 조절
  React.useEffect(() => {
    if (isEditing) {
      adjustTextareaHeight();
    }
  }, [isEditing, editDescription, adjustTextareaHeight]);

  // textarea가 렌더링된 후 높이 조절 (편집 시작 시)
  React.useEffect(() => {
    if (isEditing && descriptionRef.current) {
      // requestAnimationFrame을 사용해서 DOM이 완전히 업데이트된 후 실행
      requestAnimationFrame(() => {
        adjustTextareaHeight();
      });
    }
  }, [isEditing, adjustTextareaHeight]);

  // 노드 업데이트 함수 (부모 컴포넌트에서 전달받아야 함)
  const updateNode = React.useCallback((updates: Partial<MindmapNodeData>) => {
    // 이벤트를 통해 부모 컴포넌트에 전달
    const event = new CustomEvent('updateNode', {
      detail: { nodeId: id, updates }
    });
    window.dispatchEvent(event);
  }, [id]);

  // 편집 저장
  const saveEdit = React.useCallback(() => {
    if (!editLabel.trim()) return;

    console.log('saveEdit 호출됨');

    // 즉시 로컬 상태 업데이트
    setIsEditing(false);

    // 부모 컴포넌트에 업데이트 전달
    updateNode({
      label: editLabel.trim(),
      description: editDescription.trim() || undefined,
      type: editType,
      color: editColor,
      isEditing: false,
      isEmpty: false
    });
  }, [editLabel, editDescription, editType, editColor, updateNode]);

  // 편집 취소
  const cancelEdit = React.useCallback(() => {
    console.log('cancelEdit 호출됨');
    
    if (data.isEmpty) {
      // 빈 노드였다면 삭제
      const event = new CustomEvent('deleteNode', {
        detail: { nodeId: id }
      });
      window.dispatchEvent(event);
    } else {
      // 즉시 로컬 상태 업데이트
      setIsEditing(false);
      setEditLabel(data.label);
      setEditDescription(data.description || '');
      setEditType(data.type);
      
      // 부모 컴포넌트에 편집 취소 상태 전달
      updateNode({
        isEditing: false
      });
    }
  }, [data.isEmpty, data.label, data.description, data.type, id, updateNode]);

  // 키보드 이벤트 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
    // Shift+Enter는 기본 동작(줄넘김) 허용
  };
  const getNodeIcon = () => {
    switch (data.type) {
      case 'root': return <Target className="w-4 h-4" />;
      case 'idea': return <Lightbulb className="w-4 h-4" />;
      case 'feature': return <Sparkles className="w-4 h-4" />;
      case 'problem': return <FileText className="w-4 h-4" />;
      case 'solution': return <Wrench className="w-4 h-4" />;
      case 'detail': return <Settings className="w-4 h-4" />;
      default: return <Plus className="w-4 h-4" />;
    }
  };

  const getNodeColor = () => {
    if (data.type === 'root') {
      return 'bg-blue-500 text-white border-blue-600';
    }

    const color = data.color || 'gray';
    switch (color) {
      case 'gray': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'red': return 'bg-red-100 text-red-800 border-red-300';
      case 'orange': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'green': return 'bg-green-100 text-green-800 border-green-300';
      case 'blue': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'purple': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'pink': return 'bg-pink-100 text-pink-800 border-pink-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getCategoryLabel = () => {
    switch (data.type) {
      case 'root': return '메인';
      case 'node': return '노드';
      default: return '노드';
    }
  };

  if (isEditing) {
    // 편집 모드
    return (
      <div 
        className={`
          relative px-3 py-3 shadow-lg rounded-lg border-2 min-w-[200px] max-w-[280px]
          bg-white border-blue-400 ring-2 ring-blue-200
          transition-all duration-200
        `}
        onMouseDown={(e) => e.stopPropagation()}
        onDragStart={(e) => e.preventDefault()}
      >
        {/* 상위 노드 연결점 - 숨김 처리 (edge 연결용) */}
        {editType !== 'root' && (
          <Handle
            type="target"
            position={Position.Top}
            className="opacity-0 pointer-events-none"
            style={{ top: 0 }}
          />
        )}

        <div className="space-y-2">
          {/* 제목 입력 */}
          <div className="flex items-center gap-2">
            <div className="text-blue-600 flex-shrink-0">
              {(() => {
                switch (editType) {
                  case 'root': return <Target className="w-3 h-3" />;
                  case 'idea': return <Lightbulb className="w-3 h-3" />;
                  case 'feature': return <Sparkles className="w-3 h-3" />;
                  case 'problem': return <FileText className="w-3 h-3" />;
                  case 'solution': return <Wrench className="w-3 h-3" />;
                  case 'detail': return <Settings className="w-3 h-3" />;
                  default: return <Plus className="w-3 h-3" />;
                }
              })()}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onKeyDown={handleKeyDown}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onMouseMove={(e) => {
                if (e.buttons === 1) { // 마우스 왼쪽 버튼이 눌린 상태
                  e.stopPropagation();
                }
              }}
              onDragStart={(e) => e.preventDefault()}
              placeholder="노드 제목을 입력하세요..."
              className="flex-1 px-2 py-1 text-sm font-semibold bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          {/* 설명 입력 */}
          <textarea
            ref={descriptionRef}
            value={editDescription}
            onChange={(e) => {
              setEditDescription(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleDescriptionKeyDown}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onMouseMove={(e) => {
              if (e.buttons === 1) { // 마우스 왼쪽 버튼이 눌린 상태
                e.stopPropagation();
              }
            }}
            onDragStart={(e) => e.preventDefault()}
            placeholder="설명 (선택사항)"
            className="w-full px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 resize-none overflow-hidden"
            rows={1}
            style={{ minHeight: '28px', maxHeight: '100px' }}
          />

          {/* 색상 선택 - root가 아닌 경우에만 표시 */}
          {editType !== 'root' && (
            <div>
              <label className="block text-xs text-gray-600 mb-1">노드 색상</label>
              <div className="flex gap-2 flex-wrap">
                {['gray', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setEditColor(color)}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      editColor === color ? 'border-blue-500 scale-110' : 'border-gray-300'
                    }`}
                    style={{
                      backgroundColor: color === 'gray' ? '#e5e7eb' :
                                      color === 'red' ? '#fee2e2' :
                                      color === 'orange' ? '#fed7aa' :
                                      color === 'yellow' ? '#fef3c7' :
                                      color === 'green' ? '#d1fae5' :
                                      color === 'blue' ? '#dbeafe' :
                                      color === 'purple' ? '#e9d5ff' :
                                      '#fce7f3'
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 저장/취소 버튼 */}
          <div className="flex gap-1 pt-1">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                (e.nativeEvent as any).stopImmediatePropagation?.();
                if (editLabel.trim()) {
                  setTimeout(() => saveEdit(), 0);
                }
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              disabled={!editLabel.trim()}
              className="flex-1 px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              저장
            </button>
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                (e.nativeEvent as any).stopImmediatePropagation?.();
                setTimeout(() => cancelEdit(), 0);
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="flex-1 px-2 py-1 text-xs font-medium bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              취소
            </button>
          </div>
        </div>

        {/* 하위 노드 연결점 - 숨김 처리 (edge 연결용) */}
        <Handle
          type="source"
          position={Position.Bottom}
          className="opacity-0 pointer-events-none"
          style={{ bottom: 0 }}
        />
      </div>
    );
  }

  // 일반 보기 모드
  return (
    <div 
      className={`
        relative px-3 py-2 shadow-lg rounded-lg border-2 min-w-[120px] cursor-pointer
        ${getNodeColor()}
        ${selected ? 'ring-2 ring-blue-400' : ''}
        ${data.isNewNode ? 'node-pop' : ''}
        transition-all duration-200 hover:shadow-xl
      `}
      style={{ width: 'auto', maxWidth: '300px' }}
      onDoubleClick={() => setIsEditing(true)}
    >
      {/* 상위 노드 연결점 - 숨김 처리 (edge 연결용) */}
      {data.type !== 'root' && (
        <Handle
          type="target"
          position={Position.Top}
          className="opacity-0 pointer-events-none"
          style={{ top: 0 }}
        />
      )}

      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {getNodeIcon()}
          <span className="font-semibold text-sm break-words leading-tight" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>{data.label}</span>
        </div>
        <div className="text-xs px-2 py-0.5 rounded-full bg-black/10 opacity-75 whitespace-nowrap flex-shrink-0">
          {getCategoryLabel()}
        </div>
      </div>
      {data.description && (
        <p className="text-xs opacity-80 leading-relaxed break-words" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
          {data.description}
        </p>
      )}

      {/* 하위 노드 연결점 - 숨김 처리 (edge 연결용) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0 pointer-events-none"
        style={{ bottom: 0 }}
      />
    </div>
  );
};

// 컴포넌트 외부로 이동하여 메모이제이션
const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

interface MindmapViewerProps {
  initialPrompt?: string;
  onGeneratePlan?: (mindmapData: { nodes: Node[]; edges: Edge[]; focusNode?: any }) => void;
  onBack?: () => void;
}

const MindmapViewer: React.FC<MindmapViewerProps> = ({
  initialPrompt = '',
  onGeneratePlan,
  onBack
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [newNodeText, setNewNodeText] = useState('');
  const [newNodeDescription, setNewNodeDescription] = useState('');
  const [newNodeType, setNewNodeType] = useState<MindmapNodeData['type']>('idea');
  const [isAiExpanding, setIsAiExpanding] = useState(false);
  const [isFloatingPanelOpen, setIsFloatingPanelOpen] = useState(false);
  const [showAiConfirmModal, setShowAiConfirmModal] = useState(false);
  const [aiExpandMode, setAiExpandMode] = useState<'simple' | 'advanced' | 'auto'>('simple');
  const [aiExpandCategory, setAiExpandCategory] = useState<MindmapNodeData['type'] | 'mixed'>('mixed');
  const [aiExpandPrompt, setAiExpandPrompt] = useState('');
  const [aiExpandScope, setAiExpandScope] = useState<'narrow' | 'broad' | 'creative'>('broad');
  const [aiExpandCount, setAiExpandCount] = useState(3);
  const [aiDetermineCount, setAiDetermineCount] = useState(false);
  const [isAutoSetupRunning, setIsAutoSetupRunning] = useState(false);
  const [showAutoSetupOption, setShowAutoSetupOption] = useState(false);
  const [isFloatingPanelCollapsed, setIsFloatingPanelCollapsed] = useState(false);
  const [floatingPanelPosition, setFloatingPanelPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, nodeId?: string, edgeId?: string} | null>(null);
  const [newNodeIds, setNewNodeIds] = useState<Set<string>>(new Set());
  const [fixedBottomPosition, setFixedBottomPosition] = useState<number | null>(null);
  const floatingPanelRef = useRef<HTMLDivElement>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // 개선된 노드 배치 알고리즘 - 확장 범위 순으로 자연스럽게 배치
  const findNonOverlappingPosition = useCallback((
    basePosition: { x: number; y: number },
    existingNodes: Node[],
    nodeIndex: number = 0,
    totalNodes: number = 1,
    nodeWidth: number = 200,
    nodeHeight: number = 80,
    minDistance: number = 40
  ) => {
    // 1단계: 확장 범위에 따른 기본 배치 전략
    const isMultipleNodes = totalNodes > 1;
    const baseDistance = 180; // 부모에서 자식까지의 기본 거리
    const spreadAngle = Math.min(120, totalNodes * 25); // 최대 120도까지 확산
    
    if (isMultipleNodes) {
      // 여러 노드인 경우: 부모 노드 중심으로 부채꼴 형태로 배치
      const angleStep = spreadAngle / Math.max(1, totalNodes - 1);
      const startAngle = -spreadAngle / 2; // 중앙 기준으로 좌우 대칭
      const nodeAngle = startAngle + (nodeIndex * angleStep);
      
      // 각도를 라디안으로 변환
      const radians = (nodeAngle * Math.PI) / 180;
      
      // 기본 위치 계산
      let targetPosition = {
        x: basePosition.x + Math.cos(radians) * baseDistance,
        y: basePosition.y + Math.sin(radians) * baseDistance
      };
      
      // 2단계: 겹침 방지를 위한 미세 조정
      let adjustmentAttempts = 0;
      const maxAdjustments = 20;
      
      while (adjustmentAttempts < maxAdjustments) {
        const isOverlapping = existingNodes.some(node => {
          const dx = Math.abs(node.position.x - targetPosition.x);
          const dy = Math.abs(node.position.y - targetPosition.y);
          return dx < (nodeWidth + minDistance) && dy < (nodeHeight + minDistance);
        });
        
        if (!isOverlapping) {
          return targetPosition;
        }
        
        // 겹치는 경우: 거리를 점진적으로 늘리거나 각도를 미세 조정
        adjustmentAttempts++;
        const adjustmentDistance = baseDistance + (adjustmentAttempts * 20);
        const angleAdjustment = (adjustmentAttempts % 2 === 0 ? 1 : -1) * (adjustmentAttempts * 5);
        const adjustedAngle = nodeAngle + angleAdjustment;
        const adjustedRadians = (adjustedAngle * Math.PI) / 180;
        
        targetPosition = {
          x: basePosition.x + Math.cos(adjustedRadians) * adjustmentDistance,
          y: basePosition.y + Math.sin(adjustedRadians) * adjustmentDistance
        };
      }
      
      return targetPosition;
    } else {
      // 단일 노드인 경우: 부모 바로 아래 배치
      const singleNodePosition = {
        x: basePosition.x,
        y: basePosition.y + baseDistance
      };
      
      // 겹침 확인
      const isOverlapping = existingNodes.some(node => {
        const dx = Math.abs(node.position.x - singleNodePosition.x);
        const dy = Math.abs(node.position.y - singleNodePosition.y);
        return dx < (nodeWidth + minDistance) && dy < (nodeHeight + minDistance);
      });
      
      if (!isOverlapping) {
        return singleNodePosition;
      }
      
      // 겹치는 경우 좌우로 이동
      return {
        x: basePosition.x + (nodeIndex % 2 === 0 ? -100 : 100),
        y: basePosition.y + baseDistance
      };
    }
  }, []);
  
  // 실행 취소/재실행을 위한 히스토리
  const [history, setHistory] = useState<{nodes: Node[], edges: Edge[]}[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // 초기 노드와 엣지
  const initialNodes: Node[] = useMemo(() => [
    {
      id: '1',
      type: 'custom',
      position: { x: 250, y: 150 },
      data: { 
        label: initialPrompt || '프로젝트 아이디어',
        type: 'root',
        description: '메인 아이디어'
      },
    },
  ], [initialPrompt]);

  const initialEdges: Edge[] = useMemo(() => [], []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 히스토리에 현재 상태 저장
  const saveToHistory = useCallback(() => {
    const currentState = { nodes: [...nodes], edges: [...edges] };
    setHistory(prev => {
      // 현재 인덱스 이후의 히스토리 제거 (새로운 작업 시)
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(currentState);
      // 히스토리 최대 50개로 제한
      return newHistory.slice(-50);
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [nodes, edges, historyIndex]);

  // 실행 취소
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // 재실행
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(prev => prev + 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // 마인드맵 저장
  const saveMindmap = useCallback(() => {
    const mindmapData = {
      nodes,
      edges,
      timestamp: new Date().toISOString(),
      title: nodes.find(n => n.data.type === 'root')?.data.label || '제목 없음'
    };

    const dataStr = JSON.stringify(mindmapData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `mindmap_${mindmapData.title}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    // 메모리 정리
    URL.revokeObjectURL(link.href);
  }, [nodes, edges]);

  // 마인드맵 불러오기
  const loadMindmap = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);

          // 데이터 유효성 검사
          if (data.nodes && data.edges && Array.isArray(data.nodes) && Array.isArray(data.edges)) {
            // 구 타입을 새 타입으로 마이그레이션
            const migratedNodes = data.nodes.map((node: any) => {
              const oldType = node.data?.type;
              let newType: 'root' | 'node' = 'node';

              if (oldType === 'root') {
                newType = 'root';
              } else if (['idea', 'feature', 'detail', 'problem', 'solution'].includes(oldType)) {
                newType = 'node';
              }

              return {
                ...node,
                data: {
                  ...node.data,
                  type: newType
                }
              };
            });

            setNodes(migratedNodes);
            setEdges(data.edges);

            // 히스토리 초기화
            setHistory([{ nodes: migratedNodes, edges: data.edges }]);
            setHistoryIndex(0);

            console.log('마인드맵이 성공적으로 로드되었습니다.');
          } else {
            console.error('잘못된 마인드맵 파일 형식입니다.');
            alert('잘못된 마인드맵 파일 형식입니다.');
          }
        } catch (error) {
          console.error('파일 읽기 오류:', error);
          alert('파일을 읽는 중 오류가 발생했습니다.');
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  }, [setNodes, setEdges]);

  // 새 노드 애니메이션 제거
  useEffect(() => {
    if (newNodeIds.size > 0) {
      const timeouts: NodeJS.Timeout[] = [];
      
      newNodeIds.forEach(nodeId => {
        const timeout = setTimeout(() => {
          // 애니메이션이 끝난 후 isNewNode 제거
          setNodes(nds => nds.map(n => 
            n.id === nodeId 
              ? { ...n, data: { ...n.data, isNewNode: false } }
              : n
          ));
          
          // 추적 상태에서 제거
          setNewNodeIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(nodeId);
            return newSet;
          });
        }, 400); // CSS 애니메이션 시간과 일치
        
        timeouts.push(timeout);
      });
      
      return () => {
        timeouts.forEach(timeout => clearTimeout(timeout));
      };
    }
  }, [newNodeIds, setNodes]);

  // 초기 상태를 히스토리에 저장
  useEffect(() => {
    if (history.length === 0) {
      setHistory([{ nodes: [...initialNodes], edges: [...initialEdges] }]);
      setHistoryIndex(0);
    }
  }, [history.length, initialNodes, initialEdges]);

  // 로컬스토리지에서 마인드맵 데이터 로드
  useEffect(() => {
    const loadedData = localStorage.getItem('loadedMindmapData');
    if (loadedData) {
      try {
        const data = JSON.parse(loadedData);
        if (data.nodes && data.edges && Array.isArray(data.nodes) && Array.isArray(data.edges)) {
          setNodes(data.nodes);
          setEdges(data.edges);
          
          // 히스토리 초기화
          setHistory([{ nodes: data.nodes, edges: data.edges }]);
          setHistoryIndex(0);
          
          console.log('로컬스토리지에서 마인드맵 데이터를 성공적으로 로드했습니다.');
        }
        // 사용한 데이터 제거
        localStorage.removeItem('loadedMindmapData');
      } catch (error) {
        console.error('로컬스토리지 마인드맵 데이터 로드 오류:', error);
        localStorage.removeItem('loadedMindmapData');
      }
    }
  }, [setNodes, setEdges]);

  // 노드의 깊이를 계산하는 함수
  const getNodeDepth = useCallback((nodeId: string, visitedNodes = new Set<string>()): number => {
    if (visitedNodes.has(nodeId)) return 0; // 순환 방지
    visitedNodes.add(nodeId);
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node || node.data.type === 'root') return 0;
    
    // 부모 노드 찾기
    const parentEdge = edges.find(edge => edge.target === nodeId);
    if (!parentEdge) return 0;
    
    return 1 + getNodeDepth(parentEdge.source, visitedNodes);
  }, [nodes, edges]);

  // 깊이에 따른 연결선 스타일 결정 (임시 노드/엣지 고려 가능)
  const getEdgeStyleWithTemp = useCallback((sourceNodeId: string, tempNodes: Node[] = [], tempEdges: Edge[] = []) => {
    // 임시 노드/엣지를 포함한 전체 노드/엣지 배열
    const allNodes = [...nodes, ...tempNodes];
    const allEdges = [...edges, ...tempEdges];
    
    const getDepthWithTemp = (nodeId: string, visitedNodes = new Set<string>()): number => {
      if (visitedNodes.has(nodeId)) return 0;
      visitedNodes.add(nodeId);
      
      const node = allNodes.find(n => n.id === nodeId);
      if (!node || node.data.type === 'root') return 0;
      
      const parentEdge = allEdges.find(edge => edge.target === nodeId);
      if (!parentEdge) return 0;
      
      return 1 + getDepthWithTemp(parentEdge.source, visitedNodes);
    };
    
    const depth = getDepthWithTemp(sourceNodeId);
    
    const colorsByDepth = [
      '#6366f1', // 0: 보라색 (루트)
      '#10b981', // 1: 초록색 (1단계)
      '#3b82f6', // 2: 파란색 (2단계)
      '#f59e0b', // 3: 주황색 (3단계)
      '#ef4444', // 4: 빨간색 (4단계)
      '#8b5cf6', // 5: 보라색 (5단계)
      '#06b6d4', // 6: 청록색 (6단계 이상)
    ];
    
    return {
      stroke: colorsByDepth[Math.min(depth + 1, colorsByDepth.length - 1)],
      strokeWidth: 2,
      strokeDasharray: 'none'
    };
  }, [nodes, edges]);
  
  // 기본 엣지 스타일 함수 (호환성을 위해 유지)
  const getEdgeStyle = useCallback((sourceNodeId: string) => {
    return getEdgeStyleWithTemp(sourceNodeId, [], []);
  }, [getEdgeStyleWithTemp]);

  // 엣지 연결 처리
  const onConnect = useCallback(
    (params: Connection) => {
      // 변경 전 상태 저장
      saveToHistory();
      
      // 소스 노드 기반으로 레이어별 색상 적용
      const edgeStyle = params.source ? getEdgeStyle(params.source) : {
        stroke: '#6366f1',
        strokeWidth: 2,
        strokeDasharray: 'none'
      };
      
      // 연결될 때 레이어 기반 스타일을 적용한 엣지 생성
      const newEdge = {
        ...params,
        type: 'smoothstep',
        style: edgeStyle,
        animated: false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeStyle.stroke,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, saveToHistory, getEdgeStyle]
  );

  // 편집 중인 모든 노드의 편집 상태 해제 (특정 노드 제외 가능)
  const deactivateAllEditing = useCallback((exceptNodeId?: string) => {
    setNodes(nds => nds.map(n => ({
      ...n,
      data: { 
        ...n.data, 
        isEditing: exceptNodeId && n.id === exceptNodeId ? n.data.isEditing : false 
      }
    })));
  }, [setNodes]);

  // 노드 선택 처리
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setIsAddingNode(false);
    
    // ReactFlow 노드 선택 상태 업데이트
    setNodes(nds => nds.map(n => ({
      ...n,
      selected: n.id === node.id
    })));
  }, [setNodes]);

  // 노드 드래그 시작 시 선택 처리
  const onNodeDragStart = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setIsAddingNode(false);
  }, []);

  // 노드 드래그 중에도 선택 상태 유지
  const onNodeDrag = useCallback((event: React.MouseEvent, node: Node) => {
    // 드래그 중인 노드가 선택된 노드가 아니라면 선택
    if (selectedNodeId !== node.id) {
      setSelectedNodeId(node.id);
    }
  }, [selectedNodeId]);

  // 노드 드래그 완료 시에도 선택 상태 유지
  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    // 드래그 완료 후에도 선택 상태 유지
    setSelectedNodeId(node.id);
  }, []);

  // 빈 공간 클릭 처리
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setContextMenu(null);
    setIsAddingNode(false);
  }, []);

  // 배경 우클릭 방지
  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
  }, []);

  // 엣지 클릭 처리
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
    setContextMenu(null);
  }, []);

  // 우클릭 컨텍스트 메뉴
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    
    // 우클릭한 노드 선택
    setSelectedNodeId(node.id);
    
    // ReactFlow 노드 선택 상태 업데이트
    setNodes(nds => nds.map(n => ({
      ...n,
      selected: n.id === node.id
    })));
    
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id
    });
  }, [setNodes]);

  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      edgeId: edge.id
    });
  }, []);

  // 엣지 삭제
  const deleteEdge = useCallback((edgeId: string) => {
    // 변경 전 상태 저장
    saveToHistory();
    
    setEdges((eds) => eds.filter(edge => edge.id !== edgeId));
    setSelectedEdgeId(null);
    setContextMenu(null);
  }, [setEdges, saveToHistory]);

  // 노드 더블클릭으로 편집 모드
  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setIsFloatingPanelOpen(false);
    
    // 새로운 노드를 편집할 때만 다른 노드들의 편집 해제
    setNodes(nds => nds.map(n => 
      n.id === node.id 
        ? { ...n, data: { ...n.data, isEditing: true } }
        : { ...n, data: { ...n.data, isEditing: false } }
    ));
  }, [setNodes]);

  // 빈 노드 추가 (인라인 편집용)
  const addEmptyNode = useCallback(() => {
    if (!selectedNodeId) return;

    const selectedNode = nodes.find(n => n.id === selectedNodeId);
    if (!selectedNode) return;

    // 변경 전 상태 저장
    saveToHistory();

    const newNodeId = `empty_${Date.now()}`;
    const basePosition = {
      x: selectedNode.position.x,
      y: selectedNode.position.y + 150
    };
    
    const newPosition = findNonOverlappingPosition(basePosition, nodes, 0, 1);
    
    const newNode: Node = {
      id: newNodeId,
      type: 'custom',
      position: newPosition,
      data: {
        label: '새 노드',
        type: 'idea',
        description: undefined,
        isEmpty: true,
        isEditing: true,
        isNewNode: true
      },
    };

    // 새 노드 애니메이션 추가
    setNewNodeIds(prev => {
      const newSet = new Set(prev);
      newSet.add(newNodeId);
      return newSet;
    });

    const edgeStyle = getEdgeStyle(selectedNodeId);
    const newEdge: Edge = {
      id: `${selectedNodeId}-${newNodeId}`,
      source: selectedNodeId,
      target: newNodeId,
      type: 'smoothstep',
      style: edgeStyle,
      animated: false,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edgeStyle.stroke,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [...eds, newEdge]);
    setSelectedNodeId(newNodeId); // 새 노드 선택
  }, [selectedNodeId, nodes, setNodes, setEdges, saveToHistory, findNonOverlappingPosition, getEdgeStyle]);

  // 기존 새 노드 추가 (플로팅 메뉴용)
  const addNewNode = useCallback(() => {
    if (!newNodeText.trim() || !selectedNodeId) return;

    const selectedNode = nodes.find(n => n.id === selectedNodeId);
    if (!selectedNode) return;

    // 변경 전 상태 저장
    saveToHistory();

    const newNodeId = `${Date.now()}`;
    const basePosition = {
      x: selectedNode.position.x,
      y: selectedNode.position.y + 150
    };
    
    const newPosition = findNonOverlappingPosition(basePosition, nodes, 0, 1);
    
    const newNode: Node = {
      id: newNodeId,
      type: 'custom',
      position: newPosition,
      data: {
        label: newNodeText,
        type: newNodeType,
        description: newNodeDescription.trim() || undefined,
        isNewNode: true
      },
    };

    // 새 노드 애니메이션 추가
    setNewNodeIds(prev => {
      const newSet = new Set(prev);
      newSet.add(newNodeId);
      return newSet;
    });

    const edgeStyle = getEdgeStyle(selectedNodeId);
    const newEdge: Edge = {
      id: `${selectedNodeId}-${newNodeId}`,
      source: selectedNodeId,
      target: newNodeId,
      type: 'smoothstep',
      style: edgeStyle,
      animated: false,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edgeStyle.stroke,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [...eds, newEdge]);
    setNewNodeText('');
    setNewNodeDescription('');
    setIsAddingNode(false);
  }, [newNodeText, newNodeType, newNodeDescription, selectedNodeId, nodes, setNodes, setEdges, saveToHistory, findNonOverlappingPosition, getEdgeStyle]);


  // 노드 삭제
  const deleteNode = useCallback(() => {
    if (!selectedNodeId) return;
    
    // 루트 노드는 삭제 불가
    const selectedNode = nodes.find(n => n.id === selectedNodeId);
    if (selectedNode?.data.type === 'root') {
      alert('루트 노드는 삭제할 수 없습니다.');
      return;
    }

    // 변경 전 상태 저장
    saveToHistory();

    // 노드와 연결된 엣지 모두 삭제
    setNodes((nds) => nds.filter(node => node.id !== selectedNodeId));
    setEdges((eds) => eds.filter(edge => 
      edge.source !== selectedNodeId && edge.target !== selectedNodeId
    ));
    
    setSelectedNodeId(null);
  }, [selectedNodeId, nodes, setNodes, setEdges, saveToHistory]);

  // AI 아이디어 확장 (실제 API 호출)
  const expandWithAI = useCallback(async (targetNodeId?: string) => {
    const nodeId = targetNodeId || selectedNodeId;
    if (!nodeId || isAiExpanding) return;

    const selectedNode = nodes.find(n => n.id === nodeId);
    if (!selectedNode) return;

    setIsAiExpanding(true);
    
    // 선택된 노드로 화면 포커싱 유지
    if (reactFlowInstance) {
      reactFlowInstance.setCenter(
        selectedNode.position.x + 100,
        selectedNode.position.y + 50,
        { zoom: reactFlowInstance.getZoom(), duration: 300 }
      );
    }
    
    try {
      const currentRootNode = nodes.find(n => n.data.type === 'root');
      
      // 선택된 노드까지의 전체 계층 경로 구축
      const getNodePath = (nodeId: string): Node[] => {
        const path: Node[] = [];
        let currentNodeId = nodeId;
        
        // 상위 노드를 찾아가며 경로 구축
        while (currentNodeId) {
          const currentNode = nodes.find(n => n.id === currentNodeId);
          if (currentNode) {
            path.unshift(currentNode); // 앞쪽에 추가해서 루트부터 시작하는 순서로
            
            // 상위 노드 찾기 (이 노드를 타겟으로 하는 엣지의 source)
            const parentEdge = edges.find(edge => edge.target === currentNodeId);
            currentNodeId = parentEdge?.source || '';
          } else {
            break;
          }
        }
        
        return path;
      };
      
      const nodePath = getNodePath(selectedNode.id);
      
      // 계층 구조를 포함한 컨텍스트 생성
      const hierarchyInfo = nodePath.length > 1 
        ? `\n\n**노드 계층 경로:**\n${nodePath.map((node, index) => {
            const indent = '  '.repeat(index);
            const arrow = index > 0 ? '└─ ' : '';
            return `${indent}${arrow}${node.data.label} (${node.data.type})${node.data.description ? ` - ${node.data.description}` : ''}`;
          }).join('\n')}`
        : '';
      
      const currentContext = `프로젝트 주제: ${currentRootNode?.data.label || initialPrompt}\n현재 선택된 노드: "${selectedNode.data.label}" (${selectedNode.data.description || '설명 없음'})${hierarchyInfo}`;
      
      console.log('=== AI 확장 요청 시작 ===');
      console.log('현재 루트 노드:', currentRootNode?.data.label);
      console.log('노드 계층 경로:', nodePath.map(n => n.data.label).join(' → '));
      console.log('전달할 컨텍스트:', currentContext);

      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error('API 키가 설정되지 않았습니다. 홈 화면에서 API 키를 입력해주세요.');
      }

      const response = await fetch('/api/mindmap/expand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedNode,
          context: currentContext,
          apiKey,
          expandOptions: {
            mode: aiExpandMode,
            category: aiExpandCategory,
            prompt: aiExpandPrompt,
            scope: aiExpandScope,
            count: aiExpandCount,
            aiDetermineCount: aiDetermineCount,
            autoSetup: showAutoSetupOption
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`AI 확장 API 오류: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'AI 확장에 실패했습니다.');
      }

      console.log('=== AI 확장 응답 ===');
      console.log('제안 수:', data.suggestions?.length || 0);
      console.log('사용된 토큰:', data.tokensUsed || 0);

      const aiSuggestions = data.suggestions || [];
      
      if (aiSuggestions.length === 0) {
        alert('AI가 제안할 아이디어를 찾지 못했습니다. 다시 시도해보세요.');
        return;
      }

      const newNodes: Node[] = [];
      aiSuggestions.forEach((suggestion: any, index: number) => {
        const newNodeId = `ai_${Date.now()}_${index}`;
        const basePosition = {
          x: selectedNode.position.x,
          y: selectedNode.position.y + 150,
        };
        
        const newPosition = findNonOverlappingPosition(basePosition, [...nodes, ...newNodes], index, aiSuggestions.length);
        
        newNodes.push({
          id: newNodeId,
          type: 'custom',
          position: newPosition,
          data: {
            label: suggestion.label,
            type: suggestion.type || 'idea',
            description: suggestion.description || undefined,
            isNewNode: true
          },
        });
        
        // 새 노드 애니메이션 추가
        setNewNodeIds(prev => {
          const newSet = new Set(prev);
          newSet.add(newNodeId);
          return newSet;
        });
      });

      // 레이어 기반 스타일 사용
      const edgeStyle = getEdgeStyle(selectedNodeId);
      const newEdges: Edge[] = newNodes.map(node => ({
        id: `${selectedNodeId}-${node.id}`,
        source: selectedNodeId,
        target: node.id,
        type: 'smoothstep',
        style: edgeStyle,
        animated: false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeStyle.stroke,
        },
      }));

      // 변경 전 상태 저장
      saveToHistory();
      
      setNodes((nds) => [...nds, ...newNodes]);
      setEdges((eds) => [...eds, ...newEdges]);
      
      console.log('=== AI 확장 완료 ===');
      
    } catch (error) {
      console.error('AI 확장 오류:', error);
      alert(`AI 확장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsAiExpanding(false);
    }
  }, [selectedNodeId, nodes, setNodes, setEdges, isAiExpanding, aiExpandMode, aiExpandCategory, aiExpandPrompt, aiExpandScope, aiExpandCount, aiDetermineCount, showAutoSetupOption, saveToHistory, findNonOverlappingPosition, reactFlowInstance, initialPrompt, edges, getEdgeStyle]);

  // 채팅 명령어 처리 (현재 선택된 노드 ID를 추적)
  const handleChatCommand = useCallback(async (command: any, currentSelectedId?: string) => {
    console.log('채팅 명령어 수신:', command);

    // 현재 선택된 노드 ID (파라미터로 받거나 state 사용)
    const activeNodeId = currentSelectedId || selectedNodeId;

    try {
      switch (command.action) {
        case 'select_node': {
          const nodeLabel = command.params?.nodeLabel;
          if (!nodeLabel) {
            alert('노드 이름이 필요합니다.');
            return null;
          }

          // 노드 이름으로 검색 (부분 매칭)
          let targetNode = nodes.find(n =>
            n.data.label.toLowerCase().includes(nodeLabel.toLowerCase())
          );

          // "메인", "루트", "root" 키워드로 루트 노드 찾기
          if (!targetNode) {
            const rootKeywords = ['메인', '루트', 'root', 'main'];
            const isRootKeyword = rootKeywords.some(keyword =>
              nodeLabel.toLowerCase().includes(keyword)
            );

            if (isRootKeyword) {
              targetNode = nodes.find(n => n.data.type === 'root');
            }
          }

          if (!targetNode) {
            alert(`"${nodeLabel}" 노드를 찾을 수 없습니다.`);
            return null;
          }

          // 노드 선택
          setSelectedNodeId(targetNode.id);

          // 해당 노드로 화면 이동
          if (reactFlowInstance) {
            reactFlowInstance.setCenter(
              targetNode.position.x + 100,
              targetNode.position.y + 50,
              { zoom: 1.2, duration: 500 }
            );
          }

          // 선택된 노드 ID 반환 (다음 명령어에서 사용)
          return targetNode.id;
        }

        case 'add_node': {
          console.log('=== add_node 실행 ===');
          console.log('activeNodeId:', activeNodeId);
          console.log('command.params:', command.params);

          if (!activeNodeId) {
            alert('노드를 선택해주세요.');
            return null;
          }
          const selectedNode = nodes.find(n => n.id === activeNodeId);
          if (!selectedNode) {
            console.log('선택된 노드를 찾을 수 없음');
            return null;
          }

          console.log('선택된 노드:', selectedNode.data.label);

          saveToHistory();

          const newNodes: Node[] = [];
          const newEdges: Edge[] = [];

          // nodes 배열이 있으면 각 노드를 생성, 없으면 count 사용
          const nodesToCreate = command.params?.nodes || [];
          const count = nodesToCreate.length || command.params?.count || 1;

          console.log('생성할 노드 개수:', count);
          console.log('노드 정보:', nodesToCreate);

          for (let i = 0; i < count; i++) {
            const newNodeId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}`;
            const basePosition = {
              x: selectedNode.position.x,
              y: selectedNode.position.y + 150
            };
            const newPosition = findNonOverlappingPosition(basePosition, [...nodes, ...newNodes], i, count);

            // nodes 배열에서 정보 가져오기
            const nodeInfo = nodesToCreate[i] || {};

            const newNode: Node = {
              id: newNodeId,
              type: 'custom',
              position: newPosition,
              data: {
                label: nodeInfo.label || command.params?.label || `새 노드 ${i + 1}`,
                type: 'node',
                description: nodeInfo.description || command.params?.description,
                color: nodeInfo.color || command.params?.color || 'gray',
                isNewNode: true
              },
            };

            // 부모 노드 ID 확인 및 엣지 스타일 가져오기
            const parentNodeId = activeNodeId;
            const edgeStyle = getEdgeStyle(parentNodeId);

            console.log(`엣지 생성: ${parentNodeId} -> ${newNodeId}`);

            const newEdge: Edge = {
              id: `${parentNodeId}-${newNodeId}`,
              source: parentNodeId,
              target: newNodeId,
              type: 'smoothstep',
              style: edgeStyle,
              animated: false,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: edgeStyle.stroke,
              },
            };

            newNodes.push(newNode);
            newEdges.push(newEdge);
          }

          setNodes((nds) => [...nds, ...newNodes]);
          setEdges((eds) => [...eds, ...newEdges]);

          console.log('노드 생성 완료:', newNodes.length, '개');
          return activeNodeId;
        }

        case 'edit_node': {
          if (!activeNodeId) {
            alert('노드를 선택해주세요.');
            return null;
          }
          saveToHistory();
          setNodes(nds => nds.map(n =>
            n.id === activeNodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    label: command.params?.label || n.data.label,
                    description: command.params?.description !== undefined ? command.params.description : n.data.description,
                    color: command.params?.color || n.data.color
                  }
                }
              : n
          ));
          return activeNodeId;
        }

        case 'delete_node': {
          if (!activeNodeId) {
            alert('노드를 선택해주세요.');
            return null;
          }
          const selectedNode = nodes.find(n => n.id === activeNodeId);
          if (selectedNode?.data.type === 'root') {
            alert('루트 노드는 삭제할 수 없습니다.');
            return null;
          }
          saveToHistory();
          setNodes((nds) => nds.filter(node => node.id !== activeNodeId));
          setEdges((eds) => eds.filter(edge =>
            edge.source !== activeNodeId && edge.target !== activeNodeId
          ));
          setSelectedNodeId(null);
          return null;
        }

        default:
          console.warn('알 수 없는 명령어:', command.action);
          return activeNodeId;
      }
    } catch (error) {
      console.error('명령어 처리 오류:', error);
      alert('명령어 실행 중 오류가 발생했습니다.');
      return null;
    }
  }, [selectedNodeId, nodes, setNodes, setEdges, saveToHistory, findNonOverlappingPosition, getEdgeStyle, expandWithAI, reactFlowInstance]);

  // 자동 설정 기능 (메인 노드 전용)
  const handleAutoSetup = useCallback(async () => {
    const rootNode = nodes.find(node => node.data.type === 'root');
    if (!rootNode || isAutoSetupRunning) return;

    setIsAutoSetupRunning(true);
    
    try {
      console.log('=== 자동 설정 시작 ===');
      console.log('현재 루트 노드 정보:', rootNode.data.label, rootNode.data.description);

      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error('API 키가 설정되지 않았습니다. 홈 화면에서 API 키를 입력해주세요.');
      }

      const response = await fetch('/api/mindmap/auto-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rootNode,
          context: rootNode.data.label,
          apiKey
        }),
      });

      if (!response.ok) {
        throw new Error(`자동 설정 API 오류: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '자동 설정에 실패했습니다.');
      }

      console.log('=== 자동 설정 응답 ===');
      console.log('생성된 구조:', data.structure);

      // 변경 전 상태 저장
      saveToHistory();

      // 1차 노드들 생성
      const firstLevelNodes: Node[] = [];
      const firstLevelEdges: Edge[] = [];
      
      data.structure.categories.forEach((category: any, index: number) => {
        const nodeId = `auto_${Date.now()}_${index}`;
        const basePosition = {
          x: rootNode.position.x,
          y: rootNode.position.y + 150,
        };
        
        const newPosition = findNonOverlappingPosition(basePosition, [...nodes, ...firstLevelNodes], index, data.structure.categories.length);
        
        const newNode: Node = {
          id: nodeId,
          type: 'custom',
          position: newPosition,
          data: {
            label: category.title,
            type: category.type,
            description: category.description || undefined,
            isNewNode: true
          },
        };
        
        // 새 노드 애니메이션 추가
        setNewNodeIds(prev => {
          const newSet = new Set(prev);
          newSet.add(nodeId);
          return newSet;
        });

        // 레이어 기반 스타일 사용 (루트 노드에서 1차 노드로)
        const edgeStyle = getEdgeStyle(rootNode.id);
        const newEdge: Edge = {
          id: `${rootNode.id}-${nodeId}`,
          source: rootNode.id,
          target: nodeId,
          type: 'smoothstep',
          style: edgeStyle,
          animated: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: edgeStyle.stroke,
          },
        };

        firstLevelNodes.push(newNode);
        firstLevelEdges.push(newEdge);
      });

      // 2차 노드들 생성 (필요한 경우)
      const secondLevelNodes: Node[] = [];
      const secondLevelEdges: Edge[] = [];
      
      data.structure.categories.forEach((category: any, categoryIndex: number) => {
        if (category.subItems && category.subItems.length > 0) {
          const parentNodeId = `auto_${Date.now()}_${categoryIndex}`;
          
          category.subItems.forEach((subItem: any, subIndex: number) => {
            const subNodeId = `auto_sub_${Date.now()}_${categoryIndex}_${subIndex}`;
            const parentNode = firstLevelNodes.find(n => n.id === parentNodeId);
            
            if (parentNode) {
              const basePosition = {
                x: parentNode.position.x,
                y: parentNode.position.y + 150,
              };
              
              const newPosition = findNonOverlappingPosition(basePosition, [...nodes, ...firstLevelNodes, ...secondLevelNodes], subIndex, category.subItems.length);
              
              const subNode: Node = {
                id: subNodeId,
                type: 'custom',
                position: newPosition,
                data: {
                  label: subItem.title,
                  type: subItem.type || 'detail',
                  description: subItem.description || undefined,
                  isNewNode: true
                },
              };
              
              // 새 노드 애니메이션 추가
              setNewNodeIds(prev => {
                const newSet = new Set(prev);
                newSet.add(subNodeId);
                return newSet;
              });

              // 레이어 기반 스타일 사용 (1차 노드에서 2차 노드로) - 임시 노드/엣지 고려
              const subEdgeStyle = getEdgeStyleWithTemp(parentNodeId, firstLevelNodes, firstLevelEdges);
              const subEdge: Edge = {
                id: `${parentNodeId}-${subNodeId}`,
                source: parentNodeId,
                target: subNodeId,
                type: 'smoothstep',
                style: subEdgeStyle,
                animated: false,
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: subEdgeStyle.stroke,
                },
              };

              secondLevelNodes.push(subNode);
              secondLevelEdges.push(subEdge);
            }
          });
        }
      });

      // 모든 노드와 엣지 추가
      setNodes((nds) => [...nds, ...firstLevelNodes, ...secondLevelNodes]);
      setEdges((eds) => [...eds, ...firstLevelEdges, ...secondLevelEdges]);
      
      console.log('=== 자동 설정 완료 ===');
      console.log('1차 노드:', firstLevelNodes.length);
      console.log('2차 노드:', secondLevelNodes.length);
      
    } catch (error) {
      console.error('자동 설정 오류:', error);
      alert(`자동 설정 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsAutoSetupRunning(false);
    }
  }, [nodes, setNodes, setEdges, isAutoSetupRunning, saveToHistory, findNonOverlappingPosition, getEdgeStyle, getEdgeStyleWithTemp]);

  // 드래그 이벤트 핸들러
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      e.preventDefault();
      
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // 화면 경계 확인
      const panelRect = floatingPanelRef.current?.getBoundingClientRect();
      const panelWidth = panelRect?.width || 320;
      const panelHeight = panelRect?.height || 200;
      const maxX = window.innerWidth - panelWidth - 20;
      const maxY = window.innerHeight - panelHeight - 20;

      setFloatingPanelPosition({
        x: Math.max(10, Math.min(newX, maxX)),
        y: Math.max(10, Math.min(newY, maxY))
      });
      
      // 드래그 중에는 실시간으로 bottom 위치 업데이트
      if (floatingPanelRef.current) {
        const panelRect = floatingPanelRef.current.getBoundingClientRect();
        const currentBottomPosition = window.innerHeight - panelRect.bottom;
        setFixedBottomPosition(currentBottomPosition);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      // 드래그 완료 시 현재 bottom 위치를 고정값으로 저장
      if (floatingPanelRef.current) {
        const panelRect = floatingPanelRef.current.getBoundingClientRect();
        const currentBottomPosition = window.innerHeight - panelRect.bottom;
        setFixedBottomPosition(currentBottomPosition);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
      document.body.style.userSelect = 'none'; // 텍스트 선택 방지
      document.body.style.cursor = 'grabbing';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, dragOffset]);

  // 노드 인라인 편집 이벤트 리스너
  useEffect(() => {
    const handleNodeUpdate = (event: CustomEvent) => {
      if (!event.detail) return;
      const { nodeId, updates } = event.detail;
      
      
      setNodes((nds) => {
        const updatedNodes = nds.map(node => 
          node.id === nodeId 
            ? {
                ...node,
                data: {
                  ...node.data,
                  ...updates
                }
              }
            : node
        );
        
        // 상태 업데이트 후 히스토리 저장
        setTimeout(() => {
          const currentState = { nodes: [...updatedNodes], edges: [...edges] };
          setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(currentState);
            return newHistory.slice(-50);
          });
          setHistoryIndex(prev => Math.min(prev + 1, 49));
        }, 0);
        
        return updatedNodes;
      });
    };

    const handleNodeDelete = (event: CustomEvent) => {
      if (!event.detail) return;
      const { nodeId } = event.detail;
      
      // 삭제되는 노드가 현재 선택된 노드라면 선택 해제
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
      
      setNodes((nds) => {
        const filteredNodes = nds.filter(node => node.id !== nodeId);
        
        // 상태 업데이트 후 히스토리 저장
        setTimeout(() => {
          const currentState = { nodes: [...filteredNodes], edges: [...edges] };
          setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(currentState);
            return newHistory.slice(-50);
          });
          setHistoryIndex(prev => Math.min(prev + 1, 49));
        }, 0);
        
        return filteredNodes;
      });
      
      setEdges((eds) => eds.filter(edge => 
        edge.source !== nodeId && edge.target !== nodeId
      ));
    };

    window.addEventListener('updateNode', handleNodeUpdate as EventListener);
    window.addEventListener('deleteNode', handleNodeDelete as EventListener);

    return () => {
      window.removeEventListener('updateNode', handleNodeUpdate as EventListener);
      window.removeEventListener('deleteNode', handleNodeDelete as EventListener);
    };
  }, [setNodes, setEdges, selectedNodeId, edges, historyIndex]);

  // 키보드 이벤트 핸들러
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+C: 복사 (노드 선택 시)
      if (event.ctrlKey && event.key === 'c' && selectedNodeId) {
        const selectedNode = nodes.find(n => n.id === selectedNodeId);
        if (selectedNode) {
          // 클립보드에 노드 정보 복사
          navigator.clipboard.writeText(JSON.stringify({
            label: selectedNode.data.label,
            type: selectedNode.data.type,
            description: selectedNode.data.description
          }));
        }
        event.preventDefault();
      }
      
      // Ctrl+Z: 실행 취소
      if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
        undo();
        event.preventDefault();
      }
      
      // Ctrl+Y 또는 Ctrl+Shift+Z: 재실행
      if (event.ctrlKey && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        redo();
        event.preventDefault();
      }
      
      // Delete: 노드 삭제
      if (event.key === 'Delete' && selectedNodeId) {
        deleteNode();
        event.preventDefault();
      }
      
      // Escape: 편집 모드 취소
      if (event.key === 'Escape') {
        if (isAddingNode) {
          setIsAddingNode(false);
          setNewNodeText('');
          setNewNodeDescription('');
        }
        if (showAiConfirmModal) {
          setShowAiConfirmModal(false);
        }
        event.preventDefault();
      }
      
      
      // Enter: 노드 추가
      if (event.key === 'Enter' && isAddingNode && !event.shiftKey && newNodeText.trim()) {
        addNewNode();
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNodeId, nodes, isAddingNode, newNodeText, newNodeDescription, showAiConfirmModal, deleteNode, addNewNode, undo, redo]);

  // 플로팅 패널 위치 조정 (화면 경계 체크)
  useEffect(() => {
    const adjustPanelPosition = () => {
      if (!floatingPanelRef.current) return;
      
      const panel = floatingPanelRef.current;
      const panelRect = panel.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let newPosition = { ...floatingPanelPosition };
      let shouldUpdate = false;
      
      // 가로 경계 체크
      if (floatingPanelPosition.x !== 0) {
        const leftEdge = panelRect.left;
        const rightEdge = panelRect.right;
        
        if (leftEdge < 10) {
          newPosition.x = 10;
          shouldUpdate = true;
        } else if (rightEdge > viewportWidth - 10) {
          newPosition.x = viewportWidth - panelRect.width - 10;
          shouldUpdate = true;
        }
      }
      
      // 세로 경계 체크 (하단 기준)
      if (floatingPanelPosition.y !== 0) {
        const bottomEdge = panelRect.bottom;
        const topEdge = panelRect.top;
        
        if (bottomEdge > viewportHeight - 10) {
          newPosition.y = viewportHeight - panelRect.height - 10;
          shouldUpdate = true;
        } else if (topEdge < 10) {
          newPosition.y = 10;
          shouldUpdate = true;
        }
      }
      
      if (shouldUpdate) {
        setFloatingPanelPosition(newPosition);
      }
    };
    
    // 패널 크기나 위치가 변경될 때마다 조정
    const timer = setTimeout(adjustPanelPosition, 100);
    
    return () => clearTimeout(timer);
  }, [floatingPanelPosition, isAddingNode, isFloatingPanelOpen, isFloatingPanelCollapsed]);

  // 크기 변화 감지는 제거하고 더 간단한 조건 사용

  // 선택된 노드와 하위 노드 추출
  const getNodeSubtree = useCallback((nodeId: string) => {
    const subtreeNodes = new Set<string>();
    const subtreeEdges: Edge[] = [];
    
    // DFS로 하위 노드들 찾기
    const findSubNodes = (currentNodeId: string) => {
      subtreeNodes.add(currentNodeId);
      
      // 현재 노드에서 시작하는 모든 엣지 찾기
      const childEdges = edges.filter(edge => edge.source === currentNodeId);
      
      childEdges.forEach(edge => {
        subtreeEdges.push(edge);
        // 자식 노드들도 재귀적으로 처리
        if (!subtreeNodes.has(edge.target)) {
          findSubNodes(edge.target);
        }
      });
    };
    
    findSubNodes(nodeId);
    
    // 해당하는 실제 노드 객체들 찾기
    const filteredNodes = nodes.filter(node => subtreeNodes.has(node.id));
    
    return {
      nodes: filteredNodes,
      edges: subtreeEdges
    };
  }, [nodes, edges]);

  // 선택된 노드 기반 기획서 생성
  const handleGeneratePlanFromNode = useCallback((nodeId: string) => {
    const subtree = getNodeSubtree(nodeId);
    const selectedNode = nodes.find(n => n.id === nodeId);
    
    if (onGeneratePlan && selectedNode) {
      console.log(`노드 "${selectedNode.data.label}" 기반 기획서 생성 시작`);
      console.log(`포함 노드 수: ${subtree.nodes.length}, 엣지 수: ${subtree.edges.length}`);
      
      onGeneratePlan({
        nodes: subtree.nodes,
        edges: subtree.edges,
        focusNode: selectedNode // 포커스 노드 정보 추가
      });
    }
  }, [nodes, onGeneratePlan, getNodeSubtree]);

  // 전체 기획서 생성
  const handleGeneratePlan = () => {
    if (onGeneratePlan) {
      onGeneratePlan({ nodes, edges });
    }
  };

  return (
    <div className="bg-gray-50 relative w-full overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>

      {/* 하단 플로팅 글래스모피즘 UI 패널 */}
      <div 
        ref={floatingPanelRef}
        className={`fixed z-30 backdrop-blur-xl bg-white/20 border border-white/30 shadow-2xl ${
          isFloatingPanelOpen ? 'w-48 min-w-48' : 
          isAddingNode ? 'w-80 min-w-80 max-w-80' : 
          'w-auto min-w-72 max-w-72'
        } ${isDragging ? '' : 'transition-all duration-300 ease-in-out'} ${
          floatingPanelPosition.x === 0 ? 'sm:left-6 left-1/2 transform sm:transform-none -translate-x-1/2 sm:translate-x-0' : ''
        }`}
        style={{
          ...(floatingPanelPosition.x !== 0 && {
            left: floatingPanelPosition.x,
            transform: 'none'
          }),
          bottom: isDragging 
            ? `${window.innerHeight - floatingPanelPosition.y - (floatingPanelRef.current?.getBoundingClientRect().height || 200)}px`
            : (floatingPanelPosition.y === 0 ? '24px' : `${fixedBottomPosition || 24}px`),
          transformOrigin: 'bottom center',
          borderRadius: isFloatingPanelCollapsed ? '0 0 16px 16px' : '16px',
          overflow: 'hidden',
        }}
      >
        {/* 헤더와 접기 버튼 - 상단으로 위치 */}
        <div className="flex items-center justify-center px-3 py-2 bg-white/10 rounded-t-xl border-b border-white/20 mb-3">
          {/* 메뉴 텍스트 */}
          <div className="text-sm font-semibold text-gray-800">
            메뉴
          </div>
          
          {/* 접기/펼기 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFloatingPanelCollapsed(!isFloatingPanelCollapsed);
            }}
            className="absolute right-3 p-1.5 rounded hover:bg-white/30 transition-colors"
            title={isFloatingPanelCollapsed ? "펼치기" : "접기"}
          >
            {isFloatingPanelCollapsed ? (
              <ChevronUp className="w-4 h-4 text-black" />
            ) : (
              <ChevronDown className="w-4 h-4 text-black" />
            )}
          </button>
        </div>

        {/* 패널 내용 */}
        <div 
          className={`px-4 transition-all duration-300 ease-in-out ${
            isFloatingPanelCollapsed ? 'py-0 max-h-0 opacity-0 overflow-hidden' : 'py-3 max-h-[500px] opacity-100'
          }`}
          style={{ 
            transformOrigin: 'bottom'
          }}
        >

          <div className={`transition-all duration-700 ease-in-out ${isFloatingPanelOpen ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-4 pointer-events-none'}`}>
            {isFloatingPanelOpen && (
              // 설정 모드 - 세로 정렬된 버튼들 (기획서 작성 → 홈으로 → X)
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleGeneratePlan}
                  className="px-4 py-2 bg-blue-700/90 hover:bg-blue-700 text-white rounded-lg backdrop-blur-sm transition-all duration-200 text-sm font-semibold w-32"
                  disabled={nodes.length < 2}
                >
                  <span className="whitespace-nowrap">기획서 작성</span>
                </button>
                <button
                  onClick={onBack}
                  className="px-4 py-2 bg-white/40 hover:bg-white/60 text-gray-900 rounded-lg border-2 border-gray-600/10 backdrop-blur-sm transition-all duration-200 text-sm font-semibold w-32"
                >
                  홈으로
                </button>
                <button
                  onClick={() => setIsFloatingPanelOpen(false)}
                  className="px-3 py-1.5 bg-white/40 hover:bg-white/60 text-gray-800 rounded-lg border border-white/50 backdrop-blur-sm transition-all duration-500 text-sm font-semibold flex items-center justify-center w-16"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <div className={`transition-all duration-700 ease-in-out ${isFloatingPanelOpen ? 'opacity-0 transform translate-y-4 pointer-events-none' : 'opacity-100 transform translate-y-0'}`}>
            {!isFloatingPanelOpen && (
            <div>
              {selectedNodeId ? (
                // 선택된 노드가 있을 때
                <div className="animate-in slide-in-from-bottom-4 duration-300">
                  {/* 노드 정보 표시 */}
                  <div className="mb-3 p-3 bg-white/10 rounded-lg border border-white/20 transform transition-all duration-200 hover:bg-white/20">
                    <div>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const node = nodes.find(n => n.id === selectedNodeId);
                          const getIcon = () => {
                            switch (node?.data.type) {
                              case 'root': return <Target className="w-4 h-4" />;
                              case 'idea': return <Lightbulb className="w-4 h-4" />;
                              case 'feature': return <Sparkles className="w-4 h-4" />;
                              case 'problem': return <FileText className="w-4 h-4" />;
                              case 'solution': return <Wrench className="w-4 h-4" />;
                              case 'detail': return <Settings className="w-4 h-4" />;
                              default: return <Plus className="w-4 h-4" />;
                            }
                          };
                          return (
                            <>
                              <div className="text-blue-600">{getIcon()}</div>
                              <span className="text-gray-900 font-bold text-sm">{node?.data.label}</span>
                            </>
                          );
                        })()}
                      </div>
                      {(() => {
                        const node = nodes.find(n => n.id === selectedNodeId);
                        return node?.data.description ? (
                          <p className="text-gray-700 text-xs mt-2">{node.data.description}</p>
                        ) : null;
                      })()}
                    </div>
                  </div>
                  
                  {/* 액션 버튼들 */}
                  <div className="flex items-center gap-2 mb-3 transform transition-all duration-200">
                        {(() => {
                          const selectedNode = nodes.find(n => n.id === selectedNodeId);
                          const isRootNode = selectedNode?.data.type === 'root';
                          
                          return isRootNode ? (
                            // 루트 노드용 버튼들 (3개 버튼)
                            <>
                              <button
                                onClick={addEmptyNode}
                                className="flex-1 px-3 py-2 bg-blue-700/90 text-white rounded-lg backdrop-blur-sm transition-all duration-200 text-xs font-semibold flex items-center justify-center gap-2"
                              >
                                <Plus className="w-3 h-3" />
                                <span className="whitespace-nowrap">노드 추가</span>
                              </button>
                              <button
                                onClick={() => {
                                  // AI 확장 모달 상태 초기화
                                  setAiExpandMode('simple');
                                  setAiExpandCategory('mixed');
                                  setAiExpandPrompt('');
                                  setAiExpandScope('broad');
                                  setAiExpandCount(3);
                                  setAiDetermineCount(false);
                                  setShowAutoSetupOption(true);
                                  setShowAiConfirmModal(true);
                                }}
                                disabled={isAiExpanding || isAutoSetupRunning}
                                className="flex-1 px-3 py-2 bg-green-700/90 text-white rounded-lg backdrop-blur-sm transition-all duration-200 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                {isAiExpanding || isAutoSetupRunning ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                ) : (
                                  <Sparkles className="w-3 h-3" />
                                )}
                                <span className="whitespace-nowrap">AI 확장</span>
                              </button>
                            </>
                          ) : (
                            // 일반 노드용 버튼들
                            <>
                              <button
                                onClick={addEmptyNode}
                                className="flex-1 px-3 py-2 bg-blue-700/90 text-white rounded-lg backdrop-blur-sm transition-all duration-200 text-xs font-semibold flex items-center justify-center gap-2"
                              >
                                <Plus className="w-3 h-3" />
                                <span className="whitespace-nowrap">노드 추가</span>
                              </button>
                              <button
                                onClick={() => {
                                  // AI 확장 모달 상태 초기화
                                  setAiExpandMode('simple');
                                  setAiExpandCategory('mixed');
                                  setAiExpandPrompt('');
                                  setAiExpandScope('broad');
                                  setAiExpandCount(3);
                                  setAiDetermineCount(false);
                                  setShowAutoSetupOption(false);
                                  setShowAiConfirmModal(true);
                                }}
                                disabled={isAiExpanding}
                                className="flex-1 px-3 py-2 bg-green-700/90 text-white rounded-lg backdrop-blur-sm transition-all duration-200 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                {isAiExpanding ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                ) : (
                                  <Sparkles className="w-3 h-3" />
                                )}
                                <span className="whitespace-nowrap">AI 확장</span>
                              </button>
                            </>
                          );
                        })()}
                  </div>
                  
                  {/* 편집/삭제 버튼 */}
                  <div className="flex items-center gap-2 mb-3 transform transition-all duration-200">
                    <button
                      onClick={() => {
                        const node = nodes.find(n => n.id === selectedNodeId);
                        if (node) {
                          // 인라인 편집 활성화
                          onNodeDoubleClick({} as React.MouseEvent, node);
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-blue-700/90 text-white rounded-lg backdrop-blur-sm transition-all duration-200 text-xs font-semibold flex items-center justify-center gap-2"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span className="whitespace-nowrap">편집</span>
                    </button>
                    <button
                      onClick={deleteNode}
                      disabled={nodes.find(n => n.id === selectedNodeId)?.data.type === 'root'}
                      className="flex-1 px-3 py-2 bg-red-700/90 text-white rounded-lg backdrop-blur-sm transition-all duration-200 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="whitespace-nowrap">삭제</span>
                    </button>
                  </div>
                  
                  {/* 상위 보기 버튼 - PC에서도 표시 */}
                  <div className="flex items-center gap-2 transform transition-all duration-200">
                    <button
                      onClick={() => {
                        // 상위 노드 찾기 및 포커싱
                        const parentEdge = edges.find(edge => edge.target === selectedNodeId);
                        if (parentEdge && reactFlowInstance) {
                          const parentNode = nodes.find(n => n.id === parentEdge.source);
                          if (parentNode) {
                            // 노드 선택 상태 업데이트
                            setSelectedNodeId(parentEdge.source);
                            
                            // ReactFlow 노드 선택 상태 업데이트
                            setNodes(nds => nds.map(n => ({
                              ...n,
                              selected: n.id === parentEdge.source
                            })));
                            
                            // 상위 노드로 화면 이동
                            setTimeout(() => {
                              reactFlowInstance.setCenter(
                                parentNode.position.x + 100,
                                parentNode.position.y + 50,
                                { zoom: 1.2, duration: 500 }
                              );
                            }, 100);
                          }
                        }
                      }}
                      disabled={!edges.find(edge => edge.target === selectedNodeId)}
                      className="flex-1 px-3 py-2 bg-purple-700/90 text-white rounded-lg backdrop-blur-sm transition-all duration-200 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="w-3 h-3" />
                      <span className="whitespace-nowrap">상위노드 보기</span>
                    </button>
                  </div>
                </div>
              ) : (
                // 선택된 노드가 없을 때
                <div className="text-center py-4 animate-in fade-in duration-300">
                  <div className="text-gray-600 mb-2">
                    <Eye className="w-6 h-6 mx-auto mb-2 opacity-70" />
                  </div>
                  <p className="text-gray-700 text-sm mb-3 font-medium">노드를 클릭하여 선택하세요</p>
                  <button
                    onClick={() => {
                      // 루트 노드 선택
                      const rootNode = nodes.find(node => node.data.type === 'root');
                      if (rootNode) {
                        setSelectedNodeId(rootNode.id);
                      }
                    }}
                    className="px-3 py-2 bg-blue-700/90 text-white rounded-lg backdrop-blur-sm transition-all duration-200 text-xs font-semibold"
                  >
                    루트 노드 선택
                  </button>
                </div>
              )}
              

              {/* 노드 추가는 이제 인라인으로 처리됨 */}
              
              {/* 실행 취소/재실행 버튼 - PC에서도 표시 */}
              <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-white/20">
                <button
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="px-2 py-1.5 bg-white/40 hover:bg-white/60 text-gray-800 rounded border border-white/50 backdrop-blur-sm transition-all duration-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  title="실행 취소 (Ctrl+Z)"
                >
                  ↶
                </button>
                <button
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className="px-2 py-1.5 bg-white/40 hover:bg-white/60 text-gray-800 rounded border border-white/50 backdrop-blur-sm transition-all duration-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  title="재실행 (Ctrl+Y)"
                >
                  ↷
                </button>
                <div className="w-px h-4 bg-gray-300/40 mx-1"></div>
                <button
                  onClick={() => setIsFloatingPanelOpen(true)}
                  className="px-3 py-2 bg-white/40 hover:bg-white/60 text-gray-800 rounded-lg border border-white/50 backdrop-blur-sm transition-all duration-500 text-xs font-semibold flex items-center justify-center hover:scale-105"
                >
                  <div className={`transition-transform duration-500 ease-in-out ${isFloatingPanelOpen ? 'rotate-180' : 'rotate-0'}`}>
                    <Settings className="w-4 h-4" />
                  </div>
                </button>
              </div>
            </div>
            )}
          </div>
        </div>
        
        {/* 드래그 핸들 - 하단에 위치 */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
          <div 
            className="w-8 h-6 bg-white/90 rounded cursor-move flex items-center justify-center hover:bg-white transition-colors shadow-lg border border-gray-200"
            onMouseDown={(e) => {
              e.preventDefault();
              const panelRect = floatingPanelRef.current?.getBoundingClientRect();
              if (panelRect) {
                // 처음 드래그 시작할 때 현재 위치가 중앙 정렬이면 절대 좌표로 변환
                if (floatingPanelPosition.x === 0 && floatingPanelPosition.y === 0) {
                  setFloatingPanelPosition({
                    x: panelRect.left,
                    y: panelRect.top
                  });
                  setFixedBottomPosition(window.innerHeight - panelRect.bottom);
                }
                
                setDragOffset({
                  x: e.clientX - panelRect.left,
                  y: e.clientY - panelRect.top
                });
              }
              setIsDragging(true);
            }}
            title="드래그하여 이동"
          >
            <div className="grid grid-cols-2 gap-0.5">
              <div className="w-1 h-1 bg-black rounded-full"></div>
              <div className="w-1 h-1 bg-black rounded-full"></div>
              <div className="w-1 h-1 bg-black rounded-full"></div>
              <div className="w-1 h-1 bg-black rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* AI 확장 설정 모달 */}
      {showAiConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 max-w-lg w-full mx-4 border border-white/30 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <Sparkles className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">AI 아이디어 확장</h3>
            </div>

            {/* 모드 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">확장 모드</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setAiExpandMode('simple')}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 text-sm ${
                    aiExpandMode === 'simple'
                      ? 'border-green-500 bg-green-50 text-green-800'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-semibold mb-1">간편 모드</div>
                  <div className="text-xs opacity-70">선택지로 빠른 설정</div>
                </button>
                <button
                  onClick={() => setAiExpandMode('advanced')}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 text-sm ${
                    aiExpandMode === 'advanced'
                      ? 'border-green-500 bg-green-50 text-green-800'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-semibold mb-1">고급 모드</div>
                  <div className="text-xs opacity-70">직접 프롬프트 입력</div>
                </button>
                {showAutoSetupOption && (
                  <button
                    onClick={() => setAiExpandMode('auto')}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 text-sm ${
                      aiExpandMode === 'auto'
                        ? 'border-purple-500 bg-purple-50 text-purple-800'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-semibold mb-1 flex items-center gap-1">
                      <Settings className="w-3 h-3" />
                      자동 생성
                    </div>
                    <div className="text-xs opacity-70">초기 구조 자동 생성</div>
                  </button>
                )}
              </div>
            </div>

            {/* 자동 생성 모드 설명 */}
            {aiExpandMode === 'auto' && (
              <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3 mb-3">
                  <Settings className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-800">지능형 자동 생성 모드</h4>
                </div>
                <div className="text-sm text-purple-700">
                  <p className="mb-3 font-semibold">🧠 AI가 주제를 깊이 분석하여 맞춤형 구조를 설계합니다:</p>
                  <ul className="space-y-2 text-xs">
                    <li>• <span className="font-semibold">프로젝트 유형 인식</span>: 웹앱, 모바일앱, 서비스 등 자동 분류</li>
                    <li>• <span className="font-semibold">주제 기반 카테고리</span>: 주제 내용을 분석하여 4-7개 핵심 영역 생성</li>
                    <li>• <span className="font-semibold">중요도 기반 확장</span>: 핵심 영역은 더 많은 하위 아이템으로 구성</li>
                    <li>• <span className="font-semibold">실무 관점 반영</span>: 구현 난이도, 우선순위, 실현 가능성 고려</li>
                    <li>• <span className="font-semibold">트렌드 반영</span>: 최신 기술 동향과 시장 요구사항 포함</li>
                    <li>• <span className="font-semibold">체계적 구조화</span>: 논리적 연결성을 갖춘 2차 구조까지 생성</li>
                  </ul>
                  <div className="mt-3 p-2 bg-purple-100 rounded text-xs">
                    <strong>💡 특별한 점:</strong> 카테고리 기준이 아닌 주제 내용을 기준으로 AI가 맞춤형 구조를 설계합니다.
                  </div>
                </div>
              </div>
            )}

            {/* 간편 모드 설정 */}
            {aiExpandMode === 'simple' && (
              <div className="space-y-4 mb-6">
                {/* 생성 개수 슬라이더 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    생성할 노드 개수: <span className="text-green-600 font-bold">{aiExpandCount}개</span>
                  </label>
                  <div className="px-3">
                      <input
                        type="range"
                        min="1"
                        max="8"
                        value={aiExpandCount}
                        onChange={(e) => setAiExpandCount(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #10b981 0%, #10b981 ${((aiExpandCount - 1) / 7) * 100}%, #e5e7eb ${((aiExpandCount - 1) / 7) * 100}%, #e5e7eb 100%)`
                        }}
                      />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1개</span>
                      <span>4개</span>
                      <span>8개</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 고급 모드 설정 */}
            {aiExpandMode === 'advanced' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    확장 프롬프트
                    <span className="text-xs font-normal text-gray-500 ml-2">(AI에게 전달할 지시사항)</span>
                  </label>
                  <textarea
                    value={aiExpandPrompt}
                    onChange={(e) => setAiExpandPrompt(e.target.value)}
                    placeholder="예: '사용자 경험을 개선할 수 있는 구체적인 기능들을 제안해줘' 또는 '보안과 관련된 잠재적 문제점들을 찾아줘'"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[80px] resize-none"
                    rows={3}
                  />
                  <div className="mt-2 text-xs text-gray-600">
                    비워두면 기본 확장 방식이 적용됩니다.
                  </div>
                </div>

                {/* AI가 노드 개수를 결정할지 선택 */}
                <div>
                  <label className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={aiDetermineCount}
                      onChange={(e) => setAiDetermineCount(e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <div>
                      <div className="text-sm font-semibold text-purple-800">AI가 노드 개수 결정</div>
                      <div className="text-xs text-purple-600">AI가 최적의 노드 개수를 직접 판단합니다</div>
                    </div>
                  </label>
                </div>

                {/* 고급 모드용 확장 개수 슬라이더 - AI 결정 모드가 꺼져있을 때만 표시 */}
                {!aiDetermineCount && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      생성할 노드 개수: <span className="text-green-600 font-bold">{aiExpandCount}개</span>
                    </label>
                    <div className="px-3">
                      <input
                        type="range"
                        min="1"
                        max="8"
                        value={aiExpandCount}
                        onChange={(e) => setAiExpandCount(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #10b981 0%, #10b981 ${((aiExpandCount - 1) / 7) * 100}%, #e5e7eb ${((aiExpandCount - 1) / 7) * 100}%, #e5e7eb 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1개</span>
                        <span>4개</span>
                        <span>8개</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 현재 노드 정보 */}
            <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm font-semibold text-blue-800 mb-1">확장할 노드</div>
              <div className="text-sm text-blue-700">
                {nodes.find(n => n.id === selectedNodeId)?.data.label}
              </div>
              {nodes.find(n => n.id === selectedNodeId)?.data.description && (
                <div className="text-xs text-blue-600 mt-1">
                  {nodes.find(n => n.id === selectedNodeId)?.data.description}
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAiConfirmModal(false);
                }}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 text-sm font-semibold"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setShowAiConfirmModal(false);
                  
                  // 자동 설정 모드인지 확인
                  if (aiExpandMode === 'auto') {
                    handleAutoSetup();
                  } else {
                    expandWithAI();
                  }
                }}
                disabled={aiExpandMode === 'advanced' && !aiExpandPrompt.trim() && aiExpandCategory === 'mixed'}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiExpandMode === 'auto' ? <Settings className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                <span className="whitespace-nowrap">{aiExpandMode === 'auto' ? '자동 생성 실행' : '확장하기'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI 확장 로딩 오버레이 */}
      {isAiExpanding && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full mx-4 border border-white/30 shadow-2xl">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI 아이디어 확장 중...</h3>
              <p className="text-gray-600 text-sm mb-4">
                선택된 노드: <span className="font-semibold text-green-600">
                  {nodes.find(n => n.id === selectedNodeId)?.data.label || '알 수 없음'}
                </span>
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>창의적인 아이디어를 생성하고 있습니다...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 자동 설정 로딩 오버레이 */}
      {isAutoSetupRunning && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full mx-4 border border-white/30 shadow-2xl">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">프로젝트 구조 자동 생성 중...</h3>
              <p className="text-gray-600 text-sm mb-4">
                주제: <span className="font-semibold text-purple-600">
                  {nodes.find(n => n.data.type === 'root')?.data.label || initialPrompt || '프로젝트 아이디어'}
                </span>
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Settings className="w-4 h-4 animate-spin" />
                <span>체계적인 프로젝트 구조를 설계하고 있습니다...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <div 
          className="fixed bg-white/95 backdrop-blur-xl rounded-lg shadow-2xl border border-gray-200/50 py-1 z-50 min-w-[120px]"
          style={{ 
            left: contextMenu.x, 
            top: contextMenu.y,
            transform: 'translate(-50%, -10px)'
          }}
        >
          {contextMenu.nodeId && (
            <>
              <button
                onClick={() => {
                  const node = nodes.find(n => n.id === contextMenu.nodeId);
                  if (node) {
                    // 더블클릭과 동일한 효과 - 인라인 편집
                    onNodeDoubleClick({} as React.MouseEvent, node);
                  }
                  setContextMenu(null);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                편집
              </button>
              <button
                onClick={() => {
                  if (contextMenu.nodeId) {
                    setSelectedNodeId(contextMenu.nodeId);
                    addEmptyNode();
                  }
                  setContextMenu(null);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="whitespace-nowrap">노드 추가</span>
              </button>
              <button
                onClick={() => {
                  if (contextMenu.nodeId) {
                    setSelectedNodeId(contextMenu.nodeId);
                    // AI 확장 모달 상태 초기화
                    setAiExpandMode('simple');
                    setAiExpandCategory('mixed');
                    setAiExpandPrompt('');
                    setAiExpandScope('broad');
                    setAiExpandCount(3);
                    setAiDetermineCount(false);
                    // 루트 노드인지 확인하여 자동 설정 옵션 활성화
                    const selectedNode = nodes.find(n => n.id === contextMenu.nodeId);
                    if (selectedNode?.data.type === 'root') {
                      setShowAutoSetupOption(true);
                    } else {
                      setShowAutoSetupOption(false);
                    }
                    setShowAiConfirmModal(true);
                  }
                  setContextMenu(null);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-green-50 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span className="whitespace-nowrap">AI 확장</span>
              </button>
              <button
                onClick={() => {
                  if (contextMenu.nodeId) {
                    handleGeneratePlanFromNode(contextMenu.nodeId);
                  }
                  setContextMenu(null);
                }}
                className="w-full px-3 py-2 text-left text-sm text-purple-600 hover:bg-purple-50 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span className="whitespace-nowrap">기획서 생성</span>
              </button>
              <hr className="my-1 border-gray-200/50" />
              <button
                onClick={() => {
                  if (contextMenu.nodeId) {
                    const node = nodes.find(n => n.id === contextMenu.nodeId);
                    if (node?.data.type !== 'root') {
                      setNodes((nds) => nds.filter(n => n.id !== contextMenu.nodeId));
                      setEdges((eds) => eds.filter(edge => 
                        edge.source !== contextMenu.nodeId && edge.target !== contextMenu.nodeId
                      ));
                    }
                  }
                  setContextMenu(null);
                }}
                disabled={nodes.find(n => n.id === contextMenu.nodeId)?.data.type === 'root'}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                삭제
              </button>
            </>
          )}
          {contextMenu.edgeId && (
            <>
              <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-200/50">
                {(() => {
                  const edge = edges.find(e => e.id === contextMenu.edgeId);
                  const sourceNode = nodes.find(n => n.id === edge?.source);
                  const targetNode = nodes.find(n => n.id === edge?.target);
                  return `${sourceNode?.data.label || '알 수 없음'} → ${targetNode?.data.label || '알 수 없음'}`;
                })()}
              </div>
              <button
                onClick={() => {
                  if (contextMenu.edgeId) {
                    deleteEdge(contextMenu.edgeId);
                  }
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                연결 삭제
              </button>
            </>
          )}
        </div>
      )}

      {/* AI 채팅 어시스턴트 */}
      <MindmapChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onCommand={handleChatCommand}
        selectedNodeId={selectedNodeId}
        nodes={nodes}
        rootLabel={nodes.find(n => n.data.type === 'root')?.data.label || initialPrompt}
      />

      {/* 채팅 버튼 - 우측 하단 */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed right-4 bottom-4 z-40 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110"
          title="AI 어시스턴트"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* 브레인스토밍 영역 - 헤더 제외한 전체 화면 */}
      <div className="w-full h-full">
        <div
          ref={reactFlowWrapper}
          className="w-full h-full"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onNodeContextMenu={onNodeContextMenu}
            onNodeDragStart={onNodeDragStart}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={onNodeDragStop}
            onEdgeClick={onEdgeClick}
            onEdgeContextMenu={onEdgeContextMenu}
            onPaneClick={onPaneClick}
            onPaneContextMenu={onPaneContextMenu}
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{
              padding: 0.05,
              maxZoom: 1.5,
              minZoom: 0.3,
            }}
            attributionPosition="bottom-left"
          >
            <Controls position="top-left" />
            
            {/* 저장/불러오기 버튼 */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <button
                onClick={saveMindmap}
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                title="마인드맵 저장"
              >
                <Download size={16} />
                <span className="hidden sm:inline">저장</span>
              </button>
              <button
                onClick={loadMindmap}
                className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors shadow-lg"
                title="마인드맵 불러오기"
              >
                <Upload size={16} />
                <span className="hidden sm:inline">불러오기</span>
              </button>
            </div>
            
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="#94a3b8" />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

// ReactFlowProvider로 감싸는 래퍼 컴포넌트
const MindmapViewerWrapper: React.FC<MindmapViewerProps> = (props) => {
  return (
    <ReactFlowProvider>
      <MindmapViewer {...props} />
    </ReactFlowProvider>
  );
};

export default MindmapViewerWrapper;