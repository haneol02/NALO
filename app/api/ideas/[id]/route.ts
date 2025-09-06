import { NextRequest, NextResponse } from 'next/server';
import { dbHelpers } from '@/app/lib/supabase';
import { createClient } from '@/app/lib/supabase/server';

// 특정 기획서 삭제
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    // 사용자 인증 확인
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: '로그인이 필요합니다.',
        },
        { status: 401 }
      );
    }

    console.log(`=== 기획서 삭제 요청: ${id} ===`);
    console.log('요청자 ID:', user.id);

    // 먼저 해당 기획서가 존재하는지 확인하고 소유자 검증
    const existingPlan = await dbHelpers.getIdeaPlan(id);
    
    if (!existingPlan) {
      return NextResponse.json(
        {
          success: false,
          error: '기획서를 찾을 수 없습니다.',
        },
        { status: 404 }
      );
    }

    // 본인이 작성한 기획서인지 확인
    if (existingPlan.user_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: '본인이 작성한 기획서만 삭제할 수 있습니다.',
        },
        { status: 403 }
      );
    }

    // 기획서 삭제
    const result = await dbHelpers.deleteIdeaPlan(id);
    
    console.log(`[SUCCESS] 기획서 삭제 완료: ${id}`);

    return NextResponse.json({
      success: true,
      message: '기획서가 성공적으로 삭제되었습니다.',
    });

  } catch (error) {
    console.error('기획서 삭제 API 오류:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      {
        success: false,
        error: '기획서 삭제 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}