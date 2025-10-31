'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, Loader2, Globe } from 'lucide-react';
import { getApiKey, getPerplexityApiKey } from '@/app/lib/apiKeyStorage';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  hasCommand?: boolean;
  commandExecuted?: boolean;
}

interface MindmapChatProps {
  isOpen: boolean;
  onClose: () => void;
  onCommand: (command: any, currentSelectedId?: string) => Promise<string | undefined>;
  selectedNodeId: string | null;
  nodes: any[];
  rootLabel: string;
}

export default function MindmapChat({ isOpen, onClose, onCommand, selectedNodeId, nodes, rootLabel }: MindmapChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '안녕하세요! 마인드맵 AI 어시스턴트입니다. 원하시는 작업을 말씀해주세요.\n\n예시:\n- "메인 노드 아래에 기능 3개 추가해줘"\n- "선택한 노드를 삭제해줘"\n- "이 노드를 \'사용자 관리\'로 이름 변경해줘"',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [usePerplexity, setUsePerplexity] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 메시지 목록 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 채팅창 열릴 때 하단으로 스크롤
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen]);

  // 채팅창 열릴 때 입력창 포커스
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    // AI 응답 메시지 생성
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: 'API 키가 설정되지 않았습니다. 홈 화면에서 API 키를 입력해주세요.' }
            : msg
        ));
        setIsStreaming(false);
        return;
      }

      // Perplexity API 키 확인
      const perplexityApiKey = usePerplexity ? getPerplexityApiKey() : null;

      // Perplexity 사용 시 API 키 확인
      if (usePerplexity && !perplexityApiKey) {
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: 'Perplexity API 키가 설정되지 않았습니다. 홈 화면에서 Perplexity API 키를 입력해주세요.' }
            : msg
        ));
        setIsStreaming(false);
        return;
      }

      // 스트리밍 API 호출
      const response = await fetch('/api/mindmap/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.slice(-5), // 최근 5개 메시지만 컨텍스트로 전달
          apiKey,
          selectedNodeId,
          nodes,
          rootLabel,
          usePerplexity,
          perplexityApiKey
        }),
      });

      if (!response.ok) {
        throw new Error('API 요청 실패');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('스트리밍 지원 안됨');
      }

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

              if (parsed.type === 'content') {
                accumulatedContent += parsed.content;
                // [COMMAND] 부분 제거
                const cleanContent = accumulatedContent.replace(/\[COMMAND\][\s\S]*$/, '').trim();
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: cleanContent }
                    : msg
                ));
              } else if (parsed.type === 'command') {
                // 명령어 수신 표시
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, hasCommand: true }
                    : msg
                ));

                // 명령어 실행 (단일 또는 여러 개)
                const command = parsed.command;

                if (command.commands && Array.isArray(command.commands)) {
                  // 여러 명령어 순차 실행
                  let currentNodeId: string | undefined = undefined;
                  for (let i = 0; i < command.commands.length; i++) {
                    const cmd = command.commands[i];
                    console.log(`[명령어 ${i + 1}/${command.commands.length}] 실행:`, cmd.action);
                    currentNodeId = await onCommand(cmd, currentNodeId);
                    console.log(`[명령어 ${i + 1}/${command.commands.length}] 완료, 반환 ID:`, currentNodeId);

                    // 각 명령어 사이에 대기 시간 (state 업데이트 완료 보장)
                    if (i < command.commands.length - 1) {
                      await new Promise(resolve => setTimeout(resolve, 800));
                    }
                  }
                } else {
                  // 단일 명령어 실행
                  await onCommand(command);
                  // 명령어 실행 후 대기
                  await new Promise(resolve => setTimeout(resolve, 500));
                }

                // 명령어 실행 완료 표시
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, commandExecuted: true }
                    : msg
                ));
              }
            } catch (e) {
              // JSON 파싱 오류 무시
            }
          }
        }
      }
    } catch (error) {
      console.error('채팅 오류:', error);
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? { ...msg, content: '오류가 발생했습니다. 다시 시도해주세요.' }
          : msg
      ));
    } finally {
      setIsStreaming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-4 bottom-4 w-80 h-[600px] bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 flex flex-col z-50 overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600">
        <div className="flex items-center gap-2 text-white">
          <div className="p-1.5 bg-white/20 rounded-lg">
            <MessageSquare className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-sm">AI 어시스턴트</h3>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-all duration-200 hover:scale-110"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50/50 to-transparent">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                  : 'bg-white border border-gray-100 text-gray-800'
              }`}
            >
              {message.role === 'user' ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
              ) : (
                <div className="text-sm leading-relaxed markdown-content">
                  <ReactMarkdown
                    components={{
                      p: ({node, ...props}) => <p className="my-1" {...props} />,
                      h1: ({node, ...props}) => <h1 className="text-lg font-bold mt-3 mb-2" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-base font-bold mt-3 mb-2" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-sm font-bold mt-2 mb-1" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside my-1 space-y-0.5" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-inside my-1 space-y-0.5" {...props} />,
                      li: ({node, ...props}) => <li className="my-0.5" {...props} />,
                      code: ({node, inline, ...props}: any) =>
                        inline ? (
                          <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono" {...props} />
                        ) : (
                          <code className="block bg-gray-100 p-2 rounded text-xs font-mono my-2 overflow-x-auto" {...props} />
                        ),
                      pre: ({node, ...props}) => <pre className="bg-gray-100 p-2 rounded my-2 overflow-x-auto" {...props} />,
                      a: ({node, ...props}) => <a className="text-blue-600 hover:underline" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                      em: ({node, ...props}) => <em className="italic" {...props} />,
                      blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-3 my-2 italic" {...props} />,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}

              {/* 명령어 실행 상태 표시 */}
              {message.hasCommand && (
                <div className={`mt-2 px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 font-medium ${
                  message.commandExecuted
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {message.commandExecuted ? (
                    <>
                      <span className="text-green-500">✓</span>
                      <span>작업 완료</span>
                    </>
                  ) : (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>작업 실행 중...</span>
                    </>
                  )}
                </div>
              )}

              <p className={`text-[10px] mt-1.5 font-medium ${
                message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
              }`}>
                {message.timestamp.toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        ))}
        {isStreaming && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white border border-gray-100 rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-sm text-gray-600">입력 중...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 bg-white/80 space-y-2">
        {/* Perplexity 웹검색 옵션 */}
        <label className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-800 transition-colors cursor-pointer group">
          <input
            type="checkbox"
            checked={usePerplexity}
            onChange={(e) => setUsePerplexity(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-400 focus:ring-offset-0 transition-all"
            disabled={isStreaming}
          />
          <Globe className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
          <span className="font-medium">Perplexity 웹검색 사용</span>
          <span className="text-gray-400">(최신 정보 검색)</span>
        </label>

        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="메시지를 입력하세요..."
            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-sm bg-gray-50/50"
            rows={1}
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md disabled:hover:shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
