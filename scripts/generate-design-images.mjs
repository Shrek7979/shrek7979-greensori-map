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
  const out = join(outDir, `${image.name}.webp`);
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
    console.log(`저장: public/design/${image.name}.webp (${Math.round(data.length / 1024)}KB)`);
  } catch (err) {
    failed += 1;
    console.error(`실패: ${image.name} - ${err.message}`);
  }
}
process.exit(failed ? 1 : 0);
