/*
 * Generates Qahwa brand PNG assets from inline SVG.
 *
 * Approach: SVG strings include @font-face rules with the actual .ttf
 * files inlined as base64 data URLs. This guarantees librsvg (sharp's
 * SVG renderer) uses the correct Arabic / Latin glyphs regardless of
 * what fonts are installed on the host machine.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const FONT_DIR = path.join(ROOT, 'assets', 'fonts');
const OUT_DIR = path.join(ROOT, 'assets');

const amiriBoldB64 = fs.readFileSync(path.join(FONT_DIR, 'Amiri-Bold.ttf')).toString('base64');
const cormorantItalicB64 = fs.readFileSync(path.join(FONT_DIR, 'CormorantGaramond-Italic.ttf')).toString('base64');

const COLORS = {
  bg: '#FAF7F2',
  brown: '#6B3A1F',
  border: '#C6986B',
  muted: '#8B7355',
};

const fontFaces = `
  <style type="text/css"><![CDATA[
    @font-face {
      font-family: 'Amiri';
      font-weight: bold;
      src: url('data:font/ttf;base64,${amiriBoldB64}') format('truetype');
    }
    @font-face {
      font-family: 'Cormorant';
      font-style: italic;
      src: url('data:font/ttf;base64,${cormorantItalicB64}') format('truetype');
    }
  ]]></style>
`;

function iconSvg({ withBackground }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${fontFaces}
  ${withBackground ? `<rect x="0" y="0" width="1024" height="1024" fill="${COLORS.bg}"/>` : ''}
  <circle cx="512" cy="512" r="490" fill="none" stroke="${COLORS.border}" stroke-width="3" opacity="0.3"/>
  <text x="512" y="460" font-family="Amiri" font-weight="bold" font-size="280" fill="${COLORS.brown}" text-anchor="middle">قهوة</text>
  <rect x="312" y="530" width="400" height="2" fill="${COLORS.border}" opacity="0.6"/>
  <text x="512" y="620" font-family="Cormorant" font-style="italic" font-size="88" fill="${COLORS.muted}" text-anchor="middle" letter-spacing="18">QAHWA</text>
</svg>`;
}

function splashSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${fontFaces}
  <text x="512" y="500" font-family="Amiri" font-weight="bold" font-size="320" fill="${COLORS.brown}" text-anchor="middle">قهوة</text>
  <rect x="372" y="570" width="280" height="2" fill="${COLORS.border}" opacity="0.5"/>
  <text x="512" y="660" font-family="Cormorant" font-style="italic" font-size="72" fill="${COLORS.muted}" text-anchor="middle" letter-spacing="20">QAHWA</text>
</svg>`;
}

function faviconSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  ${fontFaces}
  <rect x="0" y="0" width="48" height="48" fill="${COLORS.bg}"/>
  <text x="24" y="34" font-family="Amiri" font-weight="bold" font-size="28" fill="${COLORS.brown}" text-anchor="middle">ق</text>
</svg>`;
}

async function render(svgString, outPath, width, height) {
  await sharp(Buffer.from(svgString), { density: 300 })
    .resize(width, height)
    .png()
    .toFile(outPath);
  const stat = fs.statSync(outPath);
  console.log(`  wrote ${path.relative(ROOT, outPath)} (${width}x${height}, ${stat.size} bytes)`);
}

async function main() {
  console.log('Generating Qahwa brand assets...');

  await render(iconSvg({ withBackground: true }),  path.join(OUT_DIR, 'icon.png'),          1024, 1024);
  await render(iconSvg({ withBackground: false }), path.join(OUT_DIR, 'adaptive-icon.png'), 1024, 1024);
  await render(splashSvg(),                        path.join(OUT_DIR, 'splash-icon.png'),   1024, 1024);
  await render(faviconSvg(),                       path.join(OUT_DIR, 'favicon.png'),         48,   48);

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
