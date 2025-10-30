'use client';

import { Sparkles, Target } from 'lucide-react';

interface ComprehensiveAnalysisProps {
  analysis: any;
}

export default function ComprehensiveAnalysis({ analysis }: ComprehensiveAnalysisProps) {
  if (!analysis?.researchSummary) return null;

  return (
    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-300 rounded-xl p-6 mb-8 shadow-lg">
      <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-purple-600" />
        종합 리서치 분석
      </h3>

      {/* 핵심 발견사항 */}
      <div className="bg-white rounded-lg p-4 mb-4 border border-purple-200">
        <h4 className="text-sm font-bold text-purple-800 mb-2">📋 핵심 발견사항</h4>
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
          {analysis.researchSummary.mainFindings}
        </p>
      </div>

      {/* 핵심 기술 */}
      {analysis.researchSummary.keyTechnologies?.length > 0 && (
        <div className="bg-white rounded-lg p-4 mb-4 border border-purple-200">
          <h4 className="text-sm font-bold text-purple-800 mb-2">🔧 핵심 기술</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.researchSummary.keyTechnologies.map((tech: string, idx: number) => (
              <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 시장 포지션 */}
      <div className="bg-white rounded-lg p-4 mb-4 border border-purple-200">
        <h4 className="text-sm font-bold text-purple-800 mb-2">📊 시장 포지션</h4>
        <p className="text-sm text-slate-700 leading-relaxed">
          {analysis.researchSummary.marketPosition}
        </p>
      </div>

      {/* 전략 추천 */}
      {analysis.strategyRecommendation && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-300">
          <h4 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            추천 전략
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed mb-3">
            {analysis.strategyRecommendation.approach}
          </p>

          {analysis.strategyRecommendation.keyActions?.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-semibold text-amber-800 mb-2">실행 항목:</div>
              <ul className="space-y-1">
                {analysis.strategyRecommendation.keyActions.map((action: string, idx: number) => (
                  <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.strategyRecommendation.successFactors?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-amber-800 mb-2">성공 요인:</div>
              <div className="flex flex-wrap gap-2">
                {analysis.strategyRecommendation.successFactors.map((factor: string, idx: number) => (
                  <span key={idx} className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
