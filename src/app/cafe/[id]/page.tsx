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
    <div className="flex min-h-screen flex-col bg-[#f7f2ea] font-sans dark:bg-[#17130f]">
      <header className="border-b border-[#e3d8c6] bg-[#f2e9d8] px-6 py-4 dark:border-[#2e251c] dark:bg-[#1d1712]">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link
            href={isOverseas ? "/" : `/?cafe=${cafe.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6f4e37] transition hover:text-[#5c4029] dark:text-[#d3bd9c]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            GreenSori Map
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <article className="overflow-hidden rounded-2xl border border-[#e9dfce] bg-white/80 shadow-sm dark:border-[#2e251c] dark:bg-[#201a14]">
          {cafe.imageUrl && (
            <div className="relative aspect-[16/10] bg-[#f0e6d5] dark:bg-[#2a2018]">
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#e6dcca] bg-[#fbf7f0] px-2.5 py-0.5 text-[11px] font-medium text-[#6b5842] dark:border-[#3a2e23] dark:bg-[#231b14] dark:text-[#c8b79c]"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: TAG_ACCENT[t] ?? "#8a7458" }}
                  />
                  {t}
                </span>
              ))}
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-[#2c2119] dark:text-[#f0e6d5]">
              {cafe.name}
            </h1>
            <p className="mt-1 text-sm text-[#a5906f] dark:text-[#8a7458]">
              {cafe.area} · {cafe.region}
            </p>

            <p className="mt-4 leading-relaxed text-[#5c4632] dark:text-[#c8b79c]">
              {cafe.description}
            </p>

            {(cafe.hours || cafe.menu) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {cafe.hours && (
                  <p className="inline-flex items-center gap-1.5 rounded-lg bg-[#f2e9d8] px-3 py-1.5 text-sm text-[#6f4e37] dark:bg-[#2a2018] dark:text-[#d3bd9c]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />
                      <polyline points="12 7 12 12 15.5 14" />
                    </svg>
                    {cafe.hours.text}
                  </p>
                )}
                {cafe.menu && (
                  <p className="inline-flex items-center gap-1.5 rounded-lg bg-[#f2e9d8] px-3 py-1.5 text-sm text-[#6f4e37] dark:bg-[#2a2018] dark:text-[#d3bd9c]">
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
              <blockquote className="mt-4 rounded-xl border border-[#e9dfce] bg-[#fbf7f0] px-4 py-3 dark:border-[#2e251c] dark:bg-[#1d1712]">
                <p className="text-sm leading-relaxed text-[#5c4632] dark:text-[#c8b79c]">
                  💬 {cafe.commentSummary}
                </p>
                <cite className="mt-1 block text-[11px] not-italic text-[#a5906f] dark:text-[#8a7458]">
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#dcc9ad] bg-white/80 px-4 py-1.5 text-sm font-semibold text-[#6f4e37] shadow-sm transition hover:bg-white dark:border-[#3a2e23] dark:bg-[#231b14]/70 dark:text-[#d3bd9c] dark:hover:bg-[#2a2018]"
                >
                  인스타 원본 ↗
                </a>
              )}
              {mapUrl && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#dcc9ad] bg-white/80 px-4 py-1.5 text-sm font-semibold text-[#6f4e37] shadow-sm transition hover:bg-white dark:border-[#3a2e23] dark:bg-[#231b14]/70 dark:text-[#d3bd9c] dark:hover:bg-[#2a2018]"
                >
                  {isOverseas ? "구글맵 →" : "길찾기 →"}
                </a>
              )}
              {!isOverseas && (
                <Link
                  href={`/?cafe=${cafe.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#6f4e37] px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5c4029]"
                >
                  지도에서 보기
                </Link>
              )}
            </div>
          </div>
        </article>

        <p className="mt-4 text-center text-xs text-[#a5906f] dark:text-[#8a7458]">
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
