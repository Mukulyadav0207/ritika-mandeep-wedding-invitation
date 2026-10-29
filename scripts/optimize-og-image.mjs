/**
 * Build public/og-image2.webp from a hand-off file in public/.
 * Prefer: og-image2.png|jpg (gitignored sources).
 *
 * Run: node scripts/optimize-og-image.mjs
 */
import { access, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "public/og-image2.webp");
const CANDIDATES = [
  "og-image2.png",
  "og-image2.jpg",
  "og-image2.jpeg",
  "og-image2.PNG",
  "og-image2.JPG",
  "og-image2.JPEG",
];

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

for (const name of CANDIDATES) {
  const input = path.join(ROOT, "public", name);
  if (!(await exists(input))) continue;

  await sharp(input)
    .rotate()
    .resize(1200, 630, { fit: "cover", position: "centre" })
    .webp({ quality: 92, effort: 6 })
    .toFile(OUT);

  const [inStat, outStat, meta] = await Promise.all([
    stat(input),
    stat(OUT),
    sharp(OUT).metadata(),
  ]);

  console.log(
    `Wrote public/og-image2.webp from ${name}: ${meta.width}x${meta.height} ${Math.round(inStat.size / 1024)}KB → ${Math.round(outStat.size / 1024)}KB`,
  );
  process.exit(0);
}

console.log(
  "No public/og-image2.png|jpg found. Add your design and re-run.",
);
process.exit(1);
