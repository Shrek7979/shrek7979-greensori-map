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
    <div className="flex items-baseline gap-2">
      <dt className="sr-only">방문자</dt>
      <dd className="text-xl font-bold tabular-nums tracking-tight text-ink">
        {stats.total?.toLocaleString() ?? "–"}
      </dd>
      <span className="text-sm text-muted">
        누적 방문 · 오늘 {stats.today?.toLocaleString() ?? "–"}
      </span>
    </div>
  );
}
