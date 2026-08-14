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
};
