"use client";

import { useEffect, useState } from "react";

type VisitStats = {
  configured: boolean;
  today: number | null;
  total: number | null;
};

export default function VisitorCounter() {
  const [stats, setStats] = useState<VisitStats | null>(null);

  useEffect(() => {
    // 세션(탭) 당 한 번만 카운트 — 새로고침 반복으로 인한 중복 집계 방지
    const alreadyCounted = sessionStorage.getItem("gs_visit_counted");

    const request = alreadyCounted
      ? fetch("/api/visit", { method: "GET" })
      : fetch("/api/visit", { method: "POST" });

    if (!alreadyCounted) {
      sessionStorage.setItem("gs_visit_counted", "1");
    }

    request
      .then((res) => res.json())
      .then((data: VisitStats) => setStats(data))
      .catch(() => setStats(null));
  }, []);

  if (!stats || !stats.configured) return null;

  return (
    <p className="mt-0.5 text-xs text-[#a5906f] dark:text-[#8a7458]">
      오늘 방문 {stats.today?.toLocaleString() ?? "-"} · 전체 방문{" "}
      {stats.total?.toLocaleString() ?? "-"}
    </p>
  );
}
