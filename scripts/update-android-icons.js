import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, '../public');
const svgPath = path.join(publicDir, 'icon.svg');
const resDir = path.resolve(__dirname, '../android/app/src/main/res');

const sizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

async function updateAndroidIcons() {
  if (!fs.existsSync(resDir)) {
    console.log('No android directory found, skipping.');
    return;
  }

  const svgBuffer = fs.readFileSync(svgPath);

  for (const [folder, size] of Object.entries(sizes)) {
    const targetFolder = path.join(resDir, folder);
    if (!fs.existsSync(targetFolder)) continue;

    // Standard icon
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(targetFolder, 'ic_launcher.png'));

    // Round icon
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(targetFolder, 'ic_launcher_round.png'));

    // Foreground for adaptive icons
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(targetFolder, 'ic_launcher_foreground.png'));

    console.log(`Updated icons in ${folder} (${size}x${size})`);
  }
}

updateAndroidIcons().catch(err => {
  console.error('Error updating Android icons:', err);
});
