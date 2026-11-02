import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cafes } from "@/data/cafes";
import ShareButton from "./share-button";

type Props = { params: Promise<{ id: string }> };

// 314곳 전부 빌드 타임에 정적 생성 — 공유·검색 노출용
export function generateStaticParams() {
  return cafes.map((cafe) => ({ id: cafe.id }));
}

export const dynamicParams = false;

// 태그 시그니처 색 (KakaoMap.tsx와 동일 팔레트)
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const cafe = cafes.find((c) => c.id === id);
  if (!cafe) return {};
  const title = `${cafe.name} — GreenSori Map`;
  const description = `${cafe.area} · ${cafe.region} | ${cafe.description}`;
  return {
    title,
    description,
    alternates: { canonical: `/cafe/${cafe.id}` },
    openGraph: {
      title,
      description,
      url: `/cafe/${cafe.id}`,
      siteName: "GreenSori Map",
      locale: "ko_KR",
      type: "article",
      // 카페 실제 사진을 공유 카드 이미지로 사용 (metadataBase 기준 절대화됨)
      ...(cafe.imageUrl ? { images: [{ url: cafe.imageUrl }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(cafe.imageUrl ? { images: [cafe.imageUrl] } : {}),
    },
  };
}

export default async function CafePage({ params }: Props) {
  const { id } = await params;
  const cafe = cafes.find((c) => c.id === id);
  if (!cafe) notFound();

  const isOverseas = cafe.region === "해외";
  // 국내: 카카오맵 키워드 검색 링크 / 해외: 좌표 기반 구글맵 링크
  const mapUrl = isOverseas
    ? cafe.coords
      ? `https://www.google.com/maps/search/?api=1&query=${cafe.coords.lat},${cafe.coords.lng}`
      : null
    : `https://map.kakao.com/link/search/${encodeURIComponent(cafe.searchQuery)}`;

  return (
    <div className="flex min-h-screen flex-col bg-canvas font-sans">
      <header className="border-b border-line/70">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4 sm:px-6">
          <Link
            href={isOverseas ? "/" : `/?cafe=${cafe.id}`}
            className="inline-flex items-center gap-1.5 text-ink transition hover:opacity-70"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="font-display text-[22px] leading-none tracking-tight">
              GreenSori <span className="italic text-brand">Map</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <article className="overflow-hidden rounded-3xl border border-line/80 bg-surface shadow-card">
          {cafe.imageUrl && (
            <div className="relative aspect-[16/10] bg-surface-2">
              <Image
                src={cafe.imageUrl}
                alt={cafe.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
            </div>
          )}

          <div className="p-6 sm:p-8">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {(cafe.tags ?? []).map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-2"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: TAG_ACCENT[t] ?? "#8a7458" }}
                  />
                  {t}
                </span>
              ))}
            </div>

            <h1 className="text-[28px] font-bold leading-tight tracking-[-0.03em] text-ink sm:text-[34px]">
              {cafe.name}
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              {cafe.area} · {cafe.region}
            </p>

            <p className="mt-5 text-[16px] leading-[1.75] text-ink-2">
              {cafe.description}
            </p>

            {(cafe.hours || cafe.menu) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {cafe.hours && (
                  <p className="inline-flex items-center gap-1.5 rounded-xl bg-surface-2 px-3.5 py-2 text-sm text-ink-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />
                      <polyline points="12 7 12 12 15.5 14" />
                    </svg>
                    {cafe.hours.text}
                  </p>
                )}
                {cafe.menu && (
                  <p className="inline-flex items-center gap-1.5 rounded-xl bg-surface-2 px-3.5 py-2 text-sm text-ink-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17 8h1a3 3 0 0 1 0 6h-1" />
                      <path d="M3 8h14v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" />
                    </svg>
                    추천 메뉴 · {cafe.menu}
                  </p>
                )}
              </div>
            )}

            {cafe.commentSummary && (
              <blockquote className="mt-5 rounded-2xl border-l-2 border-brand bg-brand-soft/60 px-5 py-4">
                <p className="text-sm leading-relaxed text-ink-2">
                  💬 {cafe.commentSummary}
                </p>
                <cite className="mt-1 block text-[11px] not-italic text-muted">
                  @green_sori 게시물 댓글 반응
                </cite>
              </blockquote>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              <ShareButton
                title={`${cafe.name} — GreenSori Map`}
                text={`${cafe.area}의 ${cafe.name} · ${cafe.description}`}
                path={`/cafe/${cafe.id}`}
              />
              {cafe.sourceUrl && (
                <a
                  href={cafe.sourceUrl}
                  rel="noopener"
                  className="inline-flex h-11 items-center gap-1.5 rounded-full border border-line bg-surface px-5 text-sm font-semibold text-ink transition hover:border-line-strong hover:bg-surface-2"
                >
                  인스타 원본 ↗
                </a>
              )}
              {mapUrl && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-1.5 rounded-full border border-line bg-surface px-5 text-sm font-semibold text-ink transition hover:border-line-strong hover:bg-surface-2"
                >
                  {isOverseas ? "구글맵 →" : "길찾기 →"}
                </a>
              )}
              {!isOverseas && (
                <Link
                  href={`/?cafe=${cafe.id}`}
                  className="inline-flex h-11 items-center gap-1.5 rounded-full bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-hover"
                >
                  View on Map
                </Link>
              )}
            </div>
          </div>
        </article>

        <p className="mt-4 text-center text-xs text-muted">
          사진과 장소 정보의 출처는{" "}
          <a
            href="https://www.instagram.com/green_sori/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            @green_sori
          </a>{" "}
          인스타그램입니다.
        </p>
      </main>
    </div>
  );
}
