import { access, readdir, rename } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

async function optimizeDirectory(directory, width, quality) {
  const files = (await readdir(directory)).filter((file) =>
    file.endsWith(".webp"),
  );

  await Promise.all(
    files.map(async (file) => {
      const source = path.join(directory, file);
      const temporary = `${source}.tmp`;

      await sharp(source)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality })
        .toFile(temporary);
      await rename(temporary, source);
    }),
  );
}

async function optimizeMoon() {
  const webpPath = "public/moon.webp";
  const temporary = `${webpPath}.tmp`;
  let source = webpPath;

  try {
    await access(webpPath);
  } catch {
    source = "public/moon.png";
  }

  await sharp(source)
    .resize({ width: 700, withoutEnlargement: true })
    .webp({ quality: 70 })
    .toFile(temporary);
  await rename(temporary, webpPath);
}

await optimizeDirectory("public/cards/webp", 640, 68);
await optimizeDirectory("public/cards/thumbs", 120, 70);
await optimizeMoon();
