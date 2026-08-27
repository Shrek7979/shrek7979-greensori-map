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
    <p className="mt-1.5 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[#a5906f] dark:text-[#8a7458]">
      <span>
        Today{" "}
        <span className="text-[#6f4e37] dark:text-[#d3bd9c]">
          {stats.today?.toLocaleString() ?? "–"}
        </span>
      </span>
      <span className="text-[#d8c8b0] dark:text-[#3a2e23]" aria-hidden="true">
        &bull;
      </span>
      <span>
        Total{" "}
        <span className="text-[#6f4e37] dark:text-[#d3bd9c]">
          {stats.total?.toLocaleString() ?? "–"}
        </span>
      </span>
    </p>
  );
}
