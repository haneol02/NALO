'use client';

import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';

interface IdeaGeneratorProps {
  onSearch: (keywords: string[]) => Promise<void>;
  isLoading: boolean;
  selectedKeywords?: string[];
}

export default function IdeaGenerator({ onSearch, isLoading, selectedKeywords: propSelectedKeywords = [] }: IdeaGeneratorProps) {
  const [inputText, setInputText] = useState('');
  const [totalIdeas, setTotalIdeas] = useState<number>(0);
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    fetchTotalIdeas();
  }, []);

  const fetchTotalIdeas = async () => {
    try {
      const response = await fetch('/api/ideas');
      const data = await response.json();
      
      if (data.success) {
        setTotalIdeas(data.ideas?.length || 0);
      }
    } catch (error) {
      console.error('아이디어 개수 조회 실패:', error);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputText.trim()) {
      alert('관심사나 주제에 대한 문장을 입력해주세요.');
      return;
    }

    setIsExtracting(true);
    
    try {
      const response = await fetch('/api/extract-keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        throw new Error('키워드 추출에 실패했습니다.');
      }

      const data = await response.json();
      await onSearch(data.keywords);
    } catch (error) {
      console.error('키워드 추출 오류:', error);
      alert('키워드 추출 중 오류가 발생했습니다.');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card card-hover">
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          <div className="space-y-3 sm:space-y-4">
            <label htmlFor="textInput" className="block text-base sm:text-lg font-semibold text-slate-800">
              관심사나 주제를 문장으로 입력해주세요:
            </label>
            <textarea
              id="textInput"
              placeholder="예: AI를 활용한 웹 서비스를 만들고 싶어요. 특히 사용자와 대화하면서 도움을 주는 챗봇 서비스에 관심이 있습니다."
              className="input-field selectable min-h-[100px] sm:min-h-[120px] resize-none text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <p className="text-[10px] min-[375px]:text-xs sm:text-sm text-slate-500 text-center sm:text-left">
              여러분의 관심사를 자연스럽게 설명해주세요.<br className="sm:hidden" />
              <span className="hidden sm:inline"> </span>AI가 핵심 키워드를 추출하여 주제 탐색을 도와드립니다.
            </p>
          </div>

          <div className="text-center pt-2 sm:pt-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-center max-w-md mx-auto sm:max-w-none">
              <button
                type="submit"
                disabled={isLoading || isExtracting || !inputText.trim()}
                className={`
                  btn-primary btn-click text-lg px-8 py-4 rounded-xl
                  ${isLoading || isExtracting || !inputText.trim()
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:scale-105 hover:shadow-lg'
                  }
                  transition-all duration-200
                `}
              >
                {isExtracting ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    키워드 추출 중...
                  </span>
                ) : isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    아이디어 생성 중...
                  </span>
                ) : (
                  <>아이디어 생성하기</>
                )}
              </button>
              
              <a
                href="/ideas"
                className="btn-secondary btn-click text-lg px-8 py-4 rounded-xl hover:scale-105 hover:shadow-lg transition-all duration-200"
              >
                기획서 저장소
              </a>
            </div>
          </div>
        </form>
        
        {/* 통계 정보 */}
        <div className="text-center mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-100">
          <p className="text-[10px] min-[375px]:text-xs sm:text-sm text-slate-500 font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
            현재까지 <span className="bg-gradient-to-r from-blue-400/70 via-blue-500/70 to-indigo-500/70 bg-clip-text text-transparent">{totalIdeas.toLocaleString()}개의 아이디어</span>가 만들어졌습니다.
          </p>
        </div>
      </div>
    </div>
  );
}