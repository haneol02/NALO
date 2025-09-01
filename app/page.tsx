'use client';

import { useState } from 'react';
import TrendKeywords from './components/TrendKeywords';
import IdeaGenerator from './components/IdeaGenerator';
import ResultDisplay from './components/ResultDisplay';

import { Idea } from '@/types';

export default function HomePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');

  const handleGenerateIdeas = async (categories: string[], custom: string) => {
    setIsGenerating(true);
    setSelectedCategories(categories);
    setCustomInput(custom);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories,
          customInput: custom,
        }),
      });

      if (!response.ok) {
        throw new Error('아이디어 생성에 실패했습니다.');
      }

      const data = await response.json();
      setIdeas(data.ideas || []);
    } catch (error) {
      console.error('Error generating ideas:', error);
      setIdeas([]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateIdeas = () => {
    handleGenerateIdeas(selectedCategories, customInput);
  };

  const handleNewGeneration = () => {
    setIdeas([]);
    setSelectedCategories([]);
    setCustomInput('');
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="text-center py-16 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">NALO</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-700 mb-2 font-medium">
            날로 먹는 프로젝트 기획
          </p>
          <p className="text-lg text-slate-600 mb-8">
            3분이면 충분합니다. 오늘의 트렌드로 내일의 아이디어를 만들어보세요.
          </p>
          
          {/* 트렌드 키워드 */}
          <TrendKeywords />
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        {!ideas.length && !isGenerating && (
          <IdeaGenerator 
            onGenerate={handleGenerateIdeas}
            isLoading={isGenerating}
            selectedCategories={selectedCategories}
            customInput={customInput}
          />
        )}

        {isGenerating && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-6"></div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              아이디어를 생성하고 있습니다
            </h3>
            <p className="text-slate-500">
              잠시만 기다려주세요. 최고의 아이디어를 준비 중입니다.
            </p>
          </div>
        )}

        {ideas.length > 0 && !isGenerating && (
          <ResultDisplay 
            ideas={ideas}
            onRegenerate={handleRegenerateIdeas}
            onNewGeneration={handleNewGeneration}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="bg-slate-50 py-12 px-4 mt-16 border-t border-slate-200">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-slate-600 mb-4">
            이미 <span className="font-bold text-blue-600">5,247개</span>의 아이디어가 탄생했습니다
          </p>
          <p className="text-sm text-slate-500">
            NALO는 완전 무료 서비스입니다. 
            <br className="md:hidden" />
            어렵게 생각하지 말고, 일단 시작해보세요.
          </p>
        </div>
      </footer>
    </main>
  );
}