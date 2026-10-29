/**
 * Convert source PNGs to WebP assets used by the invitation UI.
 * Run: node scripts/optimize-wedding-images.mjs
 */
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");

const jobs = [
  {
    input: "public/assets/images/folded-card/folded-card.png",
    output: "public/assets/images/folded-card/folded-card.webp",
    options: { quality: 88, alphaQuality: 90, effort: 6 },
  },
  {
    input: "public/assets/images/bg/invite-logo.png",
    output: "public/assets/images/bg/invite-logo.webp",
    options: { quality: 90, alphaQuality: 90, effort: 6 },
  },
  {
    input: "public/assets/images/envlope/ribbon-seal.png",
    output: "public/assets/images/envlope/ribbon-seal.webp",
    options: { quality: 88, alphaQuality: 90, effort: 6 },
  },
  {
    input: "public/assets/images/gallery/img3.jpeg",
    output: "public/assets/images/gallery/img3.webp",
    resize: { width: 960, height: 1440 },
    options: { quality: 85, effort: 6 },
  },
  {
    input: "public/assets/images/gallery/img4.jpeg",
    output: "public/assets/images/gallery/img4.webp",
    resize: { width: 960, height: 1280 },
    options: { quality: 85, effort: 6 },
  },
  {
    input: "public/assets/images/bg/mr-photo.jpeg",
    output: "public/assets/images/bg/mr-photo.webp",
    resize: { width: 1024, height: 1536 },
    options: { quality: 86, effort: 6 },
  },
  {
    input: "public/assets/images/events/pheras1.png",
    output: "public/assets/images/events/barat.webp",
    options: { quality: 86, effort: 6 },
  },
  {
    input: "public/assets/images/events/pheras2.png",
    output: "public/assets/images/events/barat-night.webp",
    options: { quality: 86, effort: 6 },
  },
];

async function optimize({ input, output, options, resize }) {
  const inPath = path.join(ROOT, input);
  const outPath = path.join(ROOT, output);
  await mkdir(path.dirname(outPath), { recursive: true });

  let image = sharp(inPath).rotate();
  if (resize) {
    image = image.resize(resize.width, resize.height, {
      fit: "cover",
      position: "centre",
    });
  }
  const meta = await image.metadata();

  await image.webp(options).toFile(outPath);

  const inStat = await stat(inPath);
  const outStat = await stat(outPath);
  const outBytes = outStat.size;

  console.log(
    `${output}: ${meta.width}x${meta.height} ${Math.round(inStat.size / 1024)}KB → ${Math.round(outBytes / 1024)}KB`,
  );
}

for (const job of jobs) {
  await optimize(job);
}
