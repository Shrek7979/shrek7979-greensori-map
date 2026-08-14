import { readFileSync } from "fs";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "GreenSori Map — cafes, spaces & travel across Korea";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 지도 패널의 귀여운 물방울 핀들 (앱 테마 팔레트)
const PINS: { x: number; y: number; c: string; s: number }[] = [
  { x: 60, y: 70, c: "#8b5e3c", s: 40 },
  { x: 300, y: 60, c: "#c07a88", s: 36 },
  { x: 430, y: 150, c: "#c99a4e", s: 40 },
  { x: 120, y: 250, c: "#7d9155", s: 36 },
  { x: 330, y: 300, c: "#9b7aa3", s: 40 },
  { x: 470, y: 330, c: "#5a9089", s: 34 },
  { x: 90, y: 400, c: "#c06b45", s: 38 },
  { x: 250, y: 440, c: "#63719a", s: 36 },
];

function cupSrc(color: string) {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='44' viewBox='0 0 40 44'>` +
    `<ellipse cx='20' cy='41.5' rx='11' ry='2.4' fill='rgba(60,40,25,0.20)'/>` +
    `<path d='M15 3.5c0 2-2 2-2 4s2 2 2 4' fill='none' stroke='#ffffff' stroke-width='2' stroke-linecap='round' opacity='0.85'/>` +
    `<path d='M25 3.5c0 2-2 2-2 4s2 2 2 4' fill='none' stroke='#ffffff' stroke-width='2' stroke-linecap='round' opacity='0.85'/>` +
    `<ellipse cx='20' cy='37' rx='14' ry='3.4' fill='${color}' stroke='#ffffff' stroke-width='2.2'/>` +
    `<path d='M29 20c7 0 7 11 0 11' fill='none' stroke='#ffffff' stroke-width='6.5' stroke-linecap='round'/>` +
    `<path d='M29 20c7 0 7 11 0 11' fill='none' stroke='${color}' stroke-width='3.5' stroke-linecap='round'/>` +
    `<path d='M9 16h22l-1.6 16c-.26 2.6-2.45 4.6-5.1 4.6h-8.6c-2.65 0-4.84-2-5.1-4.6z' fill='${color}' stroke='#ffffff' stroke-width='2.4' stroke-linejoin='round'/>` +
    `<ellipse cx='20' cy='16' rx='11' ry='2.8' fill='#ffffff'/>` +
    `</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function Pin({ x, y, c, s }: { x: number; y: number; c: string; s: number }) {
  const h = Math.round((s * 44) / 40);
  return (
    <img
      src={cupSrc(c)}
      width={s}
      height={h}
      style={{ position: "absolute", left: x, top: y }}
    />
  );
}

export default async function Image() {
  const profile = readFileSync(new URL("./og-profile.jpg", import.meta.url));
  const profileSrc = `data:image/jpeg;base64,${profile.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #f5ecdb 0%, #efe4cf 100%)",
        }}
      >
        {/* 왼쪽: 프로필 + 제목 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: 588,
            padding: "0 60px",
          }}
        >
          <img
            src={profileSrc}
            width={128}
            height={128}
            style={{
              borderRadius: 64,
              border: "5px solid #ffffff",
              boxShadow: "0 6px 16px rgba(90,60,35,0.2)",
            }}
          />
          <div
            style={{
              marginTop: 30,
              fontSize: 68,
              fontWeight: 700,
              color: "#3d2c1e",
              letterSpacing: -1,
            }}
          >
            GreenSori Map
          </div>
          <div style={{ marginTop: 12, fontSize: 30, color: "#8a7458" }}>
            Cafes · Spaces · Travel
          </div>
          <div style={{ marginTop: 30, display: "flex" }}>
            <div
              style={{
                display: "flex",
                background: "#6f4e37",
                color: "#ffffff",
                fontSize: 26,
                fontWeight: 600,
                padding: "10px 24px",
                borderRadius: 9999,
                boxShadow: "0 4px 10px rgba(111,78,55,0.3)",
              }}
            >
              300+ places across Korea
            </div>
          </div>
        </div>

        {/* 오른쪽: 귀여운 지도 패널 */}
        <div style={{ flex: 1, display: "flex", padding: "46px 46px 46px 0" }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              position: "relative",
              borderRadius: 32,
              background: "#eaf1e2",
              border: "3px solid #ffffff",
              boxShadow: "0 10px 30px rgba(80,60,35,0.18)",
              overflow: "hidden",
            }}
          >
            {/* 물 (연못) */}
            <div
              style={{
                position: "absolute",
                left: -70,
                bottom: -80,
                width: 300,
                height: 260,
                borderRadius: 140,
                background: "#cfe3ec",
              }}
            />
            {/* 공원 */}
            <div
              style={{
                position: "absolute",
                right: -60,
                top: -50,
                width: 240,
                height: 240,
                borderRadius: 120,
                background: "#d7e6c6",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 150,
                bottom: 40,
                width: 120,
                height: 120,
                borderRadius: 60,
                background: "#d7e6c6",
              }}
            />
            {/* 도로 */}
            <div
              style={{
                position: "absolute",
                left: -60,
                top: 150,
                width: 720,
                height: 22,
                borderRadius: 12,
                background: "#fbf5e9",
                transform: "rotate(18deg)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 40,
                top: 360,
                width: 720,
                height: 20,
                borderRadius: 12,
                background: "#fbf5e9",
                transform: "rotate(-12deg)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 300,
                top: -90,
                width: 22,
                height: 780,
                borderRadius: 12,
                background: "#fbf5e9",
                transform: "rotate(14deg)",
              }}
            />

            {/* 핀들 */}
            {PINS.map((p, i) => (
              <Pin key={i} x={p.x} y={p.y} c={p.c} s={p.s} />
            ))}

            {/* 클러스터 버블 */}
            <div
              style={{
                position: "absolute",
                left: 190,
                top: 150,
                width: 82,
                height: 82,
                borderRadius: 41,
                background: "#6f4e37",
                border: "5px solid #ffffff",
                color: "#ffffff",
                fontSize: 32,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 16px rgba(70,50,30,0.28)",
              }}
            >
              62
            </div>
            <div
              style={{
                position: "absolute",
                left: 380,
                top: 420,
                width: 62,
                height: 62,
                borderRadius: 31,
                background: "#9a5f37",
                border: "5px solid #ffffff",
                color: "#ffffff",
                fontSize: 24,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 16px rgba(70,50,30,0.28)",
              }}
            >
              18
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
