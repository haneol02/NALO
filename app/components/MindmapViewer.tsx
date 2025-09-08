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
import { Plus, Lightbulb, FileText, Sparkles, Target, Wrench, Settings, X, ChevronUp, ChevronDown, Edit3, Trash2, Eye, ArrowUp, ArrowDown } from 'lucide-react';

// 노드 타입 정의
interface MindmapNodeData {
  label: string;
  type: 'root' | 'idea' | 'feature' | 'detail' | 'problem' | 'solution';
  description?: string;
}

// 커스텀 노드 컴포넌트
const CustomNode = ({ data, selected }: { data: MindmapNodeData; selected: boolean }) => {
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
    switch (data.type) {
      case 'root': return 'bg-blue-500 text-white border-blue-600';
      case 'idea': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'feature': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'problem': return 'bg-red-100 text-red-800 border-red-300';
      case 'solution': return 'bg-green-100 text-green-800 border-green-300';
      case 'detail': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getCategoryLabel = () => {
    switch (data.type) {
      case 'root': return '메인';
      case 'idea': return '아이디어';
      case 'feature': return '기능';
      case 'problem': return '문제점';
      case 'solution': return '해결책';
      case 'detail': return '세부사항';
      default: return '기타';
    }
  };

  return (
    <div className={`
      relative px-3 py-2 shadow-lg rounded-lg border-2 min-w-[120px] max-w-[200px]
      ${getNodeColor()}
      ${selected ? 'ring-2 ring-blue-400' : ''}
      transition-all duration-200 hover:shadow-xl
    `}>
      {/* 상위 노드 연결점 - 루트 노드가 아닐 때만 표시 */}
      {data.type !== 'root' && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-blue-500 border-2 border-white"
          style={{ top: -6 }}
        />
      )}
      
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          {getNodeIcon()}
          <span className="font-semibold text-sm">{data.label}</span>
        </div>
        <div className="text-xs px-2 py-0.5 rounded-full bg-black/10 opacity-75 whitespace-nowrap flex-shrink-0">
          {getCategoryLabel()}
        </div>
      </div>
      {data.description && (
        <p className="text-xs opacity-80 leading-relaxed">{data.description}</p>
      )}
      
      {/* 하위 노드 연결점 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-green-500 border-2 border-white"
        style={{ bottom: -6 }}
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
  onGeneratePlan?: (mindmapData: { nodes: Node[]; edges: Edge[] }) => void;
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
  const [isEditingNode, setIsEditingNode] = useState(false);
  const [editingNodeText, setEditingNodeText] = useState('');
  const [editingNodeDescription, setEditingNodeDescription] = useState('');
  const [editingNodeType, setEditingNodeType] = useState<MindmapNodeData['type']>('idea');
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
  const [fixedBottomPosition, setFixedBottomPosition] = useState<number | null>(null);
  const floatingPanelRef = useRef<HTMLDivElement>(null);

  // 노드 겹침 방지를 위한 유틸리티 함수
  const findNonOverlappingPosition = useCallback((
    basePosition: { x: number; y: number },
    existingNodes: Node[],
    nodeWidth: number = 250,
    nodeHeight: number = 100,
    minDistance: number = 50
  ) => {
    const maxAttempts = 50;
    const radius = 200; // 탐색 반경
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const angle = (attempt * 137.5) * (Math.PI / 180); // 황금각 사용
      const distance = Math.sqrt(attempt) * 30;
      
      const testPosition = {
        x: basePosition.x + Math.cos(angle) * distance,
        y: basePosition.y + Math.sin(angle) * distance
      };
      
      // 다른 노드들과 겹치는지 확인
      const isOverlapping = existingNodes.some(node => {
        const dx = Math.abs(node.position.x - testPosition.x);
        const dy = Math.abs(node.position.y - testPosition.y);
        return dx < (nodeWidth + minDistance) && dy < (nodeHeight + minDistance);
      });
      
      if (!isOverlapping) {
        return testPosition;
      }
    }
    
    // 최후의 수단: 랜덤 위치
    return {
      x: basePosition.x + (Math.random() - 0.5) * 400,
      y: basePosition.y + (Math.random() - 0.5) * 400
    };
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

  // 초기 상태를 히스토리에 저장
  useEffect(() => {
    if (history.length === 0) {
      setHistory([{ nodes: [...initialNodes], edges: [...initialEdges] }]);
      setHistoryIndex(0);
    }
  }, [history.length, initialNodes, initialEdges]);

  // 엣지 연결 처리
  const onConnect = useCallback(
    (params: Connection) => {
      // 변경 전 상태 저장
      saveToHistory();
      
      // 연결될 때 스타일을 적용한 엣지 생성
      const newEdge = {
        ...params,
        type: 'smoothstep',
        style: { stroke: '#6366f1', strokeWidth: 2, strokeDasharray: 'none' },
        animated: false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#6366f1',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, saveToHistory]
  );

  // 노드 선택 처리
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    // 편집 모드 초기화
    setIsEditingNode(false);
    setEditingNodeText('');
    setEditingNodeDescription('');
    setIsAddingNode(false);
  }, []);

  // 노드 드래그 시작 시 선택 처리
  const onNodeDragStart = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    // 편집 모드 초기화
    setIsEditingNode(false);
    setEditingNodeText('');
    setEditingNodeDescription('');
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
    // 편집 모드 초기화
    setIsEditingNode(false);
    setEditingNodeText('');
    setEditingNodeDescription('');
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
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id
    });
  }, []);

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
    setIsFloatingPanelOpen(true);
    setIsEditingNode(true);
    setEditingNodeText(node.data.label);
    setEditingNodeDescription(node.data.description || '');
  }, []);

  // 새 노드 추가
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
    
    const newPosition = findNonOverlappingPosition(basePosition, nodes);
    
    const newNode: Node = {
      id: newNodeId,
      type: 'custom',
      position: newPosition,
      data: {
        label: newNodeText,
        type: newNodeType,
        description: newNodeDescription.trim() || undefined,
      },
    };

    const newEdge: Edge = {
      id: `${selectedNodeId}-${newNodeId}`,
      source: selectedNodeId,
      target: newNodeId,
      type: 'smoothstep',
      style: { stroke: '#6366f1', strokeWidth: 2, strokeDasharray: 'none' },
      animated: false,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#6366f1',
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [...eds, newEdge]);
    setNewNodeText('');
    setNewNodeDescription('');
    setIsAddingNode(false);
  }, [newNodeText, newNodeType, newNodeDescription, selectedNodeId, nodes, setNodes, setEdges, saveToHistory, findNonOverlappingPosition]);

  // 노드 편집 저장
  const saveNodeEdit = useCallback(() => {
    if (!editingNodeText.trim() || !selectedNodeId) return;

    // 변경 전 상태 저장
    saveToHistory();

    setNodes((nds) => nds.map(node => 
      node.id === selectedNodeId 
        ? {
            ...node,
            data: {
              ...node.data,
              label: editingNodeText,
              description: editingNodeDescription || node.data.description,
              type: editingNodeType
            }
          }
        : node
    ));
    
    setIsEditingNode(false);
    setEditingNodeText('');
    setEditingNodeDescription('');
  }, [editingNodeText, editingNodeDescription, editingNodeType, selectedNodeId, setNodes, saveToHistory]);

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
  const expandWithAI = useCallback(async () => {
    if (!selectedNodeId || isAiExpanding) return;

    const selectedNode = nodes.find(n => n.id === selectedNodeId);
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
      console.log('=== AI 확장 요청 시작 ===');
      
      const response = await fetch('/api/mindmap/expand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedNode,
          context: `프로젝트 주제: ${initialPrompt}\n현재 선택된 노드: "${selectedNode.data.label}" (${selectedNode.data.description || '설명 없음'})`,
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
          x: selectedNode.position.x + (index - Math.floor(aiSuggestions.length / 2)) * 180,
          y: selectedNode.position.y + 150,
        };
        
        const newPosition = findNonOverlappingPosition(basePosition, [...nodes, ...newNodes]);
        
        newNodes.push({
          id: newNodeId,
          type: 'custom',
          position: newPosition,
          data: {
            label: suggestion.label,
            type: suggestion.type || 'idea',
            description: suggestion.description || undefined
          },
        });
      });

      const newEdges: Edge[] = newNodes.map(node => ({
        id: `${selectedNodeId}-${node.id}`,
        source: selectedNodeId,
        target: node.id,
        type: 'smoothstep',
        style: { stroke: '#10b981', strokeWidth: 2, strokeDasharray: 'none' },
        animated: false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#10b981',
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
  }, [selectedNodeId, nodes, setNodes, setEdges, initialPrompt, isAiExpanding, aiExpandMode, aiExpandCategory, aiExpandPrompt, aiExpandScope, aiExpandCount, aiDetermineCount, showAutoSetupOption, saveToHistory, findNonOverlappingPosition, reactFlowInstance]);

  // 자동 설정 기능 (메인 노드 전용)
  const handleAutoSetup = useCallback(async () => {
    const rootNode = nodes.find(node => node.data.type === 'root');
    if (!rootNode || isAutoSetupRunning) return;

    setIsAutoSetupRunning(true);
    
    try {
      console.log('=== 자동 설정 시작 ===');
      
      const response = await fetch('/api/mindmap/auto-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rootNode,
          context: initialPrompt
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
          x: rootNode.position.x + (index - Math.floor(data.structure.categories.length / 2)) * 200,
          y: rootNode.position.y + 150,
        };
        
        const newPosition = findNonOverlappingPosition(basePosition, [...nodes, ...firstLevelNodes]);
        
        const newNode: Node = {
          id: nodeId,
          type: 'custom',
          position: newPosition,
          data: {
            label: category.title,
            type: category.type,
            description: category.description || undefined
          },
        };

        const newEdge: Edge = {
          id: `${rootNode.id}-${nodeId}`,
          source: rootNode.id,
          target: nodeId,
          type: 'smoothstep',
          style: { stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: 'none' },
          animated: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#8b5cf6',
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
                x: parentNode.position.x + (subIndex - Math.floor(category.subItems.length / 2)) * 150,
                y: parentNode.position.y + 150,
              };
              
              const newPosition = findNonOverlappingPosition(basePosition, [...nodes, ...firstLevelNodes, ...secondLevelNodes]);
              
              const subNode: Node = {
                id: subNodeId,
                type: 'custom',
                position: newPosition,
                data: {
                  label: subItem.title,
                  type: subItem.type || 'detail',
                  description: subItem.description || undefined
                },
              };

              const subEdge: Edge = {
                id: `${parentNodeId}-${subNodeId}`,
                source: parentNodeId,
                target: subNodeId,
                type: 'smoothstep',
                style: { stroke: '#06b6d4', strokeWidth: 2, strokeDasharray: 'none' },
                animated: false,
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: '#06b6d4',
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
  }, [nodes, setNodes, setEdges, initialPrompt, isAutoSetupRunning, saveToHistory, findNonOverlappingPosition]);

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
        if (isEditingNode) {
          setIsEditingNode(false);
          setEditingNodeText('');
          setEditingNodeDescription('');
          setEditingNodeType('idea');
        }
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
      
      // Enter: 편집 저장
      if (event.key === 'Enter' && isEditingNode && !event.shiftKey) {
        saveNodeEdit();
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
  }, [selectedNodeId, nodes, isEditingNode, isAddingNode, newNodeText, newNodeDescription, showAiConfirmModal, deleteNode, saveNodeEdit, addNewNode, undo, redo]);

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
  }, [floatingPanelPosition, isAddingNode, isEditingNode, isFloatingPanelOpen, isFloatingPanelCollapsed]);

  // 크기 변화 감지는 제거하고 더 간단한 조건 사용

  // 기획서 생성
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
          isAddingNode || isEditingNode ? 'w-80 min-w-80 max-w-80' : 
          'w-auto min-w-72 max-w-72'
        } ${isDragging ? '' : 'transition-all duration-300 ease-in-out'}`}
        style={{
          left: floatingPanelPosition.x === 0 ? '50%' : floatingPanelPosition.x,
          bottom: isDragging 
            ? `${window.innerHeight - floatingPanelPosition.y - (floatingPanelRef.current?.getBoundingClientRect().height || 200)}px`
            : (floatingPanelPosition.y === 0 ? '24px' : `${fixedBottomPosition || 24}px`),
          transform: floatingPanelPosition.x === 0 ? 'translateX(-50%)' : 'none',
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
                  기획서 작성
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
                  {/* 노드 정보 표시 - 편집 모드일 때는 입력창으로 변경 */}
                  <div className="mb-3 p-3 bg-white/10 rounded-lg border border-white/20 transform transition-all duration-200 hover:bg-white/20">
                    {isEditingNode ? (
                      // 편집 모드 - 직접 편집
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          {(() => {
                            const getIcon = () => {
                              switch (editingNodeType) {
                                case 'root': return <Target className="w-3 h-3" />;
                                case 'idea': return <Lightbulb className="w-3 h-3" />;
                                case 'feature': return <Sparkles className="w-3 h-3" />;
                                case 'problem': return <FileText className="w-3 h-3" />;
                                case 'solution': return <Wrench className="w-3 h-3" />;
                                case 'detail': return <Settings className="w-3 h-3" />;
                                default: return <Plus className="w-3 h-3" />;
                              }
                            };
                            return <div className="text-blue-600 flex-shrink-0">{getIcon()}</div>;
                          })()}
                          <input
                            type="text"
                            value={editingNodeText}
                            onChange={(e) => setEditingNodeText(e.target.value)}
                            placeholder="노드 제목"
                            className="flex-1 px-2 py-1 bg-white/40 border border-white/50 rounded text-gray-900 placeholder-gray-600 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                          />
                        </div>
                        <input
                          type="text"
                          value={editingNodeDescription}
                          onChange={(e) => setEditingNodeDescription(e.target.value)}
                          placeholder="세부 설명 (선택사항)"
                          className="w-full px-2 py-1 bg-white/40 border border-white/50 rounded text-gray-900 placeholder-gray-600 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <select
                          value={editingNodeType}
                          onChange={(e) => setEditingNodeType(e.target.value as MindmapNodeData['type'])}
                          className="w-full px-2 py-1 bg-white/40 border border-white/50 rounded text-gray-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          disabled={nodes.find(n => n.id === selectedNodeId)?.data.type === 'root'}
                        >
                          <option value="idea">아이디어</option>
                          <option value="feature">기능</option>
                          <option value="problem">문제점</option>
                          <option value="solution">해결책</option>
                          <option value="detail">세부사항</option>
                          {nodes.find(n => n.id === selectedNodeId)?.data.type === 'root' && (
                            <option value="root">메인</option>
                          )}
                        </select>
                      </div>
                    ) : (
                      // 보기 모드
                      <div>
                        <div className="flex items-center justify-between mb-2">
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
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                const node = nodes.find(n => n.id === selectedNodeId);
                                if (node) {
                                  setEditingNodeText(node.data.label);
                                  setEditingNodeDescription(node.data.description || '');
                                  setEditingNodeType(node.data.type);
                                  setIsEditingNode(true);
                                }
                              }}
                              className="p-1.5 text-blue-700 hover:bg-white/20 rounded transition-colors"
                              title="편집"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={deleteNode}
                              disabled={nodes.find(n => n.id === selectedNodeId)?.data.type === 'root'}
                              className="p-1.5 text-red-700 hover:bg-white/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="삭제"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        {(() => {
                          const node = nodes.find(n => n.id === selectedNodeId);
                          return node?.data.description ? (
                            <p className="text-gray-700 text-xs">{node.data.description}</p>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                  
                  {/* 액션 버튼들 */}
                  <div className="flex items-center gap-2 mb-3 transform transition-all duration-200">
                    {isEditingNode ? (
                      // 편집 모드 버튼들
                      <>
                        <button
                          onClick={saveNodeEdit}
                          className="flex-1 px-3 py-2 bg-green-700/90 text-white rounded-lg backdrop-blur-sm transition-all duration-200 text-xs font-semibold"
                          disabled={!editingNodeText.trim()}
                        >
                          저장
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingNode(false);
                            setEditingNodeText('');
                            setEditingNodeDescription('');
                            setEditingNodeType('idea');
                          }}
                          className="flex-1 px-3 py-2 bg-gray-700/90 text-white rounded-lg backdrop-blur-sm transition-all duration-200 text-xs font-semibold"
                        >
                          취소
                        </button>
                      </>
                    ) : (
                      // 일반 모드 버튼들
                      <>
                        {(() => {
                          const selectedNode = nodes.find(n => n.id === selectedNodeId);
                          const isRootNode = selectedNode?.data.type === 'root';
                          
                          return isRootNode ? (
                            // 루트 노드용 버튼들 (3개 버튼)
                            <>
                              <button
                                onClick={() => setIsAddingNode(true)}
                                className="flex-1 px-3 py-2 bg-blue-700/90 text-white rounded-lg backdrop-blur-sm transition-all duration-200 text-xs font-semibold flex items-center justify-center gap-2"
                              >
                                <Plus className="w-3 h-3" />
                                하위노드 추가
                              </button>
                              <button
                                onClick={() => {
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
                                AI 확장
                              </button>
                            </>
                          ) : (
                            // 일반 노드용 버튼들
                            <>
                              <button
                                onClick={() => setIsAddingNode(true)}
                                className="flex-1 px-3 py-2 bg-blue-700/90 text-white rounded-lg backdrop-blur-sm transition-all duration-200 text-xs font-semibold flex items-center justify-center gap-2"
                              >
                                <Plus className="w-3 h-3" />
                                하위노드 추가
                              </button>
                              <button
                                onClick={() => {
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
                                AI 확장
                              </button>
                            </>
                          );
                        })()}
                      </>
                    )}
                  </div>
                  
                  {/* 상위 보기 버튼 */}
                  <div className="flex items-center gap-2 transform transition-all duration-200">
                    <button
                      onClick={() => {
                        // 상위 노드 찾기 및 포커싱
                        const parentEdge = edges.find(edge => edge.target === selectedNodeId);
                        if (parentEdge && reactFlowInstance) {
                          const parentNode = nodes.find(n => n.id === parentEdge.source);
                          if (parentNode) {
                            setSelectedNodeId(parentEdge.source);
                            // 상위 노드로 화면 이동
                            reactFlowInstance.setCenter(
                              parentNode.position.x + 100, // 노드 중앙 기준
                              parentNode.position.y + 50,
                              { zoom: 1.2, duration: 500 }
                            );
                          }
                        }
                      }}
                      disabled={!edges.find(edge => edge.target === selectedNodeId)}
                      className="flex-1 px-3 py-2 bg-purple-700/90 text-white rounded-lg backdrop-blur-sm transition-all duration-200 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="w-3 h-3" />
                      상위노드 보기
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
              

              {/* 노드 추가 폼 */}
              {isAddingNode && (
                <div className="mb-4 bg-white/15 rounded-lg border border-white/30 p-3 backdrop-blur-sm animate-in slide-in-from-bottom-4 duration-300 ease-out">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-semibold text-gray-700 min-w-[40px]">제목</label>
                      <input
                        type="text"
                        value={newNodeText}
                        onChange={(e) => setNewNodeText(e.target.value)}
                        placeholder="노드 제목"
                        className="flex-1 px-2 py-1.5 bg-white/40 border border-white/50 rounded text-gray-900 placeholder-gray-600 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-semibold text-gray-700 min-w-[40px]">내용</label>
                      <input
                        type="text"
                        value={newNodeDescription}
                        onChange={(e) => setNewNodeDescription(e.target.value)}
                        placeholder="세부 설명 (선택사항)"
                        className="flex-1 px-2 py-1.5 bg-white/40 border border-white/50 rounded text-gray-900 placeholder-gray-600 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-semibold text-gray-700 min-w-[40px]">카테고리</label>
                      <select
                        value={newNodeType}
                        onChange={(e) => setNewNodeType(e.target.value as MindmapNodeData['type'])}
                        className="flex-1 px-2 py-1.5 bg-white/40 border border-white/50 rounded text-gray-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="idea">아이디어</option>
                        <option value="feature">기능</option>
                        <option value="problem">문제점</option>
                        <option value="solution">해결책</option>
                        <option value="detail">세부사항</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="h-px bg-gray-300/40 my-2"></div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={addNewNode}
                      className="flex-1 px-3 py-1.5 bg-blue-700/90 text-white rounded text-xs font-semibold transition-all duration-200"
                      disabled={!newNodeText.trim()}
                    >
                      추가
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingNode(false);
                        setNewNodeText('');
                        setNewNodeDescription('');
                      }}
                      className="flex-1 px-3 py-1.5 bg-gray-600/90 text-white rounded text-xs font-semibold transition-all duration-200"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
              
              {/* 실행 취소/재실행 버튼 */}
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
                  <div className={`transition-transform duration-500 ease-in-out ${isFloatingPanelOpen ? 'rotate-45' : 'rotate-0'}`}>
                    <Plus className="w-4 h-4" />
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
                  <h4 className="font-semibold text-purple-800">자동 생성 모드</h4>
                </div>
                <div className="text-sm text-purple-700">
                  <p className="mb-2">주제를 분석하여 다음과 같이 자동으로 구조를 생성합니다:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• 문제점, 아이디어, 기능, 세부사항 등 주요 카테고리 생성</li>
                    <li>• 각 카테고리마다 2-4개의 하위 노드 자동 확장</li>
                    <li>• 최대 2차 구조까지 체계적으로 구성</li>
                    <li>• 프로젝트 기획에 필요한 전체적인 프레임워크 제공</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 간편 모드 설정 */}
            {aiExpandMode === 'simple' && (
              <div className="space-y-4 mb-6">
                {/* 카테고리 선택 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">생성할 아이디어 타입</label>
                  <select
                    value={aiExpandCategory}
                    onChange={(e) => setAiExpandCategory(e.target.value as MindmapNodeData['type'] | 'mixed')}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="mixed">자동 생성 (추천)</option>
                    <option value="idea">아이디어</option>
                    <option value="feature">기능</option>
                    <option value="problem">문제점</option>
                    <option value="solution">해결책</option>
                    <option value="detail">세부사항</option>
                  </select>
                </div>

                {/* 확장 개수 슬라이더 - 자동 생성이 아닐 때만 표시 */}
                {aiExpandCategory !== 'mixed' && (
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
                {aiExpandMode === 'auto' ? '자동 생성 실행' : '확장하기'}
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
                  {initialPrompt || '프로젝트 아이디어'}
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
                    setSelectedNodeId(node.id);
                    setEditingNodeText(node.data.label);
                    setEditingNodeDescription(node.data.description || '');
                    setEditingNodeType(node.data.type);
                    setIsEditingNode(true);
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
                    setIsAddingNode(true);
                  }
                  setContextMenu(null);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                하위노드 추가
              </button>
              <button
                onClick={() => {
                  if (contextMenu.nodeId) {
                    setSelectedNodeId(contextMenu.nodeId);
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
                AI 확장
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
            onConnect={onConnect}
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
            connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: 'none' }}
            fitView
            fitViewOptions={{
              padding: 0.05,
              maxZoom: 1.5,
              minZoom: 0.3,
            }}
            attributionPosition="bottom-left"
          >
            <Controls position="top-left" />
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