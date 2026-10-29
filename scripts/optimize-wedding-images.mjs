/**
 * Convert raster sources under public/ to WebP assets used by the site.
 * Sources (*.png, *.jpg, *.jpeg) are gitignored; commit the .webp outputs only.
 *
 * Run: node scripts/optimize-wedding-images.mjs
 * Then: node scripts/optimize-og-image.mjs  (or generate-og-image.py fallback)
 */
import { readdir, stat, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const PUBLIC = path.join(ROOT, "public");

const SOURCE_RE = /\.(png|jpe?g)$/i;

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join("/");
}

async function walk(dir, files = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, files);
    else if (entry.name === "favicon.png") continue;
    else if (SOURCE_RE.test(entry.name)) files.push(full);
  }
  return files;
}

const GALLERY_TARGETS = {
  img1: [960, 1440],
  img2: [960, 1440],
  img3: [960, 1440],
  img4: [960, 1280],
  img5: [960, 1440],
  img6: [960, 1344],
};

function galleryResize(relativePath, meta) {
  const base = path
    .basename(relativePath, path.extname(relativePath))
    .toLowerCase();
  const target = GALLERY_TARGETS[base];
  if (target) return { width: target[0], height: target[1] };
  return maxWidthResize(meta, 1200);
}

function mrPhotoResize() {
  return { width: 1024, height: 1536 };
}

function maxWidthResize(meta, maxWidth) {
  if (!meta.width || meta.width <= maxWidth) return null;
  const height = Math.round((meta.height / meta.width) * maxWidth);
  return { width: maxWidth, height };
}

function pickResize(relativePath, meta) {
  const p = relativePath.replace(/\\/g, "/");
  if (p.includes("/gallery/img")) return galleryResize(relativePath, meta);
  if (p.endsWith("mr-photo.jpeg") || p.endsWith("mr-photo.jpg"))
    return mrPhotoResize();
  if (
    p.includes("/events/") ||
    p.includes("/venues/") ||
    p.includes("/envlope/") ||
    p.includes("/ganesha/")
  ) {
    return maxWidthResize(meta, 1536);
  }
  if (p.includes("/bg/") || p.includes("/folded-card/")) {
    return maxWidthResize(meta, 1920);
  }
  if (p.includes("/gallery/")) {
    return maxWidthResize(meta, 1200);
  }
  return maxWidthResize(meta, 1536);
}

async function optimizeSource(inPath) {
  const relative = rel(inPath);
  const outPath = inPath.replace(SOURCE_RE, ".webp");

  await mkdir(path.dirname(outPath), { recursive: true });

  const input = sharp(inPath).rotate();
  const meta = await input.metadata();
  const resize = pickResize(relative, meta);

  let pipeline = sharp(inPath).rotate();
  if (resize) {
    pipeline = pipeline.resize(resize.width, resize.height, {
      fit: "cover",
      position: "centre",
    });
  }

  const hasAlpha = meta.hasAlpha || meta.channels === 4;
  await pipeline
    .webp({
      quality: hasAlpha ? 88 : 86,
      alphaQuality: 90,
      effort: 6,
    })
    .toFile(outPath);

  const [inStat, outStat, outMeta] = await Promise.all([
    stat(inPath),
    stat(outPath),
    sharp(outPath).metadata(),
  ]);

  console.log(
    `${rel(outPath)}: ${outMeta.width}x${outMeta.height} ${Math.round(inStat.size / 1024)}KB → ${Math.round(outStat.size / 1024)}KB`,
  );
}

const sources = await walk(PUBLIC);
sources.sort();

for (const source of sources) {
  await optimizeSource(source);
}

console.log(`\nOptimized ${sources.length} source file(s).`);
