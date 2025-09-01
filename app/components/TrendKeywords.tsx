'use client';

import { useEffect, useState } from 'react';

interface TrendKeyword {
  keyword: string;
  category: string;
}

const MOCK_TRENDS: TrendKeyword[] = [
  { keyword: 'AI도구', category: '개발/기술' },
  { keyword: '원격근무', category: '비즈니스' },
  { keyword: '지속가능성', category: '라이프스타일' },
  { keyword: 'NFT', category: '기술' },
  { keyword: '메타버스', category: '기술' },
  { keyword: '부업', category: '비즈니스' },
  { keyword: '헬스테크', category: '헬스케어' },
  { keyword: '펫테크', category: '라이프스타일' },
];

export default function TrendKeywords() {
  const [trends, setTrends] = useState<TrendKeyword[]>(MOCK_TRENDS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/trends');
      
      if (response.ok) {
        const data = await response.json();
        if (data.trends && data.trends.length > 0) {
          setTrends(data.trends.slice(0, 8));
        }
      }
    } catch (error) {
      console.error('Error fetching trends:', error);
      // 실패시 목업 데이터 유지
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-12">
      <div className="card max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <h2 className="text-lg font-semibold text-slate-800">
            지금 뜨는 키워드
          </h2>
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {trends.map((trend, index) => (
            <span 
              key={index}
              className="tag hover:bg-blue-100 cursor-pointer transition-colors duration-200"
            >
              {trend.keyword}
            </span>
          ))}
        </div>
        
        <p className="text-sm text-slate-500 mt-4">
          실시간으로 업데이트되는 글로벌 트렌드를 바탕으로 아이디어를 생성합니다
        </p>
      </div>
    </div>
  );
}