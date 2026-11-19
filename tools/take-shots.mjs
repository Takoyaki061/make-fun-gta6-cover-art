// Takes the entry's screenshots with headless Chromium: the editor with
// photos loaded, and three exported covers drawn by the app itself.
// Also clicks Export once and checks the downloaded PNG is a real cover.
// Run from the repository root: node tools/take-shots.mjs
// Needs playwright-core installed (npm i playwright-core) and a Chromium
// build; set CHROME_PATH to its binary, or it uses the Playwright cache.
import { chromium } from '/tmp/pw/node_modules/playwright-core/index.mjs';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const BASE = 'http://localhost:8080';
const CHROME = process.env.CHROME_PATH
  || '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome';

const server = spawn('node', ['serve.ts'], { cwd: ROOT, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1500));

const errors = [];
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const shots = [
  {
    file: 'screenshots/1-cover.jpg',
    url: `${BASE}/index.html?shot=cover&size=wide&layout=hero&grade=sunset&photo=boulevard&caption=NEON%20COAST&subtitle=sunset%20run`,
    viewport: { width: 1280, height: 720 },
  },
  {
    file: 'screenshots/2-editor.jpg',
    url: `${BASE}/index.html?shot=editor&layout=hero&grade=neon&photo=boulevard&caption=NEON%20COAST&subtitle=sunset%20run`,
    viewport: { width: 1280, height: 860 },
  },
  {
    file: 'screenshots/3-cover-portrait.jpg',
    url: `${BASE}/index.html?shot=cover&size=portrait&layout=triptych&grade=vice&photos=boulevard,neon,pier&caption=VICE%20NIGHTS&subtitle=neon%20dreams`,
    viewport: { width: 1024, height: 1280 },
  },
  {
    file: 'screenshots/4-cover-square.jpg',
    url: `${BASE}/index.html?shot=cover&size=square&layout=nine&grade=midnight&photos=boulevard,neon,pier&caption=PIER%20PRESSURE&subtitle=last%20cast`,
    viewport: { width: 1024, height: 1024 },
  },
];

for (const shot of shots) {
  const page = await browser.newPage({ viewport: shot.viewport });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${shot.file}: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`${shot.file}: ${e.message}`));
  await page.goto(shot.url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__shotReady, null, { timeout: 15000 });
  await page.screenshot({ path: join(ROOT, shot.file), type: 'jpeg', quality: 82 });
  console.log('shot', shot.file);
  await page.close();
}

// Export check: the editor's Export button must download a real PNG.
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
page.on('pageerror', (e) => errors.push(`export: ${e.message}`));
await page.goto(`${BASE}/index.html?shot=editor`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__shotReady, null, { timeout: 15000 });
const download = page.waitForEvent('download', { timeout: 15000 });
await page.click('#export');
const file = await download;
const path = await file.path();
const head = Buffer.alloc(33);
const { readFileSync } = await import('node:fs');
const buf = readFileSync(path);
buf.copy(head, 0, 0, 33);
const pngW = buf.readUInt32BE(16);
const pngH = buf.readUInt32BE(20);
console.log('exported PNG:', file.suggestedFilename(), `${pngW}x${pngH}`, `${buf.length} bytes`);
if (pngW !== 1080 || pngH !== 1080) errors.push(`export: wrong size ${pngW}x${pngH}`);

await browser.close();
server.kill();
if (errors.length) {
  console.error('ERRORS:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('all shots ok, no page errors');
