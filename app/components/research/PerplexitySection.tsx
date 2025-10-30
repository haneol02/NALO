'use client';

import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PerplexitySectionProps {
  data: any;
  isIncluded: boolean;
}

export default function PerplexitySection({ data, isIncluded }: PerplexitySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isIncluded || !data?.content) {
    return null;
  }

  return (
    <div className="bg-white border-2 border-orange-200 rounded-xl p-4 sm:p-6 mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-orange-600" />
          <div>
            <h3 className="text-lg font-bold text-orange-900">
              실시간 웹 리서치 (Perplexity AI)
            </h3>
            <p className="text-sm text-orange-700">
              최신 시장 트렌드 및 전문가 의견
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-orange-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-orange-600" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-6">
          <div className="prose prose-sm max-w-none">
            <div className="text-sm leading-relaxed break-words">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline" />,
                  ul: ({node, ...props}) => <ul {...props} className="list-disc list-inside space-y-1" />,
                  ol: ({node, ...props}) => <ol {...props} className="list-decimal list-inside space-y-1" />,
                  code: ({node, inline, ...props}) =>
                    inline
                      ? <code {...props} className="bg-orange-200 text-orange-900 px-1 py-0.5 rounded text-xs" />
                      : <code {...props} className="block bg-slate-800 text-slate-100 p-3 rounded overflow-x-auto text-xs" />,
                  h1: ({node, ...props}) => <h1 {...props} className="text-lg font-bold text-orange-900 mt-4 mb-2" />,
                  h2: ({node, ...props}) => <h2 {...props} className="text-base font-bold text-orange-900 mt-3 mb-2" />,
                  h3: ({node, ...props}) => <h3 {...props} className="text-sm font-bold text-orange-900 mt-2 mb-1" />,
                  p: ({node, ...props}) => <p {...props} className="mb-2 text-slate-700" />,
                  strong: ({node, ...props}) => <strong {...props} className="font-semibold text-slate-800" />,
                }}
              >
                {data.content}
              </ReactMarkdown>
            </div>
          </div>

          {data.citations && data.citations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-orange-200">
              <div className="text-xs font-semibold text-orange-700 mb-2">참고 자료:</div>
              <div className="space-y-1">
                {data.citations.map((citation: string, index: number) => (
                  <div key={index} className="text-xs text-orange-600 break-words overflow-wrap-anywhere">
                    [{index + 1}] {citation}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
