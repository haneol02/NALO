import { NextRequest, NextResponse } from 'next/server';
import { generateIdeaPlan } from '@/app/lib/openai';
import { dbHelpers } from '@/app/lib/supabase';
import { createClient } from '@/app/lib/supabase/server';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { idea, apiKey } = await request.json();

    if (!idea) {
      return NextResponse.json(
        {
          success: false,
          error: '아이디어 정보가 필요합니다.',
        },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'API 키가 필요합니다.',
        },
        { status: 401 }
      );
    }

    // 사용자 인증 확인
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    console.log(`=== 선택된 아이디어 기획서 생성: ${idea.title} ===`);
    console.log('아이디어 ID:', params.id);
    console.log('아이디어 내용:', idea);
    console.log('리서치 데이터 포함:', !!idea.researchData);
    console.log('=======================================');

    // 선택된 아이디어에 대해서만 기획서 생성 (리서치 데이터 포함)
    const planResult = await generateIdeaPlan(idea, apiKey, idea.researchData);
    
    if (!planResult.ideaPlan) {
      throw new Error('기획서 생성에 실패했습니다.');
    }
    
    // 현재 날짜 및 시간 생성 (서울 시간대, YYYY.MM.DD HH:MM 형식)
    const now = new Date();
    const currentDate = now.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      timeZone: 'Asia/Seoul'
    }).replace(/\//g, '.') + ' ' + now.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Seoul'
    });

    // DB에 기획서 저장 - 모든 필드 포함, 더미 데이터 대신 빈 값 처리
    const planData = {
      // 기본 정보
      project_name: planResult.ideaPlan.project_name || null,
      service_summary: planResult.ideaPlan.service_summary || null,
      created_date: currentDate, // 서버에서 현재 날짜 직접 설정
      project_type: planResult.ideaPlan.project_type || null,
      core_idea: planResult.ideaPlan.core_idea || null,
      background: planResult.ideaPlan.background || null,
      target_customer: planResult.ideaPlan.target_customer || null,
      problem_to_solve: planResult.ideaPlan.problem_to_solve || null,
      proposed_solution: planResult.ideaPlan.proposed_solution || null,
      
      // 프로젝트 목표 - 배열을 불릿 포인트 문자열로 변환
      main_objectives: Array.isArray(planResult.ideaPlan.main_objectives) 
        ? '• ' + planResult.ideaPlan.main_objectives.join('\n• ')
        : planResult.ideaPlan.main_objectives || null,
      success_metrics: Array.isArray(planResult.ideaPlan.success_metrics) 
        ? '• ' + planResult.ideaPlan.success_metrics.join('\n• ')
        : planResult.ideaPlan.success_metrics || null,
      
      // 프로젝트 범위
      project_scope_include: planResult.ideaPlan.project_scope_include || null,
      project_scope_exclude: planResult.ideaPlan.project_scope_exclude || null,
      
      // 기능 및 단계 - 배열을 불릿 포인트 문자열로 변환
      features: Array.isArray(planResult.ideaPlan.features) 
        ? '• ' + planResult.ideaPlan.features.join('\n• ')
        : planResult.ideaPlan.features || null,
      key_features: Array.isArray(planResult.ideaPlan.key_features) 
        ? '• ' + planResult.ideaPlan.key_features.join('\n• ')
        : planResult.ideaPlan.key_features || null,
      project_phases: Array.isArray(planResult.ideaPlan.project_phases) ? planResult.ideaPlan.project_phases : null,
      
      // 실현 가능성 분석
      difficulty: planResult.ideaPlan.difficulty !== undefined ? Number(planResult.ideaPlan.difficulty) : null,
      market_potential: planResult.ideaPlan.market_potential !== undefined ? Number(planResult.ideaPlan.market_potential) : null,
      competition: planResult.ideaPlan.competition !== undefined ? Number(planResult.ideaPlan.competition) : null,
      challenges: Array.isArray(planResult.ideaPlan.challenges) 
        ? '• ' + planResult.ideaPlan.challenges.join('\n• ')
        : planResult.ideaPlan.challenges || null,
      success_factors: Array.isArray(planResult.ideaPlan.success_factors) 
        ? '• ' + planResult.ideaPlan.success_factors.join('\n• ')
        : planResult.ideaPlan.success_factors || null,
      
      // 시장 분석
      market_analysis: planResult.ideaPlan.market_analysis || null,
      competitors: Array.isArray(planResult.ideaPlan.competitors) 
        ? '• ' + planResult.ideaPlan.competitors.join('\n• ')
        : planResult.ideaPlan.competitors || null,
      differentiation: planResult.ideaPlan.differentiation || null,
      
      // SWOT 분석
      swot_strengths: planResult.ideaPlan.swot_strengths || null,
      swot_weaknesses: planResult.ideaPlan.swot_weaknesses || null,
      swot_opportunities: planResult.ideaPlan.swot_opportunities || null,
      swot_threats: planResult.ideaPlan.swot_threats || null,
      
      // 기술적 요구사항
      tech_stack: planResult.ideaPlan.tech_stack || null,
      system_architecture: planResult.ideaPlan.system_architecture || null,
      database_type: planResult.ideaPlan.database_type || null,
      development_environment: planResult.ideaPlan.development_environment || null,
      security_requirements: planResult.ideaPlan.security_requirements || null,
      
      // 기대효과 및 성과
      expected_effects: planResult.ideaPlan.expected_effects || null,
      business_impact: planResult.ideaPlan.business_impact || null,
      social_value: planResult.ideaPlan.social_value || null,
      roi_prediction: planResult.ideaPlan.roi_prediction || null,
      
      // 위험관리 - 배열을 불릿 포인트 문자열로 변환
      risk_factors: Array.isArray(planResult.ideaPlan.risk_factors) 
        ? '• ' + planResult.ideaPlan.risk_factors.join('\n• ')
        : planResult.ideaPlan.risk_factors || null,
      risk_response: Array.isArray(planResult.ideaPlan.risk_response) 
        ? '• ' + planResult.ideaPlan.risk_response.join('\n• ')
        : planResult.ideaPlan.risk_response || null,
      contingency_plan: Array.isArray(planResult.ideaPlan.contingency_plan) 
        ? '• ' + planResult.ideaPlan.contingency_plan.join('\n• ')
        : planResult.ideaPlan.contingency_plan || null,
      
      // 비용
      development_cost: planResult.ideaPlan.development_cost !== undefined ? Number(planResult.ideaPlan.development_cost) : 0,
      operation_cost: planResult.ideaPlan.operation_cost !== undefined ? Number(planResult.ideaPlan.operation_cost) : 0,
      marketing_cost: planResult.ideaPlan.marketing_cost !== undefined ? Number(planResult.ideaPlan.marketing_cost) : 0,
      other_cost: planResult.ideaPlan.other_cost !== undefined ? Number(planResult.ideaPlan.other_cost) : 0,
      
      // 연결 정보
      idea_id: params.id, // 아이디어 ID 연결
      input_keywords: planResult.keywords && planResult.keywords.length > 0 ? planResult.keywords : (idea.keywords || idea.input_keywords || null),
      search_query: idea.searchQuery || idea.search_query || null,
      user_id: user?.id || null, // 사용자 ID 연결
      author_email: user?.email || null // 작성자 이메일
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