export type Cafe = {
  id: string;
  name: string;
  area: string;
  region: string;
  description: string;
  searchQuery: string;
  sourceUrl?: string;
  imageUrl?: string;
  tags?: string[];
  // 해외 카페 등 카카오 검색이 안 되는 곳: 위경도 직접 지정 (있으면 검색 대신 사용)
  coords?: { lat: number; lng: number };
  // 등록일 (YYYY-MM-DD). 있으면 이 날짜 기준 7일간 "NEW" 뱃지/필터에 노출
  addedAt?: string;
  // 영업시간 (선택). text는 카드·상세 페이지에 그대로 표시,
  // schedule은 "지금 영업중" 판정용 — days: 0(일)~6(토), open/close: "HH:MM" (KST)
  hours?: {
    text: string;
    schedule?: { days: number[]; open: string; close: string }[];
  };
  // 대표(추천) 메뉴 — @green_sori 게시물 캡션에서 발췌
  menu?: string;
  // 해당 인스타 게시물 댓글 반응 요약 (50자 내외)
  commentSummary?: string;
};
