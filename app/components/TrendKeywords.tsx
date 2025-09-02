'use client';

import { useEffect, useState } from 'react';

interface TrendKeyword {
  keyword: string;
  category: string;
}

// 목업 데이터 제거 - 오직 실제 검색 결과만 표시

export default function TrendKeywords() {
  const [trends, setTrends] = useState<TrendKeyword[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    try {
      console.log('=== 트렌드 키워드 fetch 시작 ===');
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/trends', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('트렌드 API 응답 상태:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('트렌드 API 응답 데이터:', data);
        
        if (data.success && data.trends && data.trends.length > 0) {
          const displayTrends = data.trends.slice(0, 8);
          console.log('✅ 실제 트렌드 수집 성공:', displayTrends.map((t: any) => t.keyword));
          setTrends(displayTrends);
        } else {
          console.log('❌ 트렌드 수집 실패 - 빈 배열');
          setError('트렌드 수집에 실패했습니다');
          setTrends([]);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log('❌ 트렌드 API 오류:', errorData.error);
        setError(errorData.error || '트렌드 로드 실패');
        setTrends([]);
      }
      console.log('==============================');
    } catch (error) {
      console.error('❌ 트렌드 fetch 에러:', error);
      setError('네트워크 오류가 발생했습니다');
      setTrends([]);
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
        
        {error ? (
          <div className="text-center py-4">
            <p className="text-red-500 text-sm mb-2">{error}</p>
            <button 
              onClick={fetchTrends}
              className="text-blue-500 text-sm hover:underline"
              disabled={isLoading}
            >
              다시 시도
            </button>
          </div>
        ) : trends.length > 0 ? (
          <>
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
              실시간 검색 API에서 수집된 실제 트렌드 데이터입니다
            </p>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-slate-400 text-sm">
              트렌드 데이터를 로드 중입니다...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}