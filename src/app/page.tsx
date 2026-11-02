import KakaoMap from "@/components/KakaoMap";
import { cafes } from "@/data/cafes";
import Image from "next/image";
import Link from "next/link";
import InstallButton from "./install-button";
import VisitorCounter from "./visitor-counter";

const INSTAGRAM_URL = "https://www.instagram.com/green_sori/";

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

export default function Home() {
  const regionCount = new Set(
    cafes.filter((c) => c.region !== "해외").map((c) => c.region)
  ).size;
  const stats = [
    { value: cafes.length.toLocaleString(), label: "큐레이션 카페" },
    { value: String(regionCount), label: "국내 지역" },
      ];

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="border-b border-line/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2.5" aria-label="GreenSori Map 홈">
            <Image
              src="/green-sori-profile.jpg"
              alt=""
              width={32}
              height={32}
              priority
              className="h-8 w-8 rounded-full object-cover ring-1 ring-line"
            />
            <span className="font-display text-[22px] leading-none tracking-tight text-ink">
              GreenSori <span className="italic text-brand">Map</span>
            </span>
          </a>
          <div className="ml-auto flex items-center gap-2">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="green_sori 인스타그램 열기"
              className="hidden h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-ink-2 transition hover:bg-surface-2 sm:inline-flex"
            >
              <InstagramIcon />
              @green_sori
            </a>
            <InstallButton />
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 pb-5 pt-7 sm:px-6 sm:pb-8 sm:pt-14">
        <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
          <span className="h-px w-6 bg-brand" aria-hidden="true" />
          Curated by @green_sori
        </p>
        <h1 className="max-w-2xl text-[28px] font-bold leading-[1.25] tracking-[-0.03em] text-ink sm:text-[40px]">
          그린소리가 다녀온
          <br />
          카페와 공간의 지도
        </h1>
        <p className="mt-3 hidden max-w-xl text-base leading-relaxed text-muted sm:block">
          인스타그램에 소개된 카페를 지도에서 찾아보고, 지금 영업 중인 곳과 내 주변 카페를 확인하세요.
        </p>
        <dl className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 sm:mt-6 sm:gap-x-8">
          {stats.map((s) => (
            <div key={s.label} className="flex items-baseline gap-2">
              <dt className="sr-only">{s.label}</dt>
              <dd className="text-xl font-bold tabular-nums tracking-tight text-ink">{s.value}</dd>
              <span className="text-sm text-muted" aria-hidden="true">
                {s.label}
              </span>
            </div>
          ))}
          <VisitorCounter />
        </dl>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12 sm:px-6">
        <KakaoMap cafes={cafes} />
      </main>

      <footer className="border-t border-line/70 bg-surface-2/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <p className="font-display text-2xl tracking-tight text-ink">
              GreenSori <span className="italic text-brand">Map</span>
            </p>
            <p className="mt-1 font-display text-base italic text-muted">
              Coffee, Spaces &amp; Travel
            </p>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              사진과 장소 정보의 출처는 @green_sori 인스타그램입니다.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-ink-2 transition hover:text-brand"
            >
              <InstagramIcon />
              Instagram
            </a>
            <Link
              href="/privacy"
              className="text-muted transition hover:text-ink-2"
            >
              개인정보처리방침
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
