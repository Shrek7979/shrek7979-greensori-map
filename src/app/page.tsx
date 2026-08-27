import KakaoMap from "@/components/KakaoMap";
import { cafes } from "@/data/cafes";
import InstallButton from "./install-button";
import VisitorCounter from "./visitor-counter";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7f2ea] font-sans dark:bg-[#17130f]">
      <header className="border-b border-[#e3d8c6] bg-[#f2e9d8] px-6 py-7 dark:border-[#2e251c] dark:bg-[#1d1712]">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <a
            href="https://www.instagram.com/green_sori/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="green_sori 인스타그램 열기"
            className="shrink-0"
          >
            <img
              src="/green-sori-profile.jpg"
              alt="green_sori 프로필"
              width={48}
              height={48}
              className="h-12 w-12 rounded-full border border-[#d8c8b0] object-cover transition-opacity hover:opacity-80 dark:border-[#3a2e23]"
            />
          </a>
          <div className="min-w-0">
            <h1
              className="text-2xl font-medium tracking-tight text-[#3d2c1e] dark:text-[#f0e6d5]"
              style={{ fontFamily: "var(--font-fredoka)" }}
            >
              GreenSori Map
            </h1>
            <p className="mt-0.5 text-sm text-[#8a7458] dark:text-[#b09b7e]">
              그린소리가 담은 카페 · 공간 · 여행의 기록
            </p>
            <VisitorCounter />
          </div>
          <div className="ml-auto shrink-0">
            <InstallButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        <KakaoMap cafes={cafes} />
      </main>

      <footer className="border-t border-[#e3d8c6] bg-[#f2e9d8] px-6 py-8 dark:border-[#2e251c] dark:bg-[#1d1712]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-center">
          <p className="font-serif text-base italic text-[#6f4e37] dark:text-[#c8a77e]">
            &ldquo;Coffee, Spaces &amp; Travel&rdquo;
          </p>
          <a
            href="https://www.instagram.com/green_sori/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[#d8c8b0] bg-[#f7f2ea] px-4 py-1.5 text-sm text-[#5c4632] transition-colors hover:bg-[#eaddc8] dark:border-[#3a2e23] dark:bg-[#231b14] dark:text-[#d3bd9c] dark:hover:bg-[#2c2219]"
          >
            <svg
              width="16"
              height="16"
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
            @green_sori
          </a>
          <p className="text-xs text-[#a5906f] dark:text-[#8a7458]">
            사진과 장소 정보의 출처는 @green_sori 인스타그램입니다.
          </p>
        </div>
      </footer>
    </div>
  );
}
