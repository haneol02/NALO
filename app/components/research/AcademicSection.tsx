'use client';

import { useState } from 'react';
import { GraduationCap, ChevronDown, ChevronUp } from 'lucide-react';

interface AcademicSectionProps {
  data: any[];
  isIncluded: boolean;
}

export default function AcademicSection({ data, isIncluded }: AcademicSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isIncluded || !data || data.length === 0) {
    return null;
  }

  const successfulResults = Array.isArray(data) ? data.filter((r: any) => r?.success && r?.data?.papers?.length > 0) : [];
  const totalPapers = successfulResults.reduce((sum: number, r: any) => sum + (r?.data?.papers?.length || 0), 0);

  return (
    <div className="bg-white border-2 border-blue-200 rounded-xl p-4 sm:p-6 mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <GraduationCap className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-bold text-blue-900">
              학술 논문 리서치
            </h3>
            <p className="text-sm text-blue-700">
              {totalPapers}개의 논문 발견
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-blue-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-blue-600" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-6 space-y-4">
          {successfulResults.map((result, index) => (
            <div key={index} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-blue-600">
                    검색 키워드: <span className="font-semibold">{result.keyword}</span>
                  </p>
                  <span className="text-xs text-blue-600 font-medium px-2 py-1 bg-white rounded">
                    {result.data.papers.length}개 논문
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {result.data.papers.slice(0, 3).map((paper: any, pIndex: number) => (
                  <div key={pIndex} className="bg-white rounded p-3 border border-blue-100">
                    <h5 className="text-sm font-medium text-slate-800 mb-1 break-words">
                      {paper.title}
                    </h5>
                    <p className="text-xs text-slate-600 mb-2">
                      {paper.authors?.slice(0, 3).join(', ')} {paper.authors?.length > 3 ? '외' : ''} ({paper.year})
                    </p>
                    {paper.abstract && (
                      <p className="text-xs text-slate-600 leading-relaxed break-words line-clamp-2">
                        {paper.abstract}
                      </p>
                    )}
                    {paper.citationCount !== undefined && (
                      <p className="text-xs text-blue-600 font-medium mt-2">
                        인용 횟수: {paper.citationCount}회
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {result.data.papers.length > 3 && (
                <p className="text-xs text-blue-600 mt-3 text-center">
                  외 {result.data.papers.length - 3}개 논문 더보기...
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
