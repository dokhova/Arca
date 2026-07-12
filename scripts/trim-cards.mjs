import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourceDirectory = "public/cards";
const webpDirectory = "public/cards/webp";
const thumbsDirectory = "public/cards/thumbs";

const files = (await readdir(sourceDirectory))
  .filter((file) => file.endsWith(".png"))
  .sort((left, right) => left.localeCompare(right));

for (const file of files) {
  const source = path.join(sourceDirectory, file);
  const outputName = `${path.parse(file).name}.webp`;
  const original = await sharp(source).metadata();
  const { data: trimmed, info } = await sharp(source)
    .trim({ background: "#ffffff", threshold: 25 })
    .toBuffer({ resolveWithObject: true });

  await Promise.all([
    sharp(trimmed)
      .resize({ width: 640 })
      .webp({ quality: 68 })
      .toFile(path.join(webpDirectory, outputName)),
    sharp(trimmed)
      .resize({ width: 120 })
      .webp({ quality: 70 })
      .toFile(path.join(thumbsDirectory, outputName)),
  ]);

  console.log(
    `${file} → ${original.width}x${original.height} → ${info.width}x${info.height}`,
  );
}
