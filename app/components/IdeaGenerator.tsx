'use client';

import { useState } from 'react';
import { CATEGORIES } from '@/types';

interface IdeaGeneratorProps {
  onGenerate: (categories: string[], customInput: string) => void;
  isLoading: boolean;
  selectedCategories?: string[];
  customInput?: string;
}

export default function IdeaGenerator({ onGenerate, isLoading, selectedCategories: propSelectedCategories = [], customInput: propCustomInput = '' }: IdeaGeneratorProps) {
  // 이전 검색 기록의 영향을 받지 않도록 항상 빈 상태로 시작
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedCategories.length === 0 && !customInput.trim()) {
      alert('관심 분야를 선택하거나 직접 입력해주세요.');
      return;
    }

    onGenerate(selectedCategories, customInput.trim());
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 카테고리 선택 */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              관심있는 분야를 선택하세요 <span className="text-sm text-slate-500">(복수 선택 가능)</span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CATEGORIES.map((category) => (
                <label 
                  key={category}
                  className={`
                    flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                    ${selectedCategories.includes(category) 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selectedCategories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                  />
                  <span className="font-medium text-sm md:text-base">
                    {category}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 직접 입력 */}
          <div>
            <label htmlFor="customInput" className="block text-lg font-semibold text-slate-800 mb-4">
              또는 직접 입력:
            </label>
            <input
              type="text"
              id="customInput"
              placeholder="예: 사이드프로젝트, 창업 아이디어, 앱 개발"
              className="input-field"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
            />
            <p className="text-sm text-slate-500 mt-2">
              구체적으로 입력할수록 더 정확한 아이디어를 받을 수 있습니다
            </p>
          </div>

          {/* 생성 버튼 */}
          <div className="text-center">
            <button
              type="submit"
              disabled={isLoading || (selectedCategories.length === 0 && !customInput.trim())}
              className={`
                btn-primary text-lg px-8 py-4 rounded-xl
                ${isLoading || (selectedCategories.length === 0 && !customInput.trim())
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
                <>지금 바로 아이디어 받기</>
              )}
            </button>
            
            <p className="text-sm text-slate-500 mt-4">
              평균 3분 내에 3개의 맞춤형 아이디어를 제공합니다
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}