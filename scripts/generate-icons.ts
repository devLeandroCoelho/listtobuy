import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';

async function main() {
  const svg = readFileSync(new URL('../public/favicon.svg', import.meta.url));
  const size = 180;

  const png = await sharp(svg)
    .resize(size, size)
    .png()
    .toBuffer();

  writeFileSync(new URL(`../public/apple-touch-icon.png`, import.meta.url), png);
  console.log(`Generated apple-touch-icon.png (${size}x${size})`);
}

main();