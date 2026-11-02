import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보처리방침 | GreenSori Map",
  description: "GreenSori Map 개인정보처리방침",
};

const sectionClassName = "space-y-3";
const headingClassName =
  "text-lg font-semibold text-[#4a3424] dark:text-[#eadbc6]";
const paragraphClassName =
  "text-sm leading-7 text-[#6b5842] dark:text-[#bca98d]";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7f2ea] px-6 py-10 dark:bg-[#17130f]">
      <article className="mx-auto max-w-3xl rounded-2xl border border-[#e3d8c6] bg-white/70 p-6 shadow-sm sm:p-10 dark:border-[#2e251c] dark:bg-[#1d1712]">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-[#6f4e37] hover:underline dark:text-[#d3bd9c]"
        >
          ← 지도 돌아가기
        </Link>

        <header className="mb-10 mt-6 border-b border-[#e3d8c6] pb-6 dark:border-[#2e251c]">
          <h1 className="text-3xl font-semibold tracking-tight text-[#3d2c1e] dark:text-[#f0e6d5]">
            개인정보처리방침
          </h1>
          <p className="mt-3 text-sm text-[#8a7458] dark:text-[#9a866a]">
            시행일: 2026년 8월 29일
          </p>
        </header>

        <div className="space-y-9">
          <section className={sectionClassName}>
            <h2 className={headingClassName}>1. 기본 원칙</h2>
            <p className={paragraphClassName}>
              GreenSori Map(이하 &ldquo;서비스&rdquo;)은 회원가입을 요구하지
              않습니다. 서비스 운영에 필요한 최소한의 정보만 처리하며, 위치
              기능은 이용자가 직접 요청한 경우에만 사용합니다.
            </p>
          </section>

          <section className={sectionClassName}>
            <h2 className={headingClassName}>2. 처리하는 정보와 이용 목적</h2>
            <ul className="list-disc space-y-3 pl-5 text-sm leading-7 text-[#6b5842] dark:text-[#bca98d]">
              <li>
                <strong>현재 위치:</strong> &lsquo;내 주변&rsquo; 기능을 선택했을
                때 거리 계산과 지도 표시를 위해 사용합니다. GreenSori Map
                운영 서버에는 현재 위치를 별도로 저장하지 않습니다.
              </li>
              <li>
                <strong>즐겨찾기·방문 기록:</strong> 선택한 카페 정보는 이용자의
                기기 저장공간에만 저장되며 운영 서버로 전송하지 않습니다.
              </li>
              <li>
                <strong>방문 통계:</strong> 오늘 및 전체 방문 횟수를 제공하기
                위해 날짜별·누적 방문 수를 집계합니다. 이 집계에는 이름이나
                계정과 같은 직접 식별정보를 저장하지 않습니다.
              </li>
              <li>
                <strong>서비스 이용 정보:</strong> 서비스 개선과 오류 확인을 위해
                방문 페이지, 브라우저·기기 유형 및 일반적인 접속 정보가 분석
                서비스에서 처리될 수 있습니다.
              </li>
            </ul>
          </section>

          <section className={sectionClassName}>
            <h2 className={headingClassName}>3. 외부 서비스</h2>
            <p className={paragraphClassName}>
              지도 표시에는 Kakao Maps, 방문 분석에는 Vercel Analytics, 방문 수
              저장에는 Upstash Redis를 사용합니다. 인스타그램이나 Google Maps
              등 외부 링크를 선택하면 해당 서비스의 개인정보처리방침이
              적용됩니다.
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <li>
                <a
                  href="https://www.kakao.com/policy/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#6f4e37] underline underline-offset-4 dark:text-[#d3bd9c]"
                >
                  Kakao 개인정보처리방침
                </a>
              </li>
              <li>
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#6f4e37] underline underline-offset-4 dark:text-[#d3bd9c]"
                >
                  Vercel 개인정보처리방침
                </a>
              </li>
              <li>
                <a
                  href="https://upstash.com/trust/privacy.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#6f4e37] underline underline-offset-4 dark:text-[#d3bd9c]"
                >
                  Upstash 개인정보처리방침
                </a>
              </li>
            </ul>
          </section>

          <section className={sectionClassName}>
            <h2 className={headingClassName}>4. 보관 기간과 삭제</h2>
            <ul className="list-disc space-y-3 pl-5 text-sm leading-7 text-[#6b5842] dark:text-[#bca98d]">
              <li>
                즐겨찾기·방문 기록은 이용자가 앱 또는 브라우저 저장공간을
                삭제할 때까지 기기에 보관됩니다.
              </li>
              <li>날짜별 방문 수는 집계 후 약 2일간 보관됩니다.</li>
              <li>
                전체 방문 수는 누적 통계를 위해 보관되며 개인별 이용 기록으로
                구성되지 않습니다.
              </li>
              <li>
                외부 서비스가 처리하는 정보는 각 서비스의 보관 정책을
                따릅니다.
              </li>
            </ul>
          </section>

          <section className={sectionClassName}>
            <h2 className={headingClassName}>5. 위치 권한</h2>
            <p className={paragraphClassName}>
              위치 권한은 선택 사항이며 허용하지 않아도 위치 기반 정렬을 제외한
              지도 기능을 이용할 수 있습니다. 권한은 안드로이드 앱 설정 또는
              브라우저 사이트 설정에서 언제든 철회할 수 있습니다.
            </p>
          </section>

          <section className={sectionClassName}>
            <h2 className={headingClassName}>6. 방침 변경</h2>
            <p className={paragraphClassName}>
              기능이나 관련 정책이 변경되면 이 페이지를 통해 변경 내용과
              시행일을 안내합니다.
            </p>
          </section>

          <section className={sectionClassName}>
            <h2 className={headingClassName}>7. 문의</h2>
            <p className={paragraphClassName}>
              개인정보 관련 문의는 Instagram{" "}
              <a
                href="https://www.instagram.com/green_sori/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#6f4e37] underline underline-offset-4 dark:text-[#d3bd9c]"
              >
                @green_sori
              </a>
              로 접수해 주세요.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
