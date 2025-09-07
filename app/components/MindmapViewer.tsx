'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import { Plus, Lightbulb, FileText, Sparkles, Target, Wrench, Settings, X, ChevronUp, Edit3, Trash2, Eye, ArrowUp, ArrowDown } from 'lucide-react';

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
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
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
      
      <div className="flex items-center gap-2 mb-1">
        {getNodeIcon()}
        <span className="font-semibold text-sm">{data.label}</span>
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
  const [isFloatingPanelOpen, setIsFloatingPanelOpen] = useState(false);
  const [showAiConfirmModal, setShowAiConfirmModal] = useState(false);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, nodeId?: string, edgeId?: string} | null>(null);
  
  // 실행 취소/재실행을 위한 히스토리
  const [history, setHistory] = useState<{nodes: Node[], edges: Edge[]}[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // 초기 노드와 엣지
  const initialNodes: Node[] = [
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
  ];

  const initialEdges: Edge[] = [];

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
    const newNode: Node = {
      id: newNodeId,
      type: 'custom',
      position: {
        x: selectedNode.position.x + (Math.random() - 0.5) * 200,
        y: selectedNode.position.y + 120 + (Math.random() - 0.5) * 80,
      },
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
  }, [newNodeText, newNodeType, selectedNodeId, nodes, setNodes, setEdges, saveToHistory]);

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
              description: editingNodeDescription || node.data.description
            }
          }
        : node
    ));
    
    setIsEditingNode(false);
    setEditingNodeText('');
    setEditingNodeDescription('');
  }, [editingNodeText, editingNodeDescription, selectedNodeId, setNodes, saveToHistory]);

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
    
    try {
      console.log('=== AI 확장 요청 시작 ===');
      
      const response = await fetch('/api/mindmap/expand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedNode,
          context: initialPrompt
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

      const newNodes: Node[] = aiSuggestions.map((suggestion: any, index: number) => {
        const newNodeId = `ai_${Date.now()}_${index}`;
        return {
          id: newNodeId,
          type: 'custom',
          position: {
            x: selectedNode.position.x + (index - Math.floor(aiSuggestions.length / 2)) * 180,
            y: selectedNode.position.y + 140 + Math.random() * 30,
          },
          data: {
            label: suggestion.label,
            type: suggestion.type || 'idea',
            description: suggestion.description || undefined
          },
        };
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
  }, [selectedNodeId, nodes, setNodes, setEdges, initialPrompt, isAiExpanding]);

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

  // 기획서 생성
  const handleGeneratePlan = () => {
    if (onGeneratePlan) {
      onGeneratePlan({ nodes, edges });
    }
  };

  return (
    <div className="bg-gray-50 relative w-full overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>

      {/* 하단 플로팅 글래스모피즘 UI 패널 */}
      <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30 backdrop-blur-xl bg-white/20 border border-white/30 shadow-2xl rounded-2xl transition-all duration-700 ease-in-out ${isFloatingPanelOpen ? 'w-48 min-w-48' : isAddingNode || isEditingNode ? 'w-80 min-w-80' : 'w-auto min-w-72'}`}>
        <div className={`px-4 py-3 transition-all duration-700 ease-in-out ${isFloatingPanelOpen ? 'max-h-40' : isAddingNode || isEditingNode ? 'max-h-[32rem]' : 'max-h-96'} overflow-hidden`}>
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
                  {/* 노드 정보 표시 */}
                  <div className="mb-3 p-3 bg-white/10 rounded-lg border border-white/20 transform transition-all duration-200 hover:bg-white/20">
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
                  
                  {/* 액션 버튼들 */}
                  <div className="flex items-center gap-2 mb-3 transform transition-all duration-200">
                    <button
                      onClick={() => setIsAddingNode(true)}
                      className="flex-1 px-3 py-2 bg-blue-700/90 text-white rounded-lg backdrop-blur-sm transition-all duration-200 text-xs font-semibold flex items-center justify-center gap-2"
                    >
                      <Plus className="w-3 h-3" />
                      하위노드 추가
                    </button>
                    <button
                      onClick={() => setShowAiConfirmModal(true)}
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
              
              {/* 노드 편집 폼 */}
              {isEditingNode && (
                <div className="mt-4 bg-white/15 rounded-lg border border-white/30 p-4 space-y-3 backdrop-blur-sm animate-in slide-in-from-bottom-4 duration-300 ease-out">
                  <input
                    type="text"
                    value={editingNodeText}
                    onChange={(e) => setEditingNodeText(e.target.value)}
                    placeholder="노드 텍스트 수정"
                    className="w-full px-3 py-2 bg-white/40 border border-white/50 rounded-md text-gray-900 placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    autoFocus
                  />
                  <textarea
                    value={editingNodeDescription}
                    onChange={(e) => setEditingNodeDescription(e.target.value)}
                    placeholder="설명 추가 (선택사항)"
                    className="w-full px-3 py-2 bg-white/40 border border-white/50 rounded-md text-gray-900 placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-16 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveNodeEdit}
                      className="flex-1 px-4 py-2 bg-green-700/90 text-white rounded-lg backdrop-blur-sm transition-all duration-200 text-sm font-semibold"
                      disabled={!editingNodeText.trim()}
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingNode(false);
                        setEditingNodeText('');
                        setEditingNodeDescription('');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-700/90 text-white rounded-lg backdrop-blur-sm transition-all duration-200 text-sm font-semibold"
                    >
                      취소
                    </button>
                  </div>
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
      </div>

      {/* AI 확장 확인 모달 */}
      {showAiConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 max-w-md mx-4 border border-white/30 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Sparkles className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">AI 아이디어 확장</h3>
            </div>
            <div className="space-y-3 mb-6">
              <p className="text-gray-700 text-sm leading-relaxed">
                선택한 노드를 기반으로 AI가 관련된 새로운 아이디어들을 자동으로 생성합니다.
              </p>
              <ul className="text-xs text-gray-600 space-y-1 pl-4">
                <li>• 현재 노드와 연관된 다양한 관점의 아이디어 생성</li>
                <li>• 문제점, 해결책, 기능 등 다양한 타입으로 확장</li>
                <li>• 프로젝트 맥락을 고려한 실용적인 제안</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAiConfirmModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 text-sm font-semibold"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setShowAiConfirmModal(false);
                  expandWithAI();
                }}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                확장하기
              </button>
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
            onEdgeClick={onEdgeClick}
            onEdgeContextMenu={onEdgeContextMenu}
            onPaneClick={onPaneClick}
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