import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";

function getRedis() {
  // Vercel Marketplace의 Upstash Redis 통합은 (구)Vercel KV 호환 이름으로
  // 환경변수를 주입한다 (KV_REST_API_URL / KV_REST_API_TOKEN).
  // 통합 방식에 따라 UPSTASH_REDIS_REST_* 이름이 쓰이는 경우도 있어 둘 다 지원.
  const url =
    process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

// KST(UTC+9) 기준 오늘 날짜 키
function todayKeyKST() {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  return `visits:day:${y}-${m}-${d}`;
}

export async function POST() {
  const redis = getRedis();
  if (!redis) {
    // Redis 미설정 상태(로컬 개발 등)에서는 카운트 없이 조용히 무시
    return NextResponse.json({ configured: false, today: null, total: null });
  }

  const dayKey = todayKeyKST();
  const [total, today] = await Promise.all([
    redis.incr("visits:total"),
    redis.incr(dayKey),
  ]);
  // 하루 카운터는 이틀 뒤 자동 만료(키 무한 누적 방지)
  await redis.expire(dayKey, 60 * 60 * 24 * 2);

  return NextResponse.json({ configured: true, today, total });
}

export async function GET() {
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ configured: false, today: null, total: null });
  }

  const dayKey = todayKeyKST();
  const [total, today] = await Promise.all([
    redis.get<number>("visits:total"),
    redis.get<number>(dayKey),
  ]);

  return NextResponse.json({
    configured: true,
    today: today ?? 0,
    total: total ?? 0,
  });
}
