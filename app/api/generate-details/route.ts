import { NextRequest, NextResponse } from 'next/server';
import { generateDetails } from '@/app/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { idea } = await request.json();

    if (!idea) {
      return NextResponse.json(
        { error: '아이디어 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    const details = await generateDetails(idea);
    
    return NextResponse.json(details);
  } catch (error) {
    console.error('Error generating details:', error);
    return NextResponse.json(
      { error: '상세 정보 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}