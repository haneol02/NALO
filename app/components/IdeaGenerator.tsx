'use client';

import { useState, useEffect } from 'react';
import { FileText, GitBranch, Upload } from 'lucide-react';

interface IdeaGeneratorProps {
  onSearch: (prompt: string) => Promise<void>;
  isLoading: boolean;
  selectedKeywords?: string[];
  onDirectGeneration?: (prompt: string) => Promise<void>;
  onMindmapGeneration?: (prompt: string) => Promise<void>;
}

export default function IdeaGenerator({ onSearch, isLoading, selectedKeywords: propSelectedKeywords = [], onDirectGeneration, onMindmapGeneration }: IdeaGeneratorProps) {
  const [inputText, setInputText] = useState('');
  const [totalIdeas, setTotalIdeas] = useState<number>(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const [generationMode, setGenerationMode] = useState<'topic' | 'mindmap'>('topic');

  // 마인드맵 불러오기 함수
  const handleLoadMindmap = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          
          // 데이터 유효성 검사
          if (data.nodes && data.edges && Array.isArray(data.nodes) && Array.isArray(data.edges)) {
            // 불러온 마인드맵으로 브레인스토밍 모드 시작
            if (onMindmapGeneration) {
              // 로드된 데이터를 가지고 마인드맵 모드로 이동
              localStorage.setItem('loadedMindmapData', JSON.stringify(data));
              await onMindmapGeneration('불러온 마인드맵');
            }
          } else {
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
  };

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

    if (generationMode === 'mindmap' && onMindmapGeneration) {
      await onMindmapGeneration(inputText.trim());
    } else {
      await onSearch(inputText.trim());
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card card-hover mt-6 sm:mt-8 md:mt-12">
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* 생성 모드 선택 */}
          {onMindmapGeneration && (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-slate-800 mb-3">생성 방식 선택:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  generationMode === 'topic'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="generationMode"
                    value="topic"
                    checked={generationMode === 'topic'}
                    onChange={(e) => setGenerationMode(e.target.value as 'topic' | 'mindmap')}
                    className="mr-3"
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-800">주제 탐색 (리서치)</div>
                    <div className="text-xs text-slate-600">다양한 소스 리서치 기반</div>
                  </div>
                </label>
                <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  generationMode === 'mindmap'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="generationMode"
                    value="mindmap"
                    checked={generationMode === 'mindmap'}
                    onChange={(e) => setGenerationMode(e.target.value as 'topic' | 'mindmap')}
                    className="mr-3"
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-800 flex items-center gap-1">
                      <GitBranch className="w-3 h-3" />
                      브레인스토밍 (마인드맵)
                    </div>
                    <div className="text-xs text-slate-600">시각적 아이디어 확장</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          <div className="space-y-3 sm:space-y-4">
            <label htmlFor="textInput" className="block text-base sm:text-lg font-semibold text-slate-800">
              관심사나 주제를 문장으로 입력해주세요:
            </label>
            <textarea
              id="textInput"
              placeholder="예: AI 챗봇 서비스를 만들고 싶어요."
              className="input-field selectable min-h-[100px] sm:min-h-[120px] resize-none text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <p className="text-[10px] min-[375px]:text-xs sm:text-sm text-slate-500 text-center px-2">
              {generationMode === 'mindmap'
                ? 'AI가 마인드맵으로 아이디어를 시각적으로 구체화하고 확장합니다.'
                : 'AI가 다양한 소스(Wikipedia, 논문, Web)에서 리서치하여 아이디어를 생성합니다.'
              }
            </p>
          </div>

          <div className="text-center pt-2 sm:pt-4">
            <div className="flex flex-col gap-3 items-stretch max-w-sm mx-auto sm:max-w-none sm:flex-row sm:items-center sm:justify-center sm:gap-4">
              <button
                type="submit"
                disabled={isLoading || (!inputText.trim() && generationMode !== 'mindmap')}
                className={`
                  btn-primary btn-click text-sm sm:text-lg px-4 sm:px-8 py-3 sm:py-4 rounded-xl
                  ${isLoading || (!inputText.trim() && generationMode !== 'mindmap')
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:scale-105 hover:shadow-lg'
                  }
                  transition-all duration-200
                `}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 sm:h-5 w-4 sm:w-5 border-2 border-white border-t-transparent"></div>
                    <span className="hidden min-[375px]:inline">
                      {generationMode === 'mindmap' ? '브레인스토밍 생성 중...' : '주제 생성 중...'}
                    </span>
                    <span className="min-[375px]:hidden">
                      {generationMode === 'mindmap' ? '생성 중...' : '주제 생성 중...'}
                    </span>
                  </span>
                ) : (
                  <span>
                    <span className="hidden min-[375px]:inline">
                      {generationMode === 'mindmap' ? '브레인스토밍으로 구체화하기' : '주제 탐색 시작하기'}
                    </span>
                    <span className="min-[375px]:hidden">
                      {generationMode === 'mindmap' ? '브레인스토밍' : '탐색 시작'}
                    </span>
                  </span>
                )}
              </button>
              
              {/* 브레인스토밍 모드일 때만 불러오기 버튼 표시 */}
              {generationMode === 'mindmap' && (
                <button
                  type="button"
                  onClick={handleLoadMindmap}
                  disabled={isLoading}
                  className={`
                    btn-secondary btn-click text-sm sm:text-lg px-4 sm:px-8 py-3 sm:py-4 rounded-xl
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-lg'}
                    transition-all duration-200 flex items-center justify-center gap-2
                  `}
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden min-[375px]:inline">마인드맵 불러오기</span>
                  <span className="min-[375px]:hidden">불러오기</span>
                </button>
              )}
              
              <a
                href="/ideas"
                className="btn-secondary btn-click text-sm sm:text-lg px-4 sm:px-8 py-3 sm:py-4 rounded-xl hover:scale-105 hover:shadow-lg transition-all duration-200"
              >
                <span className="hidden min-[375px]:inline">기획서 저장소</span>
                <span className="min-[375px]:hidden">저장소</span>
              </a>
            </div>
          </div>
        </form>
        
        {/* 통계 정보 */}
        <div className="text-center mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-100">
          <p className="text-[10px] min-[375px]:text-xs sm:text-sm text-slate-500 font-semibold text-center px-4">
            현재까지 <span className="bg-gradient-to-r from-blue-400/70 via-blue-500/70 to-indigo-500/70 bg-clip-text text-transparent">{totalIdeas.toLocaleString()}개의 아이디어</span>가 만들어졌습니다.
          </p>
        </div>
      </div>
    </div>
  );
}