'use client';

interface SearchResult {
  title: string;
  snippet: string;
  link: string;
}

interface SearchResultsProps {
  searchQuery: string;
  searchResults: SearchResult[];
  selectedKeywords: string[];
  focusArea?: string;
  keywords?: string[];
  qualityScore?: number;
  onGenerateIdeas: () => void;
  onBackToInput: () => void;
  isLoading: boolean;
}

export default function SearchResults({ 
  searchQuery, 
  searchResults, 
  selectedKeywords, 
  focusArea,
  keywords = [],
  qualityScore = 0,
  onGenerateIdeas, 
  onBackToInput, 
  isLoading 
}: SearchResultsProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            검색 결과 확인
          </h2>
          <p className="text-slate-600">
            입력하신 키워드를 바탕으로 검색한 결과입니다. 이 내용으로 아이디어를 생성하시겠습니까?
          </p>
        </div>

        {/* 검색 분석 결과 */}
        <div className="mb-6 space-y-4">
          {/* 검색 쿼리 */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">생성된 검색 쿼리</h3>
            <p className="text-blue-700 font-medium">{searchQuery}</p>
          </div>
          
          {/* 분석 정보 */}
          {focusArea && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="text-sm font-semibold text-green-800 mb-2">포커스 영역</h3>
              <p className="text-green-700 font-medium">{focusArea}</p>
            </div>
          )}
          
          {/* 추출 키워드 */}
          {keywords.length > 0 && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="text-sm font-semibold text-purple-800 mb-2">추출된 키워드</h3>
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword, index) => (
                  <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm font-medium">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* 품질 점수 */}
          {qualityScore > 0 && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="text-sm font-semibold text-yellow-800 mb-2">검색 결과 품질</h3>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-yellow-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(qualityScore * 10, 100)}%` }}
                  ></div>
                </div>
                <span className="text-yellow-700 font-medium">{qualityScore}/10</span>
              </div>
            </div>
          )}
        </div>

        {/* 선택된 키워드 요약 */}
        <div className="mb-6 p-4 bg-slate-50 rounded-lg">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">선택한 키워드</h3>
          <div className="flex flex-wrap gap-2">
            {selectedKeywords.map((keyword, index) => (
              <span key={index} className="tag bg-blue-100 text-blue-700">
                {keyword}
              </span>
            ))}
          </div>
        </div>

        {/* 검색 결과 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            검색 결과 ({searchResults.length}개)
          </h3>
          
          {searchResults.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {searchResults.map((result, index) => (
                <div key={index} className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                  <h4 className="font-semibold text-slate-800 mb-2 line-clamp-2">
                    {result.title}
                  </h4>
                  <p className="text-slate-600 text-sm mb-2 line-clamp-3">
                    {result.snippet}
                  </p>
                  <a 
                    href={result.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
                  >
                    {result.link}
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500">검색 결과가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={onBackToInput}
            className="btn-secondary px-6 py-3"
            disabled={isLoading}
          >
            키워드 수정
          </button>
          <button
            onClick={onGenerateIdeas}
            className="btn-primary px-8 py-3"
            disabled={isLoading || searchResults.length === 0}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                아이디어 생성 중...
              </span>
            ) : (
              '이 내용으로 아이디어 생성하기'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}