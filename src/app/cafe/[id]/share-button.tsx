"use client";

import { useState } from "react";

type Props = {
  title: string;
  text: string;
  /** 공유할 절대 경로 (예: /cafe/some-id) */
  path: string;
};

export default function ShareButton({ title, text, path }: Props) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}${path}`;
    // 모바일: 시스템 공유 시트 / 데스크톱: 클립보드 복사로 폴백
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        /* 사용자가 시트를 닫은 경우 등 — 조용히 무시 */
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard 미지원 환경 */
    }
  };

  return (
    <button
      onClick={share}
      className="inline-flex h-11 items-center gap-1.5 rounded-full border border-line bg-surface px-5 text-sm font-semibold text-ink transition hover:border-line-strong hover:bg-surface-2"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" />
        <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
      </svg>
      {copied ? "링크 복사됨!" : "공유"}
    </button>
  );
}
