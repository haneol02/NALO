'use client';

import { useState } from 'react';
import { CATEGORIES } from '@/types';

interface IdeaGeneratorProps {
  onSearch: (keywords: string[]) => void;
  isLoading: boolean;
  selectedKeywords?: string[];
}

export default function IdeaGenerator({ onSearch, isLoading, selectedKeywords: propSelectedKeywords = [] }: IdeaGeneratorProps) {
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(propSelectedKeywords);
  const [inputValue, setInputValue] = useState('');

  const handleCategoryClick = (category: string) => {
    if (!selectedKeywords.includes(category)) {
      setSelectedKeywords(prev => [...prev, category]);
    }
  };

  const handleKeywordRemove = (keyword: string) => {
    setSelectedKeywords(prev => prev.filter(k => k !== keyword));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newKeyword = inputValue.trim();
      if (!selectedKeywords.includes(newKeyword)) {
        setSelectedKeywords(prev => [...prev, newKeyword]);
      }
      setInputValue('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedKeywords.length === 0) {
      alert('최소 하나의 키워드를 선택하거나 입력해주세요.');
      return;
    }

    onSearch(selectedKeywords);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 선택된 키워드 */}
          {selectedKeywords.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                선택된 키워드
              </h3>
              <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-lg border border-slate-200 min-h-[60px]">
                {selectedKeywords.map((keyword, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => handleKeywordRemove(keyword)}
                      className="hover:bg-blue-200 rounded-full p-1 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 분야 선택 */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              대표 분야 선택 <span className="text-sm text-slate-500">(클릭하면 키워드에 추가)</span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategoryClick(category)}
                  className={`
                    flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                    ${selectedKeywords.includes(category) 
                      ? 'border-blue-500 bg-blue-50 text-blue-700 opacity-60 cursor-default' 
                      : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700'
                    }
                  `}
                  disabled={selectedKeywords.includes(category)}
                >
                  <span className="font-medium text-sm md:text-base">
                    {category}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 직접 입력 */}
          <div>
            <label htmlFor="customInput" className="block text-lg font-semibold text-slate-800 mb-4">
              직접 키워드 입력:
            </label>
            <input
              type="text"
              id="customInput"
              placeholder="키워드 입력 후 Enter 키를 눌러주세요"
              className="input-field"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleInputKeyDown}
            />
            <p className="text-sm text-slate-500 mt-2">
              예: AI, 채팅봇, 사이드프로젝트, 창업 등 (개별 입력 후 Enter)
            </p>
          </div>

          {/* 생성 버튼 */}
          <div className="text-center">
            <button
              type="submit"
              disabled={isLoading || selectedKeywords.length === 0}
              className={`
                btn-primary text-lg px-8 py-4 rounded-xl
                ${isLoading || selectedKeywords.length === 0
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:scale-105 hover:shadow-lg'
                }
                transition-all duration-200
              `}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  생성 중...
                </span>
              ) : (
                <>지금 바로 검색하기</>
              )}
            </button>
            
            <p className="text-sm text-slate-500 mt-4">
              선택된 키워드로 검색 결과를 먼저 확인해보세요
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}