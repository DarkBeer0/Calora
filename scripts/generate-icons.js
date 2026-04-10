const sharp = require('sharp');
const path = require('path');

const SIZE = 1024;
const HALF = SIZE / 2;

// Green flame/leaf icon on green gradient background
// SVG drawn at 1024x1024
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#66BB6A"/>
      <stop offset="1" stop-color="#388E3C"/>
    </linearGradient>
    <linearGradient id="flame" x1="0.5" y1="1" x2="0.5" y2="0">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.95"/>
      <stop offset="1" stop-color="#E8F5E9" stop-opacity="0.9"/>
    </linearGradient>
    <clipPath id="circle">
      <circle cx="${HALF}" cy="${HALF}" r="${HALF}"/>
    </clipPath>
  </defs>

  <!-- Circular background -->
  <circle cx="${HALF}" cy="${HALF}" r="${HALF}" fill="url(#bg)"/>

  <!-- Subtle inner shadow ring -->
  <circle cx="${HALF}" cy="${HALF}" r="${HALF - 20}" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="40"/>

  <!-- Flame/Leaf shape — centered, large -->
  <g transform="translate(${HALF - 250}, ${HALF - 340}) scale(5)">
    <!-- Outer flame -->
    <path d="M50 8 C50 8, 18 38, 18 60 C18 78, 32 92, 50 92 C68 92, 82 78, 82 60 C82 38, 50 8, 50 8Z" fill="url(#flame)"/>
    <!-- Inner flame -->
    <path d="M50 38 C50 38, 33 55, 33 66 C33 75, 40 82, 50 82 C60 82, 67 75, 67 66 C67 55, 50 38, 50 38Z" fill="rgba(76,175,80,0.35)"/>
    <!-- Leaf veins -->
    <path d="M50 54 L50 78" stroke="rgba(76,175,80,0.25)" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M50 60 L42 53" stroke="rgba(76,175,80,0.2)" stroke-width="2" stroke-linecap="round"/>
    <path d="M50 67 L58 60" stroke="rgba(76,175,80,0.2)" stroke-width="2" stroke-linecap="round"/>
  </g>
</svg>`;

async function generate() {
  const assetsDir = path.join(__dirname, '..', 'assets');

  // Main icon (1024x1024)
  await sharp(Buffer.from(svg))
    .resize(1024, 1024)
    .png({ quality: 100 })
    .toFile(path.join(assetsDir, 'icon.png'));
  console.log('✓ icon.png (1024x1024)');

  // Splash icon (1024x1024)
  await sharp(Buffer.from(svg))
    .resize(1024, 1024)
    .png({ quality: 100 })
    .toFile(path.join(assetsDir, 'splash-icon.png'));
  console.log('✓ splash-icon.png (1024x1024)');

  // Favicon (48x48)
  await sharp(Buffer.from(svg))
    .resize(48, 48)
    .png({ quality: 100 })
    .toFile(path.join(assetsDir, 'favicon.png'));
  console.log('✓ favicon.png (48x48)');

  // Android adaptive icon foreground (white flame on transparent)
  const fgSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <g transform="translate(${HALF - 250}, ${HALF - 300}) scale(5)">
      <path d="M50 8 C50 8, 18 38, 18 60 C18 78, 32 92, 50 92 C68 92, 82 78, 82 60 C82 38, 50 8, 50 8Z" fill="white"/>
      <path d="M50 38 C50 38, 33 55, 33 66 C33 75, 40 82, 50 82 C60 82, 67 75, 67 66 C67 55, 50 38, 50 38Z" fill="rgba(76,175,80,0.3)"/>
      <path d="M50 54 L50 78" stroke="rgba(76,175,80,0.2)" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M50 60 L42 53" stroke="rgba(76,175,80,0.15)" stroke-width="2" stroke-linecap="round"/>
      <path d="M50 67 L58 60" stroke="rgba(76,175,80,0.15)" stroke-width="2" stroke-linecap="round"/>
    </g>
  </svg>`;

  await sharp(Buffer.from(fgSvg))
    .resize(1024, 1024)
    .png({ quality: 100 })
    .toFile(path.join(assetsDir, 'android-icon-foreground.png'));
  console.log('✓ android-icon-foreground.png');

  // Android background (solid green)
  const bgSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <rect width="1024" height="1024" fill="#4CAF50"/>
  </svg>`;

  await sharp(Buffer.from(bgSvg))
    .resize(1024, 1024)
    .png({ quality: 100 })
    .toFile(path.join(assetsDir, 'android-icon-background.png'));
  console.log('✓ android-icon-background.png');

  // Android monochrome
  const monoSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <g transform="translate(${HALF - 250}, ${HALF - 300}) scale(5)">
      <path d="M50 8 C50 8, 18 38, 18 60 C18 78, 32 92, 50 92 C68 92, 82 78, 82 60 C82 38, 50 8, 50 8Z" fill="white"/>
    </g>
  </svg>`;

  await sharp(Buffer.from(monoSvg))
    .resize(1024, 1024)
    .png({ quality: 100 })
    .toFile(path.join(assetsDir, 'android-icon-monochrome.png'));
  console.log('✓ android-icon-monochrome.png');

  console.log('\nAll icons generated!');
}

generate().catch(console.error);
