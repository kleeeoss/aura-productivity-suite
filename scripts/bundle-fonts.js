import fs from 'node:fs';
import path from 'node:path';

const fontsDir = path.resolve(process.cwd(), 'public', 'fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const fontFamilies = [
  'Archivo+Black',
  'Fira+Code:wght@400;500;600',
  'Fraunces:wght@400;600;700',
  'Inter:wght@400;500;600;700',
  'JetBrains+Mono:wght@400;500;600',
  'Merriweather:wght@400;700',
  'Plus+Jakarta+Sans:wght@400;500;600;700',
  'Press+Start+2P',
  'Roboto:wght@400;500;700',
  'Space+Grotesk:wght@400;500;600;700',
  'Space+Mono:wght@400;700',
  'VT323'
];

async function bundleFonts() {
  console.log(`Starting bundling for ${fontFamilies.length} Google Fonts...`);
  let fullCss = '/* Bundled Local Google Fonts for AURA 1.2 Offline Resilience */\n\n';

  const downloadedUrls = new Map(); // url -> localFilename

  for (const fontParam of fontFamilies) {
    const url = `https://fonts.googleapis.com/css2?family=${fontParam}&display=swap`;
    console.log(`Fetching CSS for ${fontParam}...`);
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
    }
    let css = await res.text();

    const urlRegex = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/g;
    const matches = [...css.matchAll(urlRegex)];

    for (const match of matches) {
      const fontUrl = match[1];
      if (!downloadedUrls.has(fontUrl)) {
        const rawFilename = path.basename(new URL(fontUrl).pathname);
        // Prefix with font name clean identifier to keep tidy
        const fontName = fontParam.split(':')[0].replace(/\+/g, '_').toLowerCase();
        const localFilename = `${fontName}-${rawFilename}`;
        const destPath = path.join(fontsDir, localFilename);

        if (!fs.existsSync(destPath)) {
          const fontRes = await fetch(fontUrl);
          if (!fontRes.ok) throw new Error(`Failed to download font binary: ${fontUrl}`);
          const buffer = Buffer.from(await fontRes.arrayBuffer());
          fs.writeFileSync(destPath, buffer);
          console.log(`  Saved: ${localFilename} (${(buffer.length / 1024).toFixed(1)} KB)`);
        }
        downloadedUrls.set(fontUrl, localFilename);
      }

      const localFilename = downloadedUrls.get(fontUrl);
      css = css.replaceAll(fontUrl, `/fonts/${localFilename}`);
    }

    fullCss += `/* --- ${fontParam} --- */\n` + css + '\n\n';
  }

  const fontsCssPath = path.resolve(process.cwd(), 'src', 'fonts.css');
  fs.writeFileSync(fontsCssPath, fullCss, 'utf8');
  console.log(`\nSuccessfully bundled ${downloadedUrls.size} font files to public/fonts/`);
  console.log(`Generated local font stylesheet at src/fonts.css`);
}

bundleFonts().catch(err => {
  console.error('Fatal bundling error:', err);
  process.exit(1);
});
