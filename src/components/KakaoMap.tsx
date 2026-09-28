"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Cafe } from "@/types/cafe";
import { isOpenNow, hasSchedule } from "@/lib/hours";

const SEOUL_CENTER = { lat: 37.5665, lng: 126.978 };
const ALL_REGION = "전체";
const OVERSEAS_REGION = "해외";
// 앱 초기 상태는 지역 필터 없이 전국(전체)
const DEFAULT_REGION = ALL_REGION;
// "NEW" 뱃지/필터 노출 기간 (일)
const NEW_WINDOW_DAYS = 7;

// 지역 필터 판정: '전체'는 해외를 제외한 국내만, 그 외엔 해당 지역만
function regionMatch(cafeRegion: string, selected: string) {
  return selected === ALL_REGION
    ? cafeRegion !== OVERSEAS_REGION
    : cafeRegion === selected;
}

// addedAt(YYYY-MM-DD) 기준으로 NEW_WINDOW_DAYS 이내인지 판정
function isNewCafe(addedAt: string | undefined, now: number) {
  if (!addedAt) return false;
  const added = new Date(`${addedAt}T00:00:00`).getTime();
  if (Number.isNaN(added)) return false;
  const diffDays = (now - added) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays < NEW_WINDOW_DAYS;
}

// 인스타 쇼트코드는 시간순으로 증가하는 미디어 ID를 base64로 인코딩한 값이라
// 게시 순서 비교에 쓸 수 있다 (같은 길이면 알파벳 인덱스 사전순, 길면 더 최신).
const IG_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
function igShortcode(sourceUrl: string | undefined): string {
  const m = sourceUrl?.match(/\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : "";
}
// 최신 게시물이 앞에 오도록 하는 비교 함수 (내림차순). 쇼트코드가 없으면 0
function comparePostRecency(a: Cafe, b: Cafe): number {
  const sa = igShortcode(a.sourceUrl);
  const sb = igShortcode(b.sourceUrl);
  if (!sa || !sb) return 0;
  if (sa.length !== sb.length) return sb.length - sa.length;
  for (let i = 0; i < sa.length; i++) {
    const d = IG_ALPHABET.indexOf(sb[i]) - IG_ALPHABET.indexOf(sa[i]);
    if (d !== 0) return d;
  }
  return 0;
}

const FAV_KEY = "greensori-fav-v1";
const VISITED_KEY = "greensori-visited-v1";

// 테마별 시그니처 색 — 커피·크림 팔레트와 어울리는 뮤트 톤
const TAG_ACCENT: Record<string, string> = {
  "로스터리·드립": "#8b5e3c",
  "디저트·빵": "#c07a88",
  "감성·인테리어": "#9b7aa3",
  "뷰·자연": "#7d9155",
  "한옥·레트로": "#c06b45",
  "동네·아지트": "#c99a4e",
  "LP·음악": "#63719a",
  "책·소품": "#5a9089",
};
const DEFAULT_ACCENT = "#8a7458";

// 마커 클러스터 스타일 (개수에 따라 3단계)
const CLUSTER_STYLES = [
  {
    width: "34px",
    height: "34px",
    background: "rgba(111,78,55,0.88)",
    borderRadius: "17px",
    color: "#fff",
    textAlign: "center",
    lineHeight: "34px",
    fontSize: "12px",
    fontWeight: "700",
    border: "2px solid rgba(255,255,255,0.65)",
    boxShadow: "0 2px 6px rgba(80,55,35,0.35)",
  },
  {
    width: "42px",
    height: "42px",
    background: "rgba(150,95,55,0.9)",
    borderRadius: "21px",
    color: "#fff",
    textAlign: "center",
    lineHeight: "42px",
    fontSize: "13px",
    fontWeight: "700",
    border: "2px solid rgba(255,255,255,0.7)",
    boxShadow: "0 2px 8px rgba(80,55,35,0.4)",
  },
  {
    width: "52px",
    height: "52px",
    background: "rgba(175,110,60,0.92)",
    borderRadius: "26px",
    color: "#fff",
    textAlign: "center",
    lineHeight: "52px",
    fontSize: "14px",
    fontWeight: "700",
    border: "3px solid rgba(255,255,255,0.75)",
    boxShadow: "0 3px 10px rgba(80,55,35,0.45)",
  },
];

type Props = {
  cafes: Cafe[];
};

type MarkerEntry = {
  marker: any;
  cafe: Cafe;
  infoWindow: any;
  position: any;
};

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loadSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const arr = JSON.parse(localStorage.getItem(key) ?? "[]");
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveSet(key: string, set: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    /* storage unavailable */
  }
}

// 두 좌표 간 거리(km) — 하버사인
function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// 중심 좌표에서 반경(km)만큼 떨어진 위경도 오프셋 — 지도 bounds 계산용
function offsetLatLngByKm(lat: number, lng: number, km: number) {
  const dLat = km / 111; // 위도 1도 ≈ 111km
  const dLng = km / (111 * Math.cos((lat * Math.PI) / 180) || 1);
  return { dLat, dLng };
}

function formatDist(km: number) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

// 정보창(raw HTML)용 이미지 최적화 URL — 같은 출처 이미지는 Next 이미지 옵티마이저를 거쳐
// WebP·적정 크기로 내려받게 함 (목록 카드는 <Image>가 자동 처리)
function optImg(url: string, w = 640) {
  if (!url.startsWith("/")) return url;
  // q는 Next 16 기본 허용값(75)만 사용, w는 기본 deviceSizes 목록의 값이어야 함
  return `/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=75`;
}

export default function KakaoMap({ cafes }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const mapInstanceRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const markersRef = useRef<MarkerEntry[]>([]);
  const markerByIdRef = useRef<Map<string, MarkerEntry>>(new Map());
  const posByIdRef = useRef<Map<string, { y: string; x: string }>>(new Map());
  const openIWRef = useRef<any>(null); // 현재 열려 있는 정보창 (한 번에 하나만)

  const [error, setError] = useState<string | null>(null);
  const [markersReady, setMarkersReady] = useState(false);
  const [locatedCafes, setLocatedCafes] = useState<Cafe[]>([]);

  const [region, setRegion] = useState(DEFAULT_REGION);
  const [tag, setTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [newOnly, setNewOnly] = useState(false);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  // "지금 영업중" 판정을 1분마다 갱신 (자정·마감 시각을 넘길 때 자동 반영)
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [cafeOfTheDayOpen, setCafeOfTheDayOpen] = useState(false);
  const [view, setView] = useState<"map" | "list">("map");

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [visited, setVisited] = useState<Set<string>>(new Set());

  const [filtersOpen, setFiltersOpen] = useState(true);
  const [listLimit, setListLimit] = useState(24);
  const [sortBy, setSortBy] = useState<
    "default" | "name" | "region" | "favorite" | "unvisited" | "distance"
  >("default");

  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoAccuracyWarning, setGeoAccuracyWarning] = useState(false);
  const userOverlayRef = useRef<any>(null);
  const [showTop, setShowTop] = useState(false);

  const matchesRef = useRef<(cafe: Cafe) => boolean>(() => true);

  // 인스타 등 외부 링크를 같은 탭에서 열고 뒤로가기로 돌아왔을 때 화면을 그대로 복원하기 위해
  // 보기 모드·필터·정렬·스크롤 위치를 sessionStorage에 저장한다 (탭 단위, 브라우저 종료 시 삭제).
  const UI_STATE_KEY = "greensori-ui-v1";
  const [uiRestored, setUiRestored] = useState(false);
  const restoreScrollRef = useRef<number | null>(null);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(UI_STATE_KEY);
      if (raw) {
        const st = JSON.parse(raw);
        if (st.view === "map" || st.view === "list") setView(st.view);
        if (typeof st.region === "string") setRegion(st.region);
        if (typeof st.tag === "string" || st.tag === null) setTag(st.tag);
        if (typeof st.search === "string") setSearch(st.search);
        if (typeof st.favoriteOnly === "boolean") setFavoriteOnly(st.favoriteOnly);
        if (typeof st.newOnly === "boolean") setNewOnly(st.newOnly);
        if (typeof st.openNowOnly === "boolean") setOpenNowOnly(st.openNowOnly);
        if (typeof st.sortBy === "string") setSortBy(st.sortBy);
        if (typeof st.filtersOpen === "boolean") setFiltersOpen(st.filtersOpen);
        if (typeof st.listLimit === "number") setListLimit(st.listLimit);
        if (typeof st.scrollY === "number") restoreScrollRef.current = st.scrollY;
      }
    } catch {
      /* 저장소 사용 불가 시 무시 */
    }
    setUiRestored(true);
  }, []);
  useEffect(() => {
    if (!uiRestored) return;
    const save = () => {
      try {
        sessionStorage.setItem(
          UI_STATE_KEY,
          JSON.stringify({
            view, region, tag, search, favoriteOnly, newOnly, openNowOnly,
            sortBy, filtersOpen, listLimit, scrollY: window.scrollY,
          })
        );
      } catch {
        /* ignore */
      }
    };
    save();
    // 스크롤 위치는 페이지를 떠나기 직전 값이 필요하므로 pagehide에서 한 번 더 저장
    window.addEventListener("pagehide", save);
    return () => window.removeEventListener("pagehide", save);
  }, [uiRestored, view, region, tag, search, favoriteOnly, newOnly, openNowOnly, sortBy, filtersOpen, listLimit]);
  // 카페 목록이 준비된 뒤 저장해 둔 스크롤 위치로 이동 (한 번만)
  useEffect(() => {
    if (!markersReady || restoreScrollRef.current === null) return;
    const y = restoreScrollRef.current;
    restoreScrollRef.current = null;
    requestAnimationFrame(() => window.scrollTo({ top: y }));
  }, [markersReady, view]);
  // 정보창(HTML)에서 최신 즐겨찾기 상태를 읽기 위한 ref
  const favoritesRef = useRef<Set<string>>(favorites);
  favoritesRef.current = favorites;
  const toggleFavoriteRef = useRef<(id: string) => void>(() => {});
  const hydrateFavRef = useRef<(id: string) => void>(() => {});
  // 지도 이벤트 리스너(마운트 시 1회 등록)에서 최신 "오늘의 카페" id를 읽기 위한 ref
  const cafeOfTheDayIdRef = useRef<string | null>(null);

  // 모바일에선 필터를 기본 접힘으로 (지도/목록이 첫 화면에 바로 보이도록)
  useEffect(() => {
    if (window.innerWidth < 640) setFiltersOpen(false);
  }, []);

  // 필터·정렬이 바뀌면 목록 표시 개수 초기화
  useEffect(() => {
    setListLimit(24);
  }, [region, tag, search, favoriteOnly, newOnly, openNowOnly, sortBy, view]);

  // "지금 영업중" 필터가 켜져 있는 동안 1분마다 재판정
  useEffect(() => {
    if (!openNowOnly) return;
    const t = setInterval(() => setNowTick(Date.now()), 60_000);
    return () => clearInterval(t);
  }, [openNowOnly]);

  // '맨 위로' 버튼: 목록에서 어느 정도 스크롤하면 표시
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 700);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 즐겨찾기·방문 기록 로드 (마운트 시 1회)
  useEffect(() => {
    setFavorites(loadSet(FAV_KEY));
    setVisited(loadSet(VISITED_KEY));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveSet(FAV_KEY, next);
      return next;
    });
  }, []);
  toggleFavoriteRef.current = toggleFavorite;

  const toggleVisited = useCallback((id: string) => {
    setVisited((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveSet(VISITED_KEY, next);
      return next;
    });
  }, []);

  // 즐겨찾기·방문 기록 백업/복원 — 기록이 브라우저에만 저장되므로
  // 기기 변경·앱 재설치 대비용 JSON 내보내기/불러오기
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const exportRecords = useCallback(() => {
    const payload = {
      app: "greensori-map",
      version: 1,
      exportedAt: new Date().toISOString(),
      favorites: [...favorites],
      visited: [...visited],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `greensori-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [favorites, visited]);

  const importRecords = useCallback(
    async (file: File) => {
      try {
        const data = JSON.parse(await file.text());
        const validIds = new Set(cafes.map((c) => c.id));
        const clean = (arr: unknown) =>
          Array.isArray(arr)
            ? arr.filter(
                (x): x is string => typeof x === "string" && validIds.has(x)
              )
            : [];
        const favIn = clean(data?.favorites);
        const visIn = clean(data?.visited);
        if (favIn.length === 0 && visIn.length === 0) {
          setImportMsg("가져올 기록이 없어요. 백업 파일이 맞는지 확인해 주세요.");
          return;
        }
        // 기존 기록과 합집합으로 병합 — 불러오기가 기존 기록을 지우지 않음
        const nextFav = new Set([...favorites, ...favIn]);
        const nextVis = new Set([...visited, ...visIn]);
        const added =
          nextFav.size - favorites.size + (nextVis.size - visited.size);
        setFavorites(nextFav);
        saveSet(FAV_KEY, nextFav);
        setVisited(nextVis);
        saveSet(VISITED_KEY, nextVis);
        setImportMsg(
          added > 0
            ? `기록 ${added}개를 불러왔어요.`
            : "모두 이미 있는 기록이에요."
        );
      } catch {
        setImportMsg("파일을 읽지 못했어요. 백업 JSON 파일인지 확인해 주세요.");
      }
    },
    [cafes, favorites, visited]
  );

  // 복원 결과 안내는 5초 뒤 자동으로 지움
  useEffect(() => {
    if (!importMsg) return;
    const t = setTimeout(() => setImportMsg(null), 5000);
    return () => clearTimeout(t);
  }, [importMsg]);

  // 검색어 매칭: 이름·동네·설명 + 지역명 + 테마 태그까지 포함
  const searchMatches = (cafe: Cafe, q: string) => {
    if (!q) return true;
    return (
      cafe.name.includes(q) ||
      cafe.area.includes(q) ||
      cafe.region.includes(q) ||
      cafe.description.includes(q) ||
      (cafe.tags ?? []).some((t) => t.includes(q))
    );
  };

  const matches = (cafe: Cafe) => {
    if (!regionMatch(cafe.region, region)) return false;
    if (tag && !(cafe.tags ?? []).includes(tag)) return false;
    if (favoriteOnly && !favorites.has(cafe.id)) return false;
    if (newOnly && !isNewCafe(cafe.addedAt, Date.now())) return false;
    if (openNowOnly && isOpenNow(cafe) !== true) return false;
    if (!searchMatches(cafe, search.trim())) return false;
    return true;
  };
  matchesRef.current = matches;

  const tags = useMemo(() => {
    // 전체 데이터 기준 태그 순서를 고정해 지역 전환 시 칩 순서가 튀지 않게 함
    const order: string[] = [];
    cafes.forEach((cafe) => {
      (cafe.tags ?? []).forEach((t) => {
        if (!order.includes(t)) order.push(t);
      });
    });
    // 카운트는 현재 선택된 지역 기준으로 집계
    const counts = new Map<string, number>();
    cafes.forEach((cafe) => {
      if (!regionMatch(cafe.region, region)) return;
      (cafe.tags ?? []).forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));
    });
    return order
      .map((name) => ({ name, count: counts.get(name) ?? 0 }))
      .filter((t) => t.count > 0);
  }, [cafes, region]);

  const regions = useMemo(() => {
    const counts = new Map<string, number>();
    cafes.forEach((cafe) => {
      counts.set(cafe.region, (counts.get(cafe.region) ?? 0) + 1);
    });
    // 카페 수 많은 순으로 정렬 (동수는 가나다순) — 작은 지역이 끝에 모여 줄바꿈이 자연스러움
    const unique = Array.from(counts.keys()).sort((a, b) => {
      const diff = (counts.get(b) ?? 0) - (counts.get(a) ?? 0);
      return diff !== 0 ? diff : a.localeCompare(b, "ko");
    });
    // 국내 지역(해외 제외)을 앞에, 해외 버튼은 항상 맨 뒤로
    const domestic = unique.filter((r) => r !== OVERSEAS_REGION);
    const overseasCount = counts.get(OVERSEAS_REGION) ?? 0;
    return [
      { name: ALL_REGION, count: cafes.length - overseasCount },
      ...domestic.map((name) => ({ name, count: counts.get(name) ?? 0 })),
      ...(overseasCount > 0
        ? [{ name: OVERSEAS_REGION, count: overseasCount }]
        : []),
    ];
  }, [cafes]);

  // 내 위치 → 각 카페까지 거리(km)
  const distanceById = useMemo(() => {
    const m = new Map<string, number>();
    if (!userLoc) return m;
    locatedCafes.forEach((cafe) => {
      const p = posByIdRef.current.get(cafe.id);
      if (p) {
        m.set(
          cafe.id,
          haversineKm(userLoc.lat, userLoc.lng, parseFloat(p.y), parseFloat(p.x))
        );
      }
    });
    return m;
  }, [userLoc, locatedCafes]);

  // 데이터 파일(cafes.ts) 상의 순서 — 지오코딩 완료 순서에 좌우되지 않는 기본 정렬용
  const indexById = useMemo(
    () => new Map(cafes.map((c, i) => [c.id, i] as const)),
    [cafes]
  );

  // 현재 필터에 맞는, 좌표를 찾은 카페 목록 (목록 뷰 + 개수 표시용)
  const visibleCafes = useMemo(() => {
    const q = search.trim();
    const filtered = locatedCafes.filter((cafe) => {
      if (!regionMatch(cafe.region, region)) return false;
      if (tag && !(cafe.tags ?? []).includes(tag)) return false;
      if (favoriteOnly && !favorites.has(cafe.id)) return false;
      if (newOnly && !isNewCafe(cafe.addedAt, Date.now())) return false;
      if (openNowOnly && isOpenNow(cafe, new Date(nowTick)) !== true) return false;
      return searchMatches(cafe, q);
    });
    if (sortBy === "default") {
      // NEW 카페를 맨 앞으로. NEW끼리는 인스타 최신 게시물 순
      // (쇼트코드 → addedAt 최신순 → 데이터 뒤쪽 우선), 나머지는 데이터 파일 순서 유지
      const now = Date.now();
      return [...filtered].sort((a, b) => {
        const an = isNewCafe(a.addedAt, now);
        const bn = isNewCafe(b.addedAt, now);
        if (an !== bn) return Number(bn) - Number(an);
        if (an) {
          return (
            comparePostRecency(a, b) ||
            (b.addedAt ?? "").localeCompare(a.addedAt ?? "") ||
            (indexById.get(b.id) ?? 0) - (indexById.get(a.id) ?? 0)
          );
        }
        return (indexById.get(a.id) ?? 0) - (indexById.get(b.id) ?? 0);
      });
    }
    const arr = [...filtered];
    if (sortBy === "name") {
      arr.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    } else if (sortBy === "region") {
      arr.sort(
        (a, b) =>
          a.region.localeCompare(b.region, "ko") ||
          a.name.localeCompare(b.name, "ko")
      );
    } else if (sortBy === "favorite") {
      arr.sort(
        (a, b) => Number(favorites.has(b.id)) - Number(favorites.has(a.id))
      );
    } else if (sortBy === "unvisited") {
      arr.sort((a, b) => Number(visited.has(a.id)) - Number(visited.has(b.id)));
    } else if (sortBy === "distance") {
      arr.sort(
        (a, b) =>
          (distanceById.get(a.id) ?? Infinity) -
          (distanceById.get(b.id) ?? Infinity)
      );
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    locatedCafes,
    region,
    tag,
    search,
    favoriteOnly,
    newOnly,
    openNowOnly,
    nowTick,
    favorites,
    visited,
    sortBy,
    distanceById,
    indexById,
  ]);

  useEffect(() => {
    const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!appKey) {
      setError("NEXT_PUBLIC_KAKAO_MAP_KEY가 .env.local에 설정되어 있지 않습니다.");
      return;
    }

    const initMap = () => {
      if (!mapRef.current || initializedRef.current) return;
      initializedRef.current = true;

      const map = new window.kakao.maps.Map(mapRef.current, {
        center: new window.kakao.maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng),
        level: 7,
      });
      mapInstanceRef.current = map;

      // 마커 클러스터러 (라이브러리 로드 실패 시 개별 마커로 폴백)
      clustererRef.current = window.kakao.maps.MarkerClusterer
        ? new window.kakao.maps.MarkerClusterer({
            map,
            averageCenter: true,
            minLevel: 6,
            disableClickZoom: false,
            styles: CLUSTER_STYLES,
          })
        : null;

      const places = new window.kakao.maps.services.Places();

      // 좌표 캐시: 검색 API 호출량을 줄이고 재방문 시 즉시 표시
      const CACHE_KEY = "greensori-coords-v1";
      const CACHE_TTL = 1000 * 60 * 60 * 24 * 30;
      let cache: Record<string, { y: string; x: string; t: number }> = {};
      try {
        cache = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}");
      } catch {
        cache = {};
      }
      const saveCache = () => {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        } catch {
          /* storage full or unavailable */
        }
      };

      const searchWithRetry = (
        query: string,
        attempt = 0
      ): Promise<{ y: string; x: string } | null> =>
        new Promise((resolve) => {
          places.keywordSearch(query, (results: any[], status: string) => {
            if (status === window.kakao.maps.services.Status.OK && results.length > 0) {
              resolve({ y: results[0].y, x: results[0].x });
            } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
              resolve(null);
            } else if (attempt < 4) {
              // 요청 폭주 시 카카오가 ERROR를 반환하므로 백오프 후 재시도
              setTimeout(() => {
                searchWithRetry(query, attempt + 1).then(resolve);
              }, 400 * (attempt + 1));
            } else {
              resolve(null);
            }
          });
        });

      // 터치 기기 여부 — 주 입력이 호버 불가한 환경(모바일·태블릿)만 true.
      // 마우스가 있는 터치 노트북은 호버가 가능하므로 데스크톱 동작을 유지.
      const isTouch = !window.matchMedia("(hover: hover) and (pointer: fine)")
        .matches;

      // 호버 카드가 마커→카드로 이동하는 동안 닫히지 않도록 (hover intent)
      let closeTimer: ReturnType<typeof setTimeout> | null = null;
      const cancelClose = () => {
        if (closeTimer) {
          clearTimeout(closeTimer);
          closeTimer = null;
        }
      };
      const scheduleClose = (iw: any) => {
        cancelClose();
        closeTimer = setTimeout(() => {
          iw.close();
          if (openIWRef.current === iw) {
            openIWRef.current = null;
            setCafeOfTheDayOpen(false);
          }
        }, 260);
      };
      // 카드가 열릴 때마다 즐겨찾기 하트 상태 반영 + 클릭 핸들러 부착
      const hydrateFavButton = (cafeId: string) => {
        setTimeout(() => {
          const btn = document.querySelector(
            `.gs-fav-btn[data-cafe="${cafeId}"]`
          ) as HTMLElement | null;
          if (!btn) return;
          const icon = btn.querySelector("svg");
          const paint = (fav: boolean) => {
            if (!icon) return;
            icon.setAttribute("fill", fav ? "#ff5a76" : "none");
            icon.setAttribute("stroke", fav ? "#ff5a76" : "#ffffff");
          };
          paint(favoritesRef.current.has(cafeId));
          btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const wasFav = favoritesRef.current.has(cafeId);
            toggleFavoriteRef.current(cafeId);
            paint(!wasFav);
          };
        }, 0);
      };
      hydrateFavRef.current = hydrateFavButton;

      const openCard = (iw: any, marker: any, cafeId: string) => {
        cancelClose();
        if (openIWRef.current && openIWRef.current !== iw) openIWRef.current.close();
        iw.open(map, marker);
        openIWRef.current = iw;
        setCafeOfTheDayOpen(cafeId === cafeOfTheDayIdRef.current);
        hydrateFavButton(cafeId);
        // 렌더 직후 카드 DOM에 마우스 진입/이탈 리스너를 부착해, 카드 위에서는 열린 채 유지
        setTimeout(() => {
          const card = document.querySelector(
            `.gs-info-card[data-cafe="${cafeId}"]`
          ) as HTMLElement | null;
          if (!card) return;
          const nodes = [card, card.parentElement].filter(Boolean) as HTMLElement[];
          nodes.forEach((n) => {
            n.addEventListener("mouseenter", cancelClose);
            n.addEventListener("mouseleave", () => scheduleClose(iw));
          });
        }, 0);
      };

      // 터치 기기: 빈 지도를 탭하면 열린 카드 닫기
      if (isTouch) {
        window.kakao.maps.event.addListener(map, "click", () => {
          if (openIWRef.current) {
            openIWRef.current.close();
            openIWRef.current = null;
            setCafeOfTheDayOpen(false);
          }
        });
      }

      // 테마 색 커피컵 마커 이미지 — 색상별로 캐시
      const pinCache = new Map<string, any>();
      const pinImage = (color: string) => {
        if (pinCache.has(color)) return pinCache.get(color);
        const svg =
          `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='44' viewBox='0 0 40 44'>` +
          `<ellipse cx='20' cy='41.5' rx='11' ry='2.4' fill='rgba(60,40,25,0.20)'/>` +
          `<path d='M15 3.5c0 2-2 2-2 4s2 2 2 4' fill='none' stroke='#ffffff' stroke-width='2' stroke-linecap='round' opacity='0.85'/>` +
          `<path d='M25 3.5c0 2-2 2-2 4s2 2 2 4' fill='none' stroke='#ffffff' stroke-width='2' stroke-linecap='round' opacity='0.85'/>` +
          `<ellipse cx='20' cy='37' rx='14' ry='3.4' fill='${color}' stroke='#ffffff' stroke-width='2.2'/>` +
          `<path d='M29 20c7 0 7 11 0 11' fill='none' stroke='#ffffff' stroke-width='6.5' stroke-linecap='round'/>` +
          `<path d='M29 20c7 0 7 11 0 11' fill='none' stroke='${color}' stroke-width='3.5' stroke-linecap='round'/>` +
          `<path d='M9 16h22l-1.6 16c-.26 2.6-2.45 4.6-5.1 4.6h-8.6c-2.65 0-4.84-2-5.1-4.6z' fill='${color}' stroke='#ffffff' stroke-width='2.4' stroke-linejoin='round'/>` +
          `<ellipse cx='20' cy='16' rx='11' ry='2.8' fill='#ffffff'/>` +
          `</svg>`;
        const src =
          "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
        const img = new window.kakao.maps.MarkerImage(
          src,
          new window.kakao.maps.Size(40, 44),
          { offset: new window.kakao.maps.Point(20, 41) }
        );
        pinCache.set(color, img);
        return img;
      };

      const addMarker = (cafe: Cafe, coord: { y: string; x: string }) => {
        const position = new window.kakao.maps.LatLng(coord.y, coord.x);

        const pinColor =
          TAG_ACCENT[(cafe.tags ?? [])[0]] ?? DEFAULT_ACCENT;
        const marker = new window.kakao.maps.Marker({
          position,
          title: cafe.name,
          image: pinImage(pinColor),
        });

        const imgTag = cafe.imageUrl
          ? `<img src="${escapeHtml(optImg(cafe.imageUrl, 640))}" alt="${escapeHtml(cafe.name)}"
               style="display:block;width:100%;height:120px;object-fit:cover;" />`
          : "";
        // 카드 이미지 클릭/터치 → 인스타그램으로 이동
        const cardImage =
          imgTag && cafe.sourceUrl
            ? `<a href="${escapeHtml(
                cafe.sourceUrl
              )}" rel="noopener" style="display:block;cursor:pointer;">${imgTag}</a>`
            : imgTag;
        const dirUrl = `https://map.kakao.com/link/to/${encodeURIComponent(
          cafe.name
        )},${coord.y},${coord.x}`;
        const links: string[] = [];
        if (cafe.sourceUrl) {
          links.push(
            `<a href="${escapeHtml(
              cafe.sourceUrl
            )}" rel="noopener" style="color:#8b5e3c;text-decoration:none;font-weight:600;">인스타 ↗</a>`
          );
        }
        links.push(
          `<a href="${escapeHtml(
            dirUrl
          )}" target="_blank" rel="noopener noreferrer" style="color:#8b5e3c;text-decoration:none;font-weight:600;">길찾기 →</a>`
        );
        links.push(
          `<a href="/cafe/${escapeHtml(
            cafe.id
          )}" style="color:#8b5e3c;text-decoration:none;font-weight:600;">상세 →</a>`
        );
        const hoursLine = cafe.hours
          ? `<div style="color:#8a7458;font-size:11px;margin-top:3px;">🕐 ${escapeHtml(
              cafe.hours.text
            )}</div>`
          : "";
        const favBtn = `<button class="gs-fav-btn" data-cafe="${escapeHtml(
          cafe.id
        )}" aria-label="즐겨찾기" style="position:absolute;top:8px;right:8px;z-index:3;width:28px;height:28px;padding:0;border:none;border-radius:9999px;background:rgba(0,0,0,0.38);display:flex;align-items:center;justify-content:center;cursor:pointer;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
          </button>`;
        const newBadge = isNewCafe(cafe.addedAt, Date.now())
          ? `<span style="position:absolute;top:8px;left:8px;z-index:3;padding:2px 8px;border-radius:9999px;background:rgba(47,158,99,0.92);color:#fff;font-size:10px;font-weight:700;">NEW</span>`
          : "";
        const cardContent = `
          <div class="gs-info-card" data-cafe="${escapeHtml(
            cafe.id
          )}" style="position:relative;width:220px;font-size:13px;line-height:1.5;overflow:hidden;border-radius:6px;">
            ${favBtn}
            ${newBadge}
            ${cardImage}
            <div style="padding:8px 12px;">
              <div style="font-weight:600;margin-bottom:2px;color:#2c2119;">${escapeHtml(
                cafe.name
              )}</div>
              <div style="color:#7a6650;font-size:12px;margin-bottom:4px;">${escapeHtml(
                cafe.area
              )} · ${escapeHtml(cafe.region)}</div>
              <div style="color:#666;">${escapeHtml(cafe.description)}</div>
              ${hoursLine}
              <div style="margin-top:8px;display:flex;gap:12px;">${links.join("")}</div>
            </div>
          </div>
        `;

        const infoWindow = new window.kakao.maps.InfoWindow({
          content: cardContent,
          removable: false, // 빈 곳 터치·마우스 이탈로 닫히므로 × 버튼 불필요
          zIndex: 1000, // 클러스터가 재렌더될 때 카드 위로 겹치지 않도록
        });

        if (isTouch) {
          // 모바일(터치): 마커를 탭하면 이미지·소개 카드가 열리고, 카드에서 인스타/길찾기로 이동
          window.kakao.maps.event.addListener(marker, "click", () => {
            cancelClose();
            if (openIWRef.current && openIWRef.current !== infoWindow)
              openIWRef.current.close();
            infoWindow.open(map, marker);
            openIWRef.current = infoWindow;
            setCafeOfTheDayOpen(cafe.id === cafeOfTheDayIdRef.current);
            hydrateFavButton(cafe.id);
            map.panTo(position); // 카드가 화면에 잘 보이도록 마커를 중앙으로
          });
        } else {
          // 데스크톱: 호버로 카드 미리보기, 클릭으로 인스타 바로 이동
          window.kakao.maps.event.addListener(marker, "mouseover", () => {
            openCard(infoWindow, marker, cafe.id);
          });
          window.kakao.maps.event.addListener(marker, "mouseout", () => {
            scheduleClose(infoWindow);
          });
          if (cafe.sourceUrl) {
            const sourceUrl = cafe.sourceUrl;
            window.kakao.maps.event.addListener(marker, "click", () => {
              window.location.assign(sourceUrl);
            });
          } else {
            window.kakao.maps.event.addListener(marker, "click", () => {
              openCard(infoWindow, marker, cafe.id);
            });
          }
        }

        const entry: MarkerEntry = { marker, cafe, infoWindow, position };
        markersRef.current.push(entry);
        markerByIdRef.current.set(cafe.id, entry);
        posByIdRef.current.set(cafe.id, coord);
      };

      // 동시 요청을 제한한 큐로 순차 검색 (전량 동시 발사 시 rate limit으로 누락됨)
      const run = async () => {
        const queue = [...cafes];
        const CONCURRENCY = 6;
        const worker = async () => {
          while (queue.length > 0) {
            const cafe = queue.shift();
            if (!cafe) break;
            // 좌표가 직접 지정된 카페(해외 등)는 검색 없이 바로 표시
            if (cafe.coords) {
              addMarker(cafe, {
                y: String(cafe.coords.lat),
                x: String(cafe.coords.lng),
              });
              continue;
            }
            const cached = cache[cafe.searchQuery];
            if (cached && Date.now() - cached.t < CACHE_TTL) {
              addMarker(cafe, cached);
              continue;
            }
            const coord = await searchWithRetry(cafe.searchQuery);
            if (coord) {
              cache[cafe.searchQuery] = { ...coord, t: Date.now() };
              addMarker(cafe, coord);
            } else {
              console.warn(`"${cafe.name}" 검색 결과 없음 (query: ${cafe.searchQuery})`);
            }
            await new Promise((r) => setTimeout(r, 120));
          }
        };
        await Promise.all(Array.from({ length: CONCURRENCY }, worker));
        saveCache();
        setLocatedCafes(markersRef.current.map((e) => e.cafe));
        setMarkersReady(true);
      };
      void run();
    };

    if (window.kakao?.maps) {
      window.kakao.maps.load(initMap);
      return;
    }

    const existingScript = document.getElementById("kakao-map-sdk");
    if (existingScript) {
      existingScript.addEventListener("load", () => window.kakao.maps.load(initMap));
      return;
    }

    const script = document.createElement("script");
    script.id = "kakao-map-sdk";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services,clusterer`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(initMap);
    script.onerror = () =>
      setError("카카오맵 SDK 로드에 실패했습니다. API 키를 확인해주세요.");
    document.head.appendChild(script);
  }, [cafes]);

  // 필터 변화 → 클러스터러에 보이는 마커만 반영
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersReady) return;

    const visibleEntries = markersRef.current.filter((e) =>
      matchesRef.current(e.cafe)
    );
    const clusterer = clustererRef.current;
    if (clusterer) {
      clusterer.clear();
      clusterer.addMarkers(visibleEntries.map((e) => e.marker));
    } else {
      markersRef.current.forEach((e) =>
        e.marker.setMap(visibleEntries.includes(e) ? map : null)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, tag, search, favoriteOnly, newOnly, openNowOnly, nowTick, favorites, markersReady]);

  // 필터/뷰 변화 → 지도 범위 맞추기 (즐겨찾기 토글에는 반응하지 않음)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersReady || view !== "map") return;

    // 목록에서 지도로 돌아온 경우 레이아웃 재계산
    map.relayout();

    const visibleEntries = markersRef.current.filter((e) =>
      matchesRef.current(e.cafe)
    );
    if (visibleEntries.length === 0) return;

    if (visibleEntries.length === 1) {
      map.setCenter(visibleEntries[0].position);
      map.setLevel(5);
      return;
    }
    const bounds = new window.kakao.maps.LatLngBounds();
    visibleEntries.forEach((e) => bounds.extend(e.position));
    map.setBounds(bounds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, tag, search, favoriteOnly, newOnly, openNowOnly, markersReady, view]);

  // 특정 카페로 지도 이동 + 정보창 열기 (목록/랜덤에서 호출)
  const focusCafe = useCallback((cafe: Cafe) => {
    setView("map");
    setTimeout(() => {
      const map = mapInstanceRef.current;
      const entry = markerByIdRef.current.get(cafe.id);
      if (!map || !entry) return;
      // 이전에 열려 있던 정보창을 먼저 닫아 겹침 방지
      if (openIWRef.current && openIWRef.current !== entry.infoWindow) {
        openIWRef.current.close();
      }
      map.relayout();
      map.setLevel(4);
      map.setCenter(entry.position);
      entry.infoWindow.open(map, entry.marker);
      openIWRef.current = entry.infoWindow;
      hydrateFavRef.current(cafe.id);
    }, 80);
  }, []);

  // 딥링크: /?cafe=<id> 로 진입하면 해당 카페로 이동 + 카드 열기
  // (/cafe/[id] 상세 페이지의 "지도에서 보기", 외부 공유 링크에서 사용)
  useEffect(() => {
    if (!markersReady) return;
    const id = new URLSearchParams(window.location.search).get("cafe");
    if (!id) return;
    const entry = markerByIdRef.current.get(id);
    if (entry) focusCafe(entry.cafe);
    // 한 번 처리한 뒤 주소를 정리해 새로고침 시 재실행 방지
    window.history.replaceState(null, "", window.location.pathname);
  }, [markersReady, focusCafe]);

  // 오늘의 카페 — 날짜(로컬 자정 기준 일수)로 정해지는 고정 추천, 24시간마다 변경
  const cafeOfTheDay = useMemo(() => {
    if (locatedCafes.length === 0) return null;
    const pool = [...locatedCafes].sort((a, b) => a.id.localeCompare(b.id));
    const now = new Date();
    const dayNum = Math.floor(
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() /
        86400000
    );
    return pool[dayNum % pool.length];
  }, [locatedCafes]);
  cafeOfTheDayIdRef.current = cafeOfTheDay?.id ?? null;

  // 내 위치로 지도 이동(반경 1km, 확대) — 정확도가 나쁘면(오차 2km 초과) 경고 표시
  const NEAR_RADIUS_KM = 1;
  const ACCURACY_WARNING_M = 2000;
  const goToLocation = useCallback(
    (loc: { lat: number; lng: number }, accuracy?: number) => {
      setUserLoc(loc);
      setSortBy("distance");
      setGeoAccuracyWarning(typeof accuracy === "number" && accuracy > ACCURACY_WARNING_M);
      // 지도 뷰일 때만 내 위치 중심 반경 5km로 이동 (필터 변경 시엔 지도가 필터를 따르도록 유지)
      const map = mapInstanceRef.current;
      if (map && window.kakao?.maps && view === "map") {
        const { dLat, dLng } = offsetLatLngByKm(loc.lat, loc.lng, NEAR_RADIUS_KM);
        const bounds = new window.kakao.maps.LatLngBounds(
          new window.kakao.maps.LatLng(loc.lat - dLat, loc.lng - dLng),
          new window.kakao.maps.LatLng(loc.lat + dLat, loc.lng + dLng)
        );
        map.setBounds(bounds);
      }
    },
    [view]
  );

  // '내 주변' 토글: 한 번 누르면 거리순 활성화, 다시 누르면 해제
  // (즐겨찾기·NEW·오늘의 카페와는 배타적으로 동작 — 하나만 활성화)
  const toggleNear = useCallback(() => {
    // 이미 거리순(내 주변)이면 해제
    if (sortBy === "distance") {
      setSortBy("default");
      setGeoAccuracyWarning(false);
      return;
    }
    setFavoriteOnly(false);
    setNewOnly(false);
    if (openIWRef.current) {
      openIWRef.current.close();
      openIWRef.current = null;
    }
    setCafeOfTheDayOpen(false);
    if (!navigator.geolocation) {
      setGeoError("이 브라우저는 위치 기능을 지원하지 않아요.");
      return;
    }
    // 재클릭 시에도 항상 최신 위치를 새로 요청 (캐시된 위치가 부정확할 수 있음)
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        goToLocation(
          { lat: pos.coords.latitude, lng: pos.coords.longitude },
          pos.coords.accuracy
        );
      },
      (err) => {
        setLocating(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "위치 권한이 거부됐어요. 브라우저 설정에서 허용해 주세요."
            : "위치를 가져오지 못했어요. 잠시 후 다시 시도해 주세요."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [sortBy, goToLocation]);

  // 내 위치 마커 — 거리순(내 주변)일 때만 표시, 지도는 자동 이동하지 않음
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.kakao?.maps) return;
    if (userLoc && sortBy === "distance") {
      const pos = new window.kakao.maps.LatLng(userLoc.lat, userLoc.lng);
      if (!userOverlayRef.current) {
        const content = document.createElement("div");
        content.innerHTML =
          '<div style="width:16px;height:16px;border-radius:9999px;background:#2f6fed;border:2px solid #fff;box-shadow:0 0 0 5px rgba(47,111,237,0.25);"></div>';
        userOverlayRef.current = new window.kakao.maps.CustomOverlay({
          position: pos,
          content,
          zIndex: 5,
        });
      } else {
        userOverlayRef.current.setPosition(pos);
      }
      userOverlayRef.current.setMap(map);
    } else {
      userOverlayRef.current?.setMap(null);
    }
  }, [userLoc, sortBy]);

  const resetFilters = useCallback((name: string) => {
    setRegion(name);
    setTag(null);
    setSearch("");
    setFavoriteOnly(false);
    setNewOnly(false);
  }, []);

  // 오늘의 카페 보기 — 다시 누르면 닫힘(토글), 필터에 가려져 있으면 전체로 풀어 확실히 표시
  const showCafeOfTheDay = useCallback(() => {
    if (!cafeOfTheDay) return;
    const entry = markerByIdRef.current.get(cafeOfTheDay.id);
    // 이미 오늘의 카페 카드가 열려 있으면 닫기만 하고 종료
    if (entry && openIWRef.current === entry.infoWindow) {
      openIWRef.current.close();
      openIWRef.current = null;
      setCafeOfTheDayOpen(false);
      return;
    }
    const visible = visibleCafes.some((c) => c.id === cafeOfTheDay.id);
    if (!visible) resetFilters(ALL_REGION);
    setFavoriteOnly(false);
    setNewOnly(false);
    if (sortBy === "distance") setSortBy("default");
    focusCafe(cafeOfTheDay);
    setCafeOfTheDayOpen(true);
  }, [cafeOfTheDay, visibleCafes, resetFilters, focusCafe, sortBy]);

  // 첫 로드 시 자동으로 '내 주변' 활성화 — 위치 권한이 있으면 거리순 + 반경 1km로 확대해서 시작
  useEffect(() => {
    if (!navigator.geolocation || !markersReady) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        goToLocation(
          { lat: pos.coords.latitude, lng: pos.coords.longitude },
          pos.coords.accuracy
        );
      },
      () => {
        /* 자동 시도는 실패해도 조용히 무시 (수동 '내 주변' 버튼은 안내 표시) */
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markersReady]);

  const favCount = favorites.size;
  // NEW·지금영업중·영업시간보유 카운트도 태그 카운트와 동일하게 "현재 선택된 지역" 기준으로 집계
  // (전체 지역은 해외를 제외하므로, 지역 필터 없이 전체 카페 기준으로 세면 실제 목록에 뜨는 개수와 어긋난다)
  const newCount = useMemo(
    () =>
      cafes.filter(
        (c) => regionMatch(c.region, region) && isNewCafe(c.addedAt, Date.now())
      ).length,
    [cafes, region]
  );
  // 영업시간 정보가 입력된 카페가 하나라도 있어야 "지금 영업중" 버튼 노출
  const schedulableCount = useMemo(
    () => cafes.filter((c) => regionMatch(c.region, region) && hasSchedule(c)).length,
    [cafes, region]
  );
  const openNowCount = useMemo(
    () =>
      cafes.filter(
        (c) => regionMatch(c.region, region) && isOpenNow(c, new Date(nowTick)) === true
      ).length,
    [cafes, region, nowTick]
  );

  if (error) {
    return (
      <div className="flex h-[600px] w-full items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
        {error}
      </div>
    );
  }

  const summaryLabel =
    `${region}${tag ? ` · ${tag}` : ""}${favoriteOnly ? " · 즐겨찾기" : ""}${
      newOnly ? " · NEW" : ""
    }` + ` · ${visibleCafes.length}곳`;

  // 활성(좁히는) 필터 목록 — 요약 칩·개수용
  const activeChips: { key: string; label: string; clear: () => void }[] = [];
  if (region !== ALL_REGION)
    activeChips.push({ key: "region", label: region, clear: () => setRegion(ALL_REGION) });
  if (tag) activeChips.push({ key: "tag", label: tag, clear: () => setTag(null) });
  if (favoriteOnly)
    activeChips.push({ key: "fav", label: "즐겨찾기", clear: () => setFavoriteOnly(false) });
  if (newOnly)
    activeChips.push({ key: "new", label: "NEW", clear: () => setNewOnly(false) });
  if (openNowOnly)
    activeChips.push({ key: "open", label: "지금 영업중", clear: () => setOpenNowOnly(false) });
  if (search.trim())
    activeChips.push({ key: "search", label: `"${search.trim()}"`, clear: () => setSearch("") });

  const sortOptions: { value: typeof sortBy; label: string }[] = [
    { value: "default", label: "기본순" },
    ...(userLoc ? [{ value: "distance" as const, label: "거리순" }] : []),
    { value: "name", label: "이름순" },
    { value: "region", label: "지역순" },
    { value: "favorite", label: "즐겨찾기순" },
    { value: "unvisited", label: "미방문순" },
  ];

  const shownCafes = visibleCafes.slice(0, listLimit);

  return (
    <div>
      <div className="relative mb-4">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b3a084] dark:text-[#7c6a52]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="카페 이름·동네·키워드 검색 (예: 망원동, 베이글)"
          className="w-full rounded-xl border border-[#e3d8c6] bg-white/80 py-3 pl-11 pr-10 text-sm text-[#3d2c1e] shadow-sm outline-none transition placeholder:text-[#b3a084] focus:border-[#c8a77e] focus:ring-2 focus:ring-[#c8a77e]/25 dark:border-[#3a2e23] dark:bg-[#231b14]/80 dark:text-[#f0e6d5] dark:placeholder:text-[#7c6a52]"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="검색어 지우기"
            className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[#b3a084] transition hover:bg-[#efe6d5] hover:text-[#6f4e37] dark:hover:bg-[#2c2219] dark:hover:text-[#d3bd9c]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <div className="mb-3 overflow-hidden rounded-2xl border border-[#e9dfce] bg-[#fbf7f0]/70 shadow-[0_1px_3px_rgba(80,60,40,0.05)] dark:border-[#2e251c] dark:bg-[#1d1712]/60">
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          className="flex w-full items-center gap-2 px-4 py-3 text-left"
          aria-expanded={filtersOpen}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[#8a7458] dark:text-[#9a866a]"
            aria-hidden="true"
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="7" y1="12" x2="17" y2="12" />
            <line x1="10" y1="18" x2="14" y2="18" />
          </svg>
          <span className="text-sm font-semibold text-[#5c4632] dark:text-[#d3bd9c]">
            지역 · 테마 필터
          </span>
          {activeChips.length > 0 && (
            <span className="rounded-full bg-[#6f4e37] px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white">
              {activeChips.length}
            </span>
          )}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`ml-auto text-[#a5906f] transition-transform dark:text-[#8a7458] ${
              filtersOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {filtersOpen && (
          <div className="space-y-4 border-t border-[#ece2d0] px-4 pb-4 pt-3 dark:border-[#2e251c]">
            <div>
          <div className="mb-2.5 flex items-center gap-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a5906f] dark:text-[#8a7458]">
              지역
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-[#e3d8c6] to-transparent dark:from-[#332a20]" />
          </div>
          <div className="flex flex-wrap gap-1">
            {regions.map((r) => {
              const active = region === r.name;
              return (
                <button
                  key={r.name}
                  onClick={() => {
                    resetFilters(r.name);
                    // 해외는 카카오 지도가 비어 있으므로 목록으로 보여줌
                    if (r.name === OVERSEAS_REGION) setView("list");
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                    active
                      ? "bg-[#6f4e37] text-white shadow-sm shadow-[#6f4e37]/25"
                      : "bg-white/70 text-[#6b5842] ring-1 ring-inset ring-[#e6dcca] hover:bg-white hover:ring-[#d8c8b0] dark:bg-[#231b14]/60 dark:text-[#c8b79c] dark:ring-[#3a2e23] dark:hover:bg-[#2a2018]"
                  }`}
                >
                  {r.name}
                  <span
                    className={`text-[11px] tabular-nums ${
                      active ? "text-white/60" : "text-[#b3a084] dark:text-[#7c6a52]"
                    }`}
                  >
                    {r.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2.5 flex items-center gap-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a5906f] dark:text-[#8a7458]">
              테마
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-[#e3d8c6] to-transparent dark:from-[#332a20]" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => {
              const active = tag === t.name;
              const accent = TAG_ACCENT[t.name] ?? DEFAULT_ACCENT;
              return (
                <button
                  key={t.name}
                  onClick={() => setTag(active ? null : t.name)}
                  style={active ? { backgroundColor: accent, borderColor: accent } : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                    active
                      ? "text-white shadow-sm"
                      : "border-[#e6dcca] bg-white/60 text-[#6b5842] hover:bg-white hover:shadow-sm dark:border-[#3a2e23] dark:bg-[#231b14]/50 dark:text-[#c8b79c] dark:hover:bg-[#2a2018]"
                  }`}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: active ? "rgba(255,255,255,0.9)" : accent }}
                  />
                  {t.name}
                  <span
                    className={`text-[11px] tabular-nums ${
                      active ? "text-white/70" : "text-[#b3a084] dark:text-[#7c6a52]"
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
            </div>

            {/* 내 기록 백업/복원 — 즐겨찾기·가봤어요는 이 브라우저에만 저장됨 */}
            <div>
              <div className="mb-2.5 flex items-center gap-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a5906f] dark:text-[#8a7458]">
                  내 기록
                </span>
                <span className="h-px flex-1 bg-gradient-to-r from-[#e3d8c6] to-transparent dark:from-[#332a20]" />
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={exportRecords}
                  disabled={favorites.size === 0 && visited.size === 0}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#e6dcca] bg-white/70 px-3 py-1 text-xs font-medium text-[#6b5842] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#3a2e23] dark:bg-[#231b14]/60 dark:text-[#c8b79c]"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  백업 파일 저장
                </button>
                <button
                  onClick={() => importInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#e6dcca] bg-white/70 px-3 py-1 text-xs font-medium text-[#6b5842] transition hover:bg-white dark:border-[#3a2e23] dark:bg-[#231b14]/60 dark:text-[#c8b79c]"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  백업 불러오기
                </button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void importRecords(file);
                    e.target.value = ""; // 같은 파일 재선택도 동작하도록 초기화
                  }}
                />
                <span className="text-[11px] text-[#b3a084] dark:text-[#7c6a52]">
                  즐겨찾기 {favorites.size} · 가봤어요 {visited.size} — 이 기기에만 저장돼요
                </span>
              </div>
              {importMsg && (
                <p className="mt-2 text-xs font-medium text-[#3c8e5c]">{importMsg}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 활성 필터 요약 칩은 컨트롤 바 버튼 자체의 활성 스타일로 충분히 드러나므로 숨김 처리 */}

      {/* 컨트롤 바: 뷰 전환 · 즐겨찾기 · 랜덤 · 결과 개수 */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-full border border-[#e6dcca] bg-white/70 p-0.5 dark:border-[#3a2e23] dark:bg-[#231b14]/60">
          {(["map", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                view === v
                  ? "bg-[#6f4e37] text-white shadow-sm"
                  : "text-[#8a7458] hover:text-[#6f4e37] dark:text-[#9a866a]"
              }`}
            >
              {v === "map" ? "지도" : "목록"}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            const next = !favoriteOnly;
            setFavoriteOnly(next);
            if (next) {
              setNewOnly(false);
              if (sortBy === "distance") setSortBy("default");
              if (openIWRef.current) {
                openIWRef.current.close();
                openIWRef.current = null;
              }
              setCafeOfTheDayOpen(false);
            }
          }}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
            favoriteOnly
              ? "border-[#c9455f] bg-[#c9455f] text-white shadow-sm"
              : "border-[#e6dcca] bg-white/70 text-[#6b5842] hover:bg-white dark:border-[#3a2e23] dark:bg-[#231b14]/60 dark:text-[#c8b79c]"
          }`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill={favoriteOnly ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
          즐겨찾기
          {favCount > 0 && (
            <span className={`text-[11px] tabular-nums ${favoriteOnly ? "text-white/70" : "text-[#b3a084]"}`}>
              {favCount}
            </span>
          )}
        </button>

        {newCount > 0 && (
          <button
            onClick={() => {
              const next = !newOnly;
              setNewOnly(next);
              if (next) {
                setFavoriteOnly(false);
                if (sortBy === "distance") setSortBy("default");
                if (openIWRef.current) {
                  openIWRef.current.close();
                  openIWRef.current = null;
                }
                setCafeOfTheDayOpen(false);
              }
            }}
            aria-pressed={newOnly}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
              newOnly
                ? "border-[#2f9e63] bg-[#2f9e63] text-white shadow-sm"
                : "border-[#e6dcca] bg-white/70 text-[#6b5842] hover:bg-white dark:border-[#3a2e23] dark:bg-[#231b14]/60 dark:text-[#c8b79c]"
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" />
            </svg>
            NEW
            <span className={`text-[11px] tabular-nums ${newOnly ? "text-white/70" : "text-[#b3a084]"}`}>
              {newCount}
            </span>
          </button>
        )}

        {schedulableCount > 0 && (
          <button
            onClick={() => {
              setNowTick(Date.now());
              setOpenNowOnly((v) => !v);
            }}
            aria-pressed={openNowOnly}
            title="영업시간 정보가 등록된 카페 중 지금(한국 시간) 영업중인 곳만 표시"
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
              openNowOnly
                ? "border-[#3c8e5c] bg-[#3c8e5c] text-white shadow-sm"
                : "border-[#e6dcca] bg-white/70 text-[#6b5842] hover:bg-white dark:border-[#3a2e23] dark:bg-[#231b14]/60 dark:text-[#c8b79c]"
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15.5 14" />
            </svg>
            지금 영업중
            <span className={`text-[11px] tabular-nums ${openNowOnly ? "text-white/70" : "text-[#b3a084]"}`}>
              {openNowCount}
            </span>
          </button>
        )}

        <button
          onClick={showCafeOfTheDay}
          disabled={!cafeOfTheDay}
          aria-pressed={cafeOfTheDayOpen}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
            cafeOfTheDayOpen
              ? "border-[#c98a2f] bg-[#c98a2f] text-white shadow-sm"
              : "border-[#e6dcca] bg-white/70 text-[#6b5842] hover:bg-white dark:border-[#3a2e23] dark:bg-[#231b14]/60 dark:text-[#c8b79c]"
          }`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="4" />
            <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" />
            <circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" />
            <circle cx="15.5" cy="8.5" r="1.3" fill="currentColor" />
            <circle cx="8.5" cy="15.5" r="1.3" fill="currentColor" />
          </svg>
          오늘의 카페
        </button>

        <button
          onClick={toggleNear}
          disabled={locating}
          aria-pressed={sortBy === "distance"}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-60 ${
            sortBy === "distance"
              ? "border-[#2f6fed] bg-[#2f6fed] text-white shadow-sm"
              : "border-[#e6dcca] bg-white/70 text-[#6b5842] hover:bg-white dark:border-[#3a2e23] dark:bg-[#231b14]/60 dark:text-[#c8b79c]"
          }`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          {locating ? "위치 확인 중…" : "내 주변"}
        </button>

        {view === "list" && (
          <label className="inline-flex items-center gap-1.5 rounded-full border border-[#e6dcca] bg-white/70 py-1 pl-3 pr-2 text-xs font-semibold text-[#6b5842] dark:border-[#3a2e23] dark:bg-[#231b14]/60 dark:text-[#c8b79c]">
            <span className="text-[#a5906f] dark:text-[#8a7458]">정렬</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="cursor-pointer bg-transparent font-semibold text-[#6f4e37] outline-none dark:text-[#d3bd9c]"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <span className="ml-auto text-sm font-medium text-[#8a7458] dark:text-[#9a866a]">
          {summaryLabel}
        </span>
      </div>

      {geoError && (
        <div className="mb-3 rounded-lg border border-[#e7c9c0] bg-[#fbeee9] px-3 py-2 text-xs text-[#a4553f] dark:border-[#4a2f28] dark:bg-[#2a1a15] dark:text-[#d8a08d]">
          {geoError}
        </div>
      )}

      {!geoError && geoAccuracyWarning && sortBy === "distance" && (
        <div className="mb-3 rounded-lg border border-[#e9dcb8] bg-[#fdf6e3] px-3 py-2 text-xs text-[#8a6d1f] dark:border-[#4a3f28] dark:bg-[#2a2415] dark:text-[#d8c08d]">
          위치 오차가 커서 실제 위치와 다르게 표시될 수 있어요. 브라우저의 위치 권한(정확한 위치)을 허용했는지 확인해 주세요.
        </div>
      )}

      <div
        ref={mapRef}
        className={`h-[600px] w-full rounded-2xl shadow-sm ${view === "list" ? "hidden" : ""}`}
      />

      {view === "list" && (
        <div>
          {!markersReady ? (
            <div className="flex h-40 items-center justify-center text-sm text-[#a5906f]">
              카페를 불러오는 중…
            </div>
          ) : visibleCafes.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-1 text-sm text-[#a5906f]">
              <span>조건에 맞는 카페가 없어요.</span>
              <button
                onClick={() => resetFilters(DEFAULT_REGION)}
                className="text-[#8b5e3c] underline underline-offset-2"
              >
                필터 초기화
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {shownCafes.map((cafe) => {
                const isFav = favorites.has(cafe.id);
                const isVisited = visited.has(cafe.id);
                const isOverseas = cafe.region === OVERSEAS_REGION;
                const pos = posByIdRef.current.get(cafe.id);
                const dirUrl = pos
                  ? `https://map.kakao.com/link/to/${encodeURIComponent(
                      cafe.name
                    )},${pos.y},${pos.x}`
                  : null;
                // 해외: 카카오 대신 구글맵 링크
                const googleUrl = cafe.coords
                  ? `https://www.google.com/maps/search/?api=1&query=${cafe.coords.lat},${cafe.coords.lng}`
                  : null;
                return (
                  <div
                    key={cafe.id}
                    className="group flex flex-col overflow-hidden rounded-xl border border-[#e9dfce] bg-white/80 shadow-sm transition-shadow hover:shadow-md dark:border-[#2e251c] dark:bg-[#201a14]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#f0e6d5] dark:bg-[#2a2018]">
                      {cafe.imageUrl &&
                        (cafe.sourceUrl ? (
                          <a
                            href={cafe.sourceUrl}
                            rel="noopener"
                            aria-label={`${cafe.name} 인스타그램 열기`}
                            className="block h-full w-full"
                          >
                            <Image
                              src={cafe.imageUrl}
                              alt={cafe.name}
                              fill
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                              className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
                                isVisited ? "opacity-60" : ""
                              }`}
                            />
                          </a>
                        ) : (
                          <Image
                            src={cafe.imageUrl}
                            alt={cafe.name}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
                              isVisited ? "opacity-60" : ""
                            }`}
                          />
                        ))}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite(cafe.id);
                        }}
                        aria-label={isFav ? "즐겨찾기 해제" : "즐겨찾기"}
                        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill={isFav ? "#ff5a76" : "none"} stroke={isFav ? "#ff5a76" : "currentColor"} strokeWidth="2" aria-hidden="true">
                          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                        </svg>
                      </button>
                      <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
                        {isNewCafe(cafe.addedAt, Date.now()) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#2f9e63]/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                            NEW
                          </span>
                        )}
                        {isVisited && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#6f4e37]/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            가봤어요
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-3">
                      <div className="mb-0.5 flex items-start gap-1.5">
                        {(cafe.tags ?? []).slice(0, 1).map((t) => (
                          <span
                            key={t}
                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: TAG_ACCENT[t] ?? DEFAULT_ACCENT }}
                            title={t}
                          />
                        ))}
                        <h3 className="text-sm font-semibold leading-snug text-[#2c2119] dark:text-[#f0e6d5]">
                          {cafe.name}
                        </h3>
                      </div>
                      <div className="mb-1 text-[11px] text-[#a5906f] dark:text-[#8a7458]">
                        {cafe.area} · {cafe.region}
                        {distanceById.has(cafe.id) && (
                          <span className="ml-1 font-semibold text-[#2f6fed]">
                            · {formatDist(distanceById.get(cafe.id)!)}
                          </span>
                        )}
                      </div>
                      <p className="line-clamp-2 text-xs leading-relaxed text-[#6b5842] dark:text-[#b09b7e]">
                        {cafe.description}
                      </p>
                      {cafe.hours && (
                        <p className="mt-1 text-[11px] text-[#a5906f] dark:text-[#8a7458]">
                          🕐 {cafe.hours.text}
                          {isOpenNow(cafe, new Date(nowTick)) === true && (
                            <span className="ml-1 font-semibold text-[#3c8e5c]">
                              영업중
                            </span>
                          )}
                        </p>
                      )}

                      <div className="mt-auto flex flex-wrap gap-1 pt-2.5">
                        {!isOverseas && (
                          <button
                            onClick={() => focusCafe(cafe)}
                            className="rounded-md bg-[#f2e9d8] px-2 py-1 text-[11px] font-semibold text-[#6f4e37] transition hover:bg-[#eaddc8] dark:bg-[#2a2018] dark:text-[#d3bd9c] dark:hover:bg-[#332a20]"
                          >
                            지도에서
                          </button>
                        )}
                        <button
                          onClick={() => toggleVisited(cafe.id)}
                          className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                            isVisited
                              ? "bg-[#6f4e37] text-white"
                              : "bg-[#f2e9d8] text-[#6f4e37] hover:bg-[#eaddc8] dark:bg-[#2a2018] dark:text-[#d3bd9c] dark:hover:bg-[#332a20]"
                          }`}
                        >
                          {isVisited ? "방문함" : "가봤어요"}
                        </button>
                        <Link
                          href={`/cafe/${cafe.id}`}
                          className="rounded-md bg-[#f2e9d8] px-2 py-1 text-[11px] font-semibold text-[#6f4e37] transition hover:bg-[#eaddc8] dark:bg-[#2a2018] dark:text-[#d3bd9c] dark:hover:bg-[#332a20]"
                        >
                          상세
                        </Link>
                        {cafe.sourceUrl && (
                          <a
                            href={cafe.sourceUrl}
                            rel="noopener"
                            className="rounded-md bg-[#f2e9d8] px-2 py-1 text-[11px] font-semibold text-[#6f4e37] transition hover:bg-[#eaddc8] dark:bg-[#2a2018] dark:text-[#d3bd9c] dark:hover:bg-[#332a20]"
                          >
                            인스타 ↗
                          </a>
                        )}
                        {isOverseas
                          ? googleUrl && (
                              <a
                                href={googleUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-md bg-[#f2e9d8] px-2 py-1 text-[11px] font-semibold text-[#6f4e37] transition hover:bg-[#eaddc8] dark:bg-[#2a2018] dark:text-[#d3bd9c] dark:hover:bg-[#332a20]"
                              >
                                구글맵 →
                              </a>
                            )
                          : dirUrl && (
                              <a
                                href={dirUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-md bg-[#f2e9d8] px-2 py-1 text-[11px] font-semibold text-[#6f4e37] transition hover:bg-[#eaddc8] dark:bg-[#2a2018] dark:text-[#d3bd9c] dark:hover:bg-[#332a20]"
                              >
                                길찾기 →
                              </a>
                            )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {markersReady && visibleCafes.length > listLimit && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setListLimit((n) => n + 24)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#dcc9ad] bg-white/80 px-5 py-2 text-sm font-semibold text-[#6f4e37] shadow-sm transition hover:bg-white dark:border-[#3a2e23] dark:bg-[#231b14]/70 dark:text-[#d3bd9c] dark:hover:bg-[#2a2018]"
              >
                더 보기
                <span className="text-xs font-medium text-[#a5906f] dark:text-[#8a7458]">
                  {shownCafes.length} / {visibleCafes.length}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 맨 위로 버튼 (스크롤 시 표시) */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="맨 위로"
          className="fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-[#dcc9ad] bg-[#6f4e37] text-white shadow-lg transition hover:bg-[#5c4029]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      )}
    </div>
  );
}
