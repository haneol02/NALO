'use client';

import { useState } from 'react';
import { Building2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface G2BSectionProps {
  data: any[];
  isIncluded: boolean;
  searchKeywords?: string[];
}

export default function G2BSection({ data, isIncluded, searchKeywords }: G2BSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isIncluded) {
    return null;
  }

  const successfulResults = Array.isArray(data) ? data.filter((r: any) => r?.success && r?.data?.bids?.length > 0) : [];
  const totalBids = successfulResults.reduce((sum: number, r: any) => sum + (r?.data?.bids?.length || 0), 0);

  if (successfulResults.length === 0) {
    return null;
  }

  // 예산 포맷 함수
  const formatBudget = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseInt(amount) : amount;
    if (isNaN(num) || num === 0) return '-';
    if (num >= 100000000) return `${(num / 100000000).toFixed(1)}억원`;
    if (num >= 10000) return `${(num / 10000).toFixed(0)}만원`;
    return `${num.toLocaleString()}원`;
  };

  // 날짜 포맷 함수
  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr.length < 8) return '-';
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${year}.${month}.${day}`;
  };

  return (
    <div className="bg-white border-2 border-indigo-200 rounded-xl p-4 sm:p-6 mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-indigo-600" />
          <div>
            <h3 className="text-lg font-bold text-indigo-900">
              나라장터 공공조달 정보
            </h3>
            <p className="text-sm text-indigo-700">
              {totalBids}개의 입찰공고 발견
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-indigo-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-indigo-600" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-6 space-y-4">
          {/* 검색 키워드 표시 */}
          {searchKeywords && searchKeywords.length > 0 && (
            <div className="bg-indigo-100 rounded-lg p-3 border border-indigo-300">
              <p className="text-xs font-semibold text-indigo-800 mb-2">사용된 검색 키워드:</p>
              <div className="flex flex-wrap gap-2">
                {searchKeywords.map((keyword, idx) => (
                  <span key={idx} className="px-2 py-1 bg-white text-indigo-700 rounded text-xs font-medium border border-indigo-200">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {successfulResults.map((result, index) => (
            <div key={index} className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <div className="mb-3">
                <p className="text-xs text-indigo-600 mb-2">
                  검색 키워드: <span className="font-semibold">{result.keyword}</span>
                </p>

                {result.data.statistics && (
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div className="bg-white rounded p-2 border border-indigo-100">
                      <span className="text-indigo-600">총 공고 수:</span>
                      <span className="font-semibold ml-1">{result.data.statistics.bidCount}건</span>
                    </div>
                    <div className="bg-white rounded p-2 border border-indigo-100">
                      <span className="text-indigo-600">평균 예산:</span>
                      <span className="font-semibold ml-1">{formatBudget(result.data.statistics.avgBudget)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {result.data.bids.slice(0, 3).map((bid: any, bIndex: number) => (
                  <div key={bIndex} className="bg-white rounded p-3 border border-indigo-100">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="text-sm font-medium text-slate-800 break-words flex-1 pr-2">
                        {bid.bidNtceNm}
                      </h5>
                      {bid.bidNtceUrl && (
                        <a
                          href={bid.bidNtceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-700 flex-shrink-0"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <p>
                        <span className="text-indigo-600 font-medium">수요기관:</span> {bid.dminsttNm || '-'}
                      </p>
                      <p>
                        <span className="text-indigo-600 font-medium">예산:</span> {formatBudget(bid.asignBdgtAmt || bid.presmptPrce)}
                      </p>
                      <div className="flex gap-4">
                        <p>
                          <span className="text-indigo-600 font-medium">공고일:</span> {formatDate(bid.bidNtceDt)}
                        </p>
                        <p>
                          <span className="text-indigo-600 font-medium">마감일:</span> {formatDate(bid.bidClseDt)}
                        </p>
                      </div>
                      {bid.bidMethdNm && (
                        <p>
                          <span className="text-indigo-600 font-medium">입찰방법:</span> {bid.bidMethdNm}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {result.data.bids.length > 3 && (
                <p className="text-xs text-indigo-600 mt-3 text-center">
                  외 {result.data.bids.length - 3}개 입찰공고 더보기...
                </p>
              )}

              {result.data.statistics?.topAgencies && result.data.statistics.topAgencies.length > 0 && (
                <div className="mt-4 pt-3 border-t border-indigo-200">
                  <p className="text-xs font-semibold text-indigo-900 mb-2">주요 수요기관</p>
                  <div className="flex flex-wrap gap-2">
                    {result.data.statistics.topAgencies.map((agency: any, aIndex: number) => (
                      <span
                        key={aIndex}
                        className="text-xs bg-white text-indigo-700 px-2 py-1 rounded border border-indigo-200"
                      >
                        {agency.name} ({agency.count}건)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
