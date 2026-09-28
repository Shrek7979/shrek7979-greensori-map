import type { Cafe } from "@/types/cafe";

// "HH:MM" → 분 단위 숫자
function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 24 || min > 59) return null;
  return h * 60 + min;
}

// 현재 시각(KST) 기준 요일·분 — 서버/브라우저 어디서 돌아도 한국 시간으로 판정
function nowKST(date = new Date()) {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return { day: kst.getUTCDay(), minutes: kst.getUTCHours() * 60 + kst.getUTCMinutes() };
}

/**
 * 지금(KST) 영업중인지 판정. schedule이 없으면 null(알 수 없음).
 * 자정 넘김(close < open, 예: 20:00~02:00)은 다음날 새벽 마감으로 처리.
 */
export function isOpenNow(cafe: Cafe, date = new Date()): boolean | null {
  const schedule = cafe.hours?.schedule;
  if (!schedule || schedule.length === 0) return null;
  const { day, minutes } = nowKST(date);
  const prevDay = (day + 6) % 7;

  for (const slot of schedule) {
    const open = toMinutes(slot.open);
    const close = toMinutes(slot.close);
    if (open === null || close === null) continue;
    if (close > open) {
      // 같은 날 안에서 여닫는 일반적인 경우
      if (slot.days.includes(day) && minutes >= open && minutes < close) return true;
    } else {
      // 자정 넘김: 오늘 open 이후이거나, 어제 시작한 영업이 아직 안 끝난 새벽
      if (slot.days.includes(day) && minutes >= open) return true;
      if (slot.days.includes(prevDay) && minutes < close) return true;
    }
  }
  return false;
}

/** 영업시간 정보(schedule)가 있는 카페인지 */
export function hasSchedule(cafe: Cafe): boolean {
  return (cafe.hours?.schedule?.length ?? 0) > 0;
}
