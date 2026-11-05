// 디자인용 이미지를 OpenAI로 생성해 public/design 에 저장합니다.
// 사용법: node scripts/generate-design-images.mjs [--dry-run] [--force] [이미지이름...]
// 키는 .env.openai 에서만 읽고, 사이트 코드나 Vercel에는 들어가지 않습니다.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "design");

const STYLE =
  "Warm hand-painted gouache illustration of a cozy Korean specialty coffee shop mood. " +
  "Palette limited to cream #f7f2ea, latte #eaddc8, caramel #c98a2f, coffee brown #6f4e37 and espresso #3d2c1e. " +
  "Soft morning light, quiet and calm, generous empty space. " +
  "No text, no letters, no logos, no people, no brand marks.";

const ICON_STYLE =
  "Square app icon artwork filling the entire canvas edge to edge, with a flat solid warm latte #eaddc8 background and no rounded corners, no border, no frame, no drop shadow. " +
  "Warm hand-painted gouache look, palette limited to cream #f7f2ea, caramel #c98a2f, coffee brown #6f4e37 and espresso #3d2c1e, with one small muted olive leaf. " +
  "No text, no letters, no logos, no people, no brand marks.";

const IMAGES = [
  {
    name: "header-light",
    size: "1536x1024",
    prompt: `${STYLE} Wide banner scene: a wooden cafe counter with a pour-over dripper, ceramic cups and a small plant placed on the far right third. The left two thirds stay a nearly plain pale cream wall so dark text can sit on top.`,
  },
  {
    name: "header-dark",
    size: "1536x1024",
    prompt: `${STYLE} Evening version with deep espresso tones: a wooden cafe counter with a pour-over dripper, ceramic cups and a warm pendant lamp on the far right third. The left two thirds stay a nearly plain dark brown wall so light text can sit on top.`,
  },
  {
    name: "footer-pattern",
    size: "1024x1024",
    prompt: `${STYLE} Seamless, very subtle tileable pattern on a cream background: sparse line drawings of coffee beans, cups and leaves in a slightly darker cream, low contrast so text stays readable on top.`,
  },
  {
    name: "app-icon",
    size: "1024x1024",
    dir: "assets/icons",
    prompt: `${ICON_STYLE} Behind the pin, the latte background is a simple top-down town map that reaches every edge of the canvas: a few wide cream streets crossing at angles, and one curving muted olive river. The map stays soft and low contrast with no labels. A single bold espresso-brown map location pin centered, taking up the middle 60 percent of the canvas. Inside the round head of the pin sits a cream ceramic coffee cup seen from slightly above with a simple latte art heart, and one small olive leaf beside it. The pin casts a small soft shadow on the map at its tip. Clean simple shapes that stay readable at small sizes.`,
  },
  {
    name: "icon-2-paper-map",
    size: "1024x1024",
    dir: "assets/icons/options",
    prompt: `${ICON_STYLE} Exception: the background is the map itself. A folded paper map with visible fold creases fills the whole canvas, showing a few simple cream streets and one curving olive river with no labels. A cream ceramic coffee cup seen from directly above sits in the middle taking up 45 percent of the canvas, with a round caramel coffee ring stain beside it and a small espresso-brown route dot. Clean simple shapes.`,
  },
  {
    name: "icon-3-latte-pin",
    size: "1024x1024",
    dir: "assets/icons/options",
    prompt: `${ICON_STYLE} A coffee cup seen from directly above, centered and filling 75 percent of the canvas, cream ceramic rim with a small handle at the right on a soft espresso-brown saucer. The latte art on the caramel coffee surface forms one clear, bold map location pin shape in milky cream, teardrop with a round hole, not a heart. One bold simple idea, readable at very small sizes.`,
  },
  {
    name: "icon-4-arch-window",
    size: "1024x1024",
    dir: "assets/icons/options",
    prompt: `${ICON_STYLE} Exception: the background is a warm espresso-brown cafe wall. A tall rounded arch window centered, taking up 70 percent of the canvas height, with a thin wooden frame. Through the arch you see a calm top-down neighbourhood map in cream and latte with a winding road and a small caramel location pin. On the wooden sill sits one small cream coffee cup. Quiet, atmospheric, simple shapes.`,
  },
  {
    name: "icon-5-stamp",
    size: "1024x1024",
    dir: "assets/icons/options",
    prompt: `${ICON_STYLE} A round travel passport stamp centered, taking up 75 percent of the canvas, drawn in espresso-brown ink on the latte background with slightly worn hand-stamped ink texture. A thick circular double ring border with small dots instead of any lettering. In the center a simple map pin containing a small coffee cup silhouette. Bold and simple, no text anywhere.`,
  },
  {
    name: "favicon",
    size: "1024x1024",
    dir: "assets/icons",
    prompt: `${ICON_STYLE} Extremely simple flat symbol for a 32 pixel browser favicon: one thick solid espresso-brown map pin filling 80 percent of the canvas, with a single plain cream coffee cup silhouette with a handle in the round head of the pin. No leaf, no latte art, no fine detail, no texture.`,
  },
];

function readKey() {
  const file = join(root, ".env.openai");
  if (!existsSync(file)) return "";
  const line = readFileSync(file, "utf8")
    .split(/\r?\n/)
    .find((l) => l.startsWith("OPENAI_API_KEY="));
  return line ? line.slice("OPENAI_API_KEY=".length).trim().replace(/^["']|["']$/g, "") : "";
}

async function generate(image, key, model) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt: image.prompt,
      size: image.size,
      quality: "medium",
      output_format: "webp",
      output_compression: 80,
      n: 1,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${res.status} ${body?.error?.code ?? ""} ${body?.error?.message ?? ""}`.trim());
  }
  const b64 = body?.data?.[0]?.b64_json;
  if (!b64) throw new Error("응답에 이미지가 없습니다");
  return Buffer.from(b64, "base64");
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");
const wanted = args.filter((a) => !a.startsWith("--"));
const targets = wanted.length ? IMAGES.filter((i) => wanted.includes(i.name)) : IMAGES;
const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-sunburst";

const key = readKey();
if (!dryRun && !key) {
  console.error(".env.openai 의 OPENAI_API_KEY= 뒤에 키를 넣고 저장해 주세요.");
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
let failed = 0;
for (const image of targets) {
  const dir = image.dir ? join(root, image.dir) : outDir;
  mkdirSync(dir, { recursive: true });
  const out = join(dir, `${image.name}.webp`);
  if (existsSync(out) && !force) {
    console.log(`건너뜀 (이미 있음): ${image.name}`);
    continue;
  }
  if (dryRun) {
    console.log(`생성 예정: ${image.name} ${image.size} (${model})`);
    continue;
  }
  try {
    const data = await generate(image, key, model);
    writeFileSync(out, data);
    console.log(`저장: ${image.dir ?? "public/design"}/${image.name}.webp (${Math.round(data.length / 1024)}KB)`);
  } catch (err) {
    failed += 1;
    console.error(`실패: ${image.name} - ${err.message}`);
  }
}
process.exit(failed ? 1 : 0);
