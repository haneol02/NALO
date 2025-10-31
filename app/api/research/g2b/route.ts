import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { topic, apiKey, limit = 10 } = await req.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { success: false, error: '검색할 주제를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: '나라장터 API 키가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`나라장터 검색 시작: ${topic}`);

    // 나라장터 입찰공고 목록 조회 API
    const searchUrl = 'http://apis.data.go.kr/1230000/BidPublicInfoService04/getBidPblancListInfoThng';

    // API 키 디코딩 (URL 인코딩된 키를 디코딩)
    const decodedApiKey = decodeURIComponent(apiKey);

    const searchParams = new URLSearchParams({
      serviceKey: decodedApiKey,
      numOfRows: limit.toString(),
      pageNo: '1',
      bidNtceNm: topic, // 입찰공고명
      type: 'json'
    });

    const response = await fetch(`${searchUrl}?${searchParams}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    const responseText = await response.text();
    console.log('나라장터 API 응답 상태:', response.status);
    console.log('나라장터 API 응답 (처음 500자):', responseText.substring(0, 500));

    if (!response.ok) {
      console.error('나라장터 API 에러 응답:', responseText);
      // API 키 오류나 기타 오류가 있어도 빈 결과 반환
      return NextResponse.json({
        success: true,
        data: {
          topic,
          found: false,
          bids: [],
          totalCount: 0,
          error: `API 호출 실패: ${response.status}`
        }
      });
    }

    const data = JSON.parse(responseText);

    // API 에러 응답 확인 (공공데이터포털은 200을 반환하더라도 에러 메시지가 있을 수 있음)
    if (data?.response?.header?.resultCode !== '00') {
      const errorMsg = data?.response?.header?.resultMsg || '알 수 없는 오류';
      console.error('나라장터 API 에러 코드:', data?.response?.header?.resultCode, errorMsg);
      return NextResponse.json({
        success: true,
        data: {
          topic,
          found: false,
          bids: [],
          totalCount: 0,
          error: errorMsg
        }
      });
    }

    // API 응답 구조 확인
    const items = data?.response?.body?.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          topic,
          found: false,
          bids: [],
          totalCount: 0,
        }
      });
    }

    // 입찰공고 데이터 정리
    const bids = items.map((item: any) => ({
      bidNtceNo: item.bidNtceNo, // 입찰공고번호
      bidNtceOrd: item.bidNtceOrd, // 입찰공고차수
      bidNtceNm: item.bidNtceNm, // 입찰공고명
      bidNtceDt: item.bidNtceDt, // 입찰공고일시
      bidClseDt: item.bidClseDt, // 입찰마감일시
      opengDt: item.opengDt, // 개찰일시
      dminsttNm: item.dminsttNm, // 수요기관명
      prearngPrceDcsnMthdNm: item.prearngPrceDcsnMthdNm, // 예정가격결정방법명
      asignBdgtAmt: item.asignBdgtAmt, // 배정예산금액
      presmptPrce: item.presmptPrce, // 추정가격
      bidMethdNm: item.bidMethdNm, // 입찰방법명
      cntrctCnclsMthdNm: item.cntrctCnclsMthdNm, // 계약체결방법명
      ntceKindNm: item.ntceKindNm, // 공고종류명
      bidNtceUrl: `http://www.g2b.go.kr:8081/ep/invitation/publish/bidPublishView.do?bidno=${item.bidNtceNo}&bidseq=${item.bidNtceOrd}`, // 입찰공고 URL
    }));

    // 통계 분석
    const totalBudget = bids.reduce((sum: number, bid: any) => {
      const budget = parseInt(bid.asignBdgtAmt) || parseInt(bid.presmptPrce) || 0;
      return sum + budget;
    }, 0);

    const avgBudget = bids.length > 0 ? Math.floor(totalBudget / bids.length) : 0;

    // 수요기관 분류
    const agencies = bids.reduce((acc: any, bid: any) => {
      const agency = bid.dminsttNm || '미지정';
      acc[agency] = (acc[agency] || 0) + 1;
      return acc;
    }, {});

    const topAgencies = Object.entries(agencies)
      .map(([name, count]) => ({ name, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);

    console.log(`나라장터 검색 완료: ${bids.length}개 입찰공고 발견`);

    return NextResponse.json({
      success: true,
      data: {
        topic,
        found: true,
        bids,
        totalCount: data?.response?.body?.totalCount || bids.length,
        statistics: {
          totalBudget,
          avgBudget,
          bidCount: bids.length,
          topAgencies,
        },
        source: 'G2B'
      }
    });

  } catch (error) {
    console.error('나라장터 API 에러:', error);

    return NextResponse.json(
      {
        success: false,
        error: '나라장터 검색 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
