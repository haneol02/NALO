import { NextRequest, NextResponse } from 'next/server';
import { generateIdeaPlan } from '@/app/lib/openai';
import { dbHelpers } from '@/app/lib/supabase';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { idea } = await request.json();
    
    if (!idea) {
      return NextResponse.json(
        {
          success: false,
          error: '아이디어 정보가 필요합니다.',
        },
        { status: 400 }
      );
    }

    console.log(`=== 선택된 아이디어 기획서 생성: ${idea.title} ===`);
    console.log('아이디어 ID:', params.id);
    console.log('아이디어 내용:', idea);
    console.log('=======================================');
    
    // 선택된 아이디어에 대해서만 기획서 생성
    const planResult = await generateIdeaPlan(idea);
    
    if (!planResult.ideaPlan) {
      throw new Error('기획서 생성에 실패했습니다.');
    }
    
    // DB에 기획서 저장 - 단순화된 구조에 맞게 데이터 준비
    const planData = {
      project_name: planResult.ideaPlan.project_name,
      service_summary: planResult.ideaPlan.service_summary || idea.summary,
      created_date: planResult.ideaPlan.created_date || new Date().toISOString().split('T')[0],
      project_type: planResult.ideaPlan.project_type || '웹서비스',
      core_idea: planResult.ideaPlan.core_idea,
      background: planResult.ideaPlan.background,
      target_customer: planResult.ideaPlan.target_customer,
      problem_to_solve: planResult.ideaPlan.problem_to_solve,
      proposed_solution: planResult.ideaPlan.proposed_solution,
      features: Array.isArray(planResult.ideaPlan.features) ? planResult.ideaPlan.features : ['기본 기능'],
      development_cost: Number(planResult.ideaPlan.development_cost) || 0,
      operation_cost: Number(planResult.ideaPlan.operation_cost) || 0,
      marketing_cost: Number(planResult.ideaPlan.marketing_cost) || 0,
      other_cost: Number(planResult.ideaPlan.other_cost) || 0,
      idea_id: params.id // 아이디어 ID 연결
    };
    
    const savedPlan = await dbHelpers.saveIdeaPlan(planData);
    console.log(`[SUCCESS] ${idea.title} 기획서 저장 완료: ${savedPlan.id}`);
    
    return NextResponse.json({
      success: true,
      planId: savedPlan.id,
      plan: planResult.ideaPlan,
      tokensUsed: planResult.tokensUsed
    });

  } catch (error) {
    console.error('Idea Plan API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      {
        success: false,
        error: '기획서 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}