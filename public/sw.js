// GreenSori Map 서비스워커 v3
// - 이미지·정적 자산: 캐시 우선(빠른 재방문·오프라인) + 개수 상한으로 무한 증식 방지
// - 페이지·데이터: 네트워크 우선, 실패 시 캐시 폴백 (항상 최신 내용 우선)
// - /api/ 요청·외부 출처(카카오맵 등)는 건드리지 않음
// - v3: 잘리거나 이미지가 아닌 응답은 캐시하지 않음 (깨진 사진이 영구 캐시되던 문제 수정).
//   VERSION을 올리면 activate 시 이전 버전 캐시가 모두 삭제된다.
const VERSION = "greensori-v3";
const IMG_CACHE = `${VERSION}-img`;
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-page`;
const IMG_LIMIT = 300; // 카페 사진 314장 + 여유

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(VERSION))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// 캐시 개수 상한 유지 — 초과 시 오래된 항목부터 삭제
async function trimCache(name, limit) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length <= limit) return;
  await Promise.all(keys.slice(0, keys.length - limit).map((k) => cache.delete(k)));
}

// 응답이 온전할 때만 캐시에 저장
// - 200만 저장 (206 부분 응답·리다이렉트·opaque 제외)
// - Content-Length가 있으면 실제 바디 길이와 일치해야 함 (전송 중 끊긴 응답 차단)
// - requireImage면 Content-Type이 image/* 여야 함 (에러 페이지 등이 사진 자리에 캐시되는 것 방지)
async function putIfComplete(req, res, cacheName, limit, requireImage) {
  try {
    if (res.status !== 200 || res.type === "opaque") return;
    const type = res.headers.get("content-type") || "";
    if (requireImage && !type.startsWith("image/")) return;
    const buf = await res.clone().arrayBuffer();
    if (buf.byteLength === 0) return;
    // 압축 전송(gzip/br)된 JS 등은 Content-Length가 압축 길이라 비교 불가 → 비압축 응답만 검사
    const encoding = (res.headers.get("content-encoding") || "identity").toLowerCase();
    const declared = Number(res.headers.get("content-length"));
    if (encoding === "identity" && declared > 0 && declared !== buf.byteLength) return;
    const cache = await caches.open(cacheName);
    await cache.put(
      req,
      new Response(buf, { status: 200, statusText: res.statusText, headers: res.headers })
    );
    if (limit) await trimCache(cacheName, limit);
  } catch {
    // 캐시 실패는 무시 — 응답 자체는 이미 반환됨
  }
}

// 캐시 우선: 있으면 즉시 반환하고, 없을 때만 네트워크에서 받아 저장
// (저장은 event.waitUntil로 보호해 응답 반환 후 워커가 종료돼도 중간에 끊기지 않게 함)
async function cacheFirst(event, cacheName, limit, requireImage) {
  const req = event.request;
  const cached = await caches.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  event.waitUntil(putIfComplete(req, res, cacheName, limit, requireImage));
  return res;
}

// 네트워크 우선: 성공 시 캐시 갱신, 실패(오프라인) 시 캐시 폴백
async function networkFirst(req, cacheName) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(cacheName);
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch (err) {
    const cached = await caches.match(req);
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // GET · 같은 출처만 처리 (카카오맵 타일 등 외부 요청은 그대로 통과)
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  // 방문 카운터 등 API는 캐시하지 않음
  if (url.pathname.startsWith("/api/")) return;

  // 이미지: 원본(/cafes/, 아이콘)과 최적화 결과(/_next/image) 모두 캐시 우선
  if (
    url.pathname.startsWith("/_next/image") ||
    url.pathname.startsWith("/cafes/") ||
    /\.(png|jpg|jpeg|webp|avif|svg|ico)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(event, IMG_CACHE, IMG_LIMIT, true));
    return;
  }

  // 빌드 정적 자산: 파일명에 해시가 있어 불변 — 캐시 우선
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(event, STATIC_CACHE));
    return;
  }

  // 페이지·기타: 네트워크 우선, 오프라인 시 캐시 폴백
  event.respondWith(networkFirst(req, PAGE_CACHE));
});
