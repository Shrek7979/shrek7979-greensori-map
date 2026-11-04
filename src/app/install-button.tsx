"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Device = "ios" | "android" | "inapp" | "desktop";

function getStoredPrompt(): BeforeInstallPromptEvent | null {
  return (
    (window as unknown as { __pwaPrompt?: BeforeInstallPromptEvent })
      .__pwaPrompt ?? null
  );
}

export default function InstallButton() {
  const [show, setShow] = useState(false);
  const [hasPrompt, setHasPrompt] = useState(false);
  const [help, setHelp] = useState<null | Device>(null);
  const [device, setDevice] = useState<Device>("desktop");

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return; // 이미 앱으로 실행 중이면 숨김

    const ua = navigator.userAgent;
    // iPadOS 사파리는 Mac으로 표시되므로 터치 지원 여부로 구분
    const ios =
      /iphone|ipad|ipod/i.test(ua) ||
      (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    const android = /android/i.test(ua);
    // 인스타·카카오톡 등 앱 안 브라우저는 홈 화면 추가가 안 되므로 외부 브라우저로 안내
    const inApp = /instagram|fban|fbav|kakaotalk|line\//i.test(ua);
    setDevice(inApp ? "inapp" : ios ? "ios" : android ? "android" : "desktop");

    setHasPrompt(!!getStoredPrompt());
    // 프롬프트가 없어도 기기별 수동 안내를 보여줄 수 있으므로 항상 노출
    setShow(true);

    const onReady = () => {
      setHasPrompt(true);
      setShow(true);
    };
    const onInstalled = () => {
      setShow(false);
      setHelp(null);
    };
    window.addEventListener("pwaPromptReady", onReady);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("pwaPromptReady", onReady);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!show) return null;

  const onClick = async () => {
    const stored = getStoredPrompt();
    if (stored) {
      setHelp(null);
      await stored.prompt();
      const choice = await stored.userChoice;
      (window as unknown as { __pwaPrompt?: unknown }).__pwaPrompt = null;
      setHasPrompt(false);
      if (choice.outcome === "accepted") setShow(false);
      return;
    }
    // 프롬프트가 없으면 기기별 수동 안내
    setHelp((cur) => (cur ? null : device));
  };

  return (
    <div className="relative shrink-0">
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#d8c8b0] bg-[#f7f2ea] px-3.5 py-2 text-sm font-semibold text-[#5c4632] shadow-sm transition hover:bg-[#eaddc8] dark:border-[#3a2e23] dark:bg-[#231b14] dark:text-[#d3bd9c] dark:hover:bg-[#2c2219]"
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
          aria-hidden="true"
        >
          <path d="M12 3v12" />
          <path d="M7 10l5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
        {device === "desktop" ? "바로가기 추가" : "홈 추가"}
      </button>

      {help && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-[#e3d8c6] bg-white p-3 text-xs leading-relaxed text-[#5c4632] shadow-lg dark:border-[#3a2e23] dark:bg-[#231b14] dark:text-[#d3bd9c]">
          <div className="mb-1 font-semibold">
            {help === "desktop" ? "바탕화면에 바로가기 추가" : "홈 화면에 추가하기"}
          </div>
          {help === "ios" ? (
            <>
              사파리 하단의 <b>공유 버튼</b>(⬆️)을 누른 뒤 <b>&lsquo;홈 화면에
              추가&rsquo;</b>를 선택하세요.
            </>
          ) : help === "android" ? (
            <>
              크롬 우측 상단 <b>⋮ 메뉴</b>를 눌러 <b>&lsquo;앱 설치&rsquo;</b>
              또는 <b>&lsquo;홈 화면에 추가&rsquo;</b>를 선택하세요.
            </>
          ) : help === "inapp" ? (
            <>
              앱 안 브라우저에서는 추가할 수 없어요. 메뉴(<b>⋯</b>)에서{" "}
              <b>&lsquo;외부 브라우저로 열기&rsquo;</b>를 누른 뒤 다시 시도해
              주세요.
            </>
          ) : (
            <>
              크롬·엣지는 주소창 오른쪽의 <b>설치 아이콘</b>이나 브라우저 메뉴의{" "}
              <b>&lsquo;앱 설치&rsquo;</b>를 선택하세요. 다른 브라우저는 주소창
              왼쪽 아이콘을 바탕화면으로 끌어다 놓으면 바로가기가 만들어져요.
            </>
          )}
          <button
            onClick={() => setHelp(null)}
            className="mt-2 block text-[#8b5e3c] underline underline-offset-2"
          >
            닫기
          </button>
        </div>
      )}
    </div>
  );
}
