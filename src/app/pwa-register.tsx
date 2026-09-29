"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // 개발 서버에선 청크 파일명이 코드가 바뀌어도 그대로라, 캐시 우선 SW가 옛 JS를 계속 내준다 → 해제
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* 등록 실패는 무시 (앱 동작에는 영향 없음) */
    });
  }, []);
  return null;
}
