'use client';

import { useState, useCallback } from 'react';

import { Idea } from '@/types';

interface IdeaPlan {
  id: string;
  project_name: string;
  service_summary: string;
  created_date: string;
  project_type: string;
  core_idea: string;
  background: string;
  target_customer: string;
  problem_to_solve: string;
  proposed_solution: string;
  features: string[];
  project_phases: Array<{
    phase: string;
    duration: string;
    tasks: string[];
    deliverables: string[];
  }>;
  development_cost: number;
  operation_cost: number;
  marketing_cost: number;
  other_cost: number;
}

export function useIdeaPlan() {
  const [generatingPlanId, setGeneratingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<{ [key: string]: IdeaPlan }>({});
  const [tokensUsed, setTokensUsed] = useState<number>(0);

  const generatePlan = useCallback(async (idea: Idea): Promise<string | null> => {
    if (!idea.id) {
      console.error('아이디어 ID가 필요합니다.');
      setError('아이디어 ID가 필요합니다.');
      return null;
    }

    // 필수 속성들이 없으면 기본값으로 채움
    const processedIdea = {
      ...idea,
      summary: idea.summary || idea.title,
      coretech: idea.coretech || ['웹개발'],
      target: idea.target || '일반 사용자'
    };

    setGeneratingPlanId(idea.id);
    setError(null);
    
    try {
      const response = await fetch(`/api/ideas/${idea.id}/plan`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ idea: processedIdea })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '기획서 생성에 실패했습니다.');
      }
      
      // 생성된 기획서를 상태에 저장
      setPlans(prev => ({
        ...prev,
        [idea.id!]: {
          ...result.plan,
          id: result.planId // planId를 IdeaPlan의 id로 설정
        }
      }));
      
      setTokensUsed(prev => prev + (result.tokensUsed || 0));
      
      console.log(`[SUCCESS] ${idea.title} 기획서 생성 완료`);
      return result.planId;
      
    } catch (fetchError) {
      console.error('기획서 생성 실패:', fetchError);
      const errorMessage = fetchError instanceof Error ? fetchError.message : '기획서 생성 중 오류가 발생했습니다.';
      setError(errorMessage);
      return null;
    } finally {
      setGeneratingPlanId(null);
    }
  }, []);

  const getPlan = useCallback((ideaId: string): IdeaPlan | null => {
    return plans[ideaId] || null;
  }, [plans]);

  const hasPlan = useCallback((ideaId: string): boolean => {
    return !!plans[ideaId];
  }, [plans]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearPlans = useCallback(() => {
    setPlans({});
    setTokensUsed(0);
  }, []);

  return {
    generatingPlanId,
    error,
    plans,
    tokensUsed,
    generatePlan,
    getPlan,
    hasPlan,
    clearError,
    clearPlans,
    isGenerating: (ideaId: string) => generatingPlanId === ideaId
  };
}