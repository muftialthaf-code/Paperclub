import assert from 'node:assert/strict';
import { Pool } from 'pg';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { chromium, type Page } from 'playwright';
import { build } from 'esbuild';
import sharp from 'sharp';
import QRCode from 'qrcode';
import { createApp } from '../server/railway/app';
import { createAuth, type Mail } from '../server/railway/auth';
import { migrate, migrateAuth } from '../server/railway/migrate';
import { blankBrand } from '../server/railway/business/core';

/**
 * Printable bilingual QR card.
 *  Part 1 builds a matrix of cards (brands, name lengths, logo shapes, both sizes) in real Chromium.
 *  Part 2 drives the real dashboard (English and Arabic UI), downloads the PNG and SVG, and checks a disabled QR.
 * Every exported PNG is checked for pixel size, 300 DPI metadata, overflow, a clean white quiet zone and that its QR modules
 * are exactly the matrix for the venue URL (so any scanner reads that URL). When the optional `jsqr` package is installed
 * the PNG is also decoded with it.
 */
const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw Error('A dedicated TEST_DATABASE_URL is required');
const output = process.env.BROWSER_OUTPUT_DIR || '/tmp/qr-card-browser';
await mkdir(output, { recursive: true });
const jsqr: ((d: Uint8ClampedArray, w: number, h: number) => { data: string } | null) | null = await import('jsqr' as string).then(m => m.default || m).catch(() => null);
if (!jsqr) console.log('NOTE: jsqr is not installed; QR modules are verified against the matrix instead of decoded.');

const SIZES = { a5: { w: 1748, h: 2480, mmW: 148 }, a4: { w: 2480, h: 3508, mmW: 210 } } as const;
type Size = keyof typeof SIZES;
async function pngInfo(file: Buffer) {
  const meta = await sharp(file).metadata();
  // pHYs chunk: 300 DPI is 11811 pixels per metre.
  const at = file.indexOf(Buffer.from('pHYs'));
  assert.ok(at > 0, 'PNG carries a pHYs chunk');
  assert.equal(file.readUInt32BE(at + 4), 11811, 'PNG is stamped 300 DPI');
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { w: meta.width!, h: meta.height!, data, channels: info.channels };
}
/** Sample every QR module (and the quiet zone) from the exported pixels. */
async function checkQr(file: Buffer, size: Size, url: string, label: string) {
  const S = SIZES[size], img = await pngInfo(file);
  assert.equal(img.w, S.w, label + ': PNG width'); assert.equal(img.h, S.h, label + ': PNG height');
  const expected = QRCode.create(url, { errorCorrectionLevel: 'Q' }), N = expected.modules.size, k = S.w / 148;
  const vbH = 148 * (size === 'a5' ? 210 / 148 : 297 / 210), dy = (vbH - 210) / 2, panel = 70, x0 = 39, y0 = 77 + dy, m = panel / (N + 8);
  const lum = (x: number, y: number) => { const i = (Math.round(y) * img.w + Math.round(x)) * img.channels; return 0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2]; };
  let wrong = 0;
  for (let r = -4; r < N + 4; r++) for (let c = -4; c < N + 4; c++) {
    const dark = r >= 0 && c >= 0 && r < N && c < N && expected.modules.get(r, c) === 1, v = lum((x0 + (c + 4 + 0.5) * m) * k, (y0 + (r + 4 + 0.5) * m) * k);
    if (dark ? v > 90 : v < 200) wrong++;
  }
  assert.equal(wrong, 0, label + ': every QR module and the 4-module quiet zone match the matrix for ' + url);
  assert.ok(N * m * (S.mmW / 148) >= 40, label + ': QR prints at least 4 cm wide');
  if (jsqr) {
    const rgba = new Uint8ClampedArray(img.w * img.h * 4);
    for (let i = 0; i < img.w * img.h; i++) { rgba[i * 4] = img.data[i * img.channels]; rgba[i * 4 + 1] = img.data[i * img.channels + 1]; rgba[i * 4 + 2] = img.data[i * img.channels + 2]; rgba[i * 4 + 3] = 255; }
    assert.equal(jsqr(rgba, img.w, img.h)?.data, url, label + ': decoded QR is the venue URL');
  }
}

// ---------- Part 1: the matrix, no database ----------
const bundle = await build({ entryPoints: ['src/business/qrCard.ts'], bundle: true, write: false, format: 'iife', globalName: 'QrCard', platform: 'browser', target: 'es2022' });
const bundleJs = bundle.outputFiles[0].text;
const fontServer = createServer(async (req, res) => {
  try {
    if (req.url?.startsWith('/fonts/')) { res.setHeader('content-type', 'font/ttf'); res.end(await readFile('public' + req.url.split('?')[0])); return; }
    if (req.url === '/favicon.ico') { res.statusCode = 204; res.end(); return; }
    res.setHeader('content-type', 'text/html'); res.end('<!doctype html><meta charset="utf-8"><body></body>');
  } catch { res.statusCode = 404; res.end(); }
}).listen(18085, '127.0.0.1');
const logoPng = async (w: number, h: number, fill: string) => { const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${Math.min(w, h) / 5}" fill="${fill}"/><circle cx="${w * 0.3}" cy="${h / 2}" r="${Math.min(w, h) * 0.22}" fill="#fff"/></svg>`; return { dataUrl: 'data:image/png;base64,' + (await sharp(Buffer.from(svg)).png().toBuffer()).toString('base64'), width: w, height: h }; };
const logos: Record<string, unknown> = { none: null, square: await logoPng(512, 512, '#24365b'), wide: await logoPng(512, 140, '#146b68'), tall: await logoPng(150, 512, '#bc4d3a'), tiny: await logoPng(48, 48, '#24365b') };
const brands: Record<string, [string, string]> = { navy: ['#24365b', '#eef2fb'], coral: ['#a8321f', '#fff0ea'], teal: ['#0f5f5c', '#e3f4f1'], pale: ['#3b3b52', '#fffffe'], dark: ['#0b0b1a', '#d8dcea'] };
const names: Record<string, string> = { short: 'Harbour Café', longEn: 'The Extraordinarily Welcoming Family Table & Pancake Parlour of Al Olaya District', ar: 'مقهى ومطعم الواحة العائلي الراقي للأسر والأطفال في حي العليا بالرياض', amp: 'Tom & Jerry’s “Corner” <Café> \'Quoted\'' };
const cases: [string, string, string][] = [['navy', 'short', 'none'], ['navy', 'short', 'square'], ['coral', 'short', 'wide'], ['teal', 'short', 'tall'], ['pale', 'short', 'tiny'], ['dark', 'short', 'square'], ['navy', 'longEn', 'wide'], ['teal', 'longEn', 'none'], ['coral', 'ar', 'none'], ['navy', 'ar', 'square'], ['teal', 'amp', 'square'], ['pale', 'amp', 'none']];
const pool = new Pool({ connectionString, max: 5 }), master = new Pool({ connectionString });
const schema = 'qrcard_' + crypto.randomUUID().replaceAll('-', '');
await master.query('CREATE SCHEMA ' + schema);
const scoped = new Pool({ connectionString, options: '-c search_path=' + schema, max: 5 });
const origin = 'http://127.0.0.1:18084', mail: Mail[] = [];
const c = { origin, secret: 'qr-card-fixture-only-secret-with-more-than-32-characters', databaseUrl: connectionString, smtpPort: 465, production: false, emailFrom: 'test@example.test', resendKey: 'injected-test-mail-only' };
const auth = createAuth(scoped, c, async m => { mail.push(m); }), app = createApp(scoped, c, auth);
app.use('*', serveStatic({ root: './dist' })); app.get('*', serveStatic({ path: './dist/index.html' }));
let server: ReturnType<typeof serve> | undefined, browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
const errors: string[] = [];
const watch = (p: Page) => { p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); };
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
  watch(page);
  await page.goto('http://127.0.0.1:18085/');
  await page.addScriptTag({ content: bundleJs });
  const url = 'https://paperclub.example/q/abc123TOKENxyz789';
  const results = await page.evaluate(async ({ cases, brands, names, logos, url }) => {
    const Q = (window as any).QrCard, fonts = await Q.loadCardFonts(), out: any[] = [];
    if (!fonts) throw Error('fonts did not load');
    for (const [bk, nk, lk] of cases) for (const size of ['a5', 'a4']) {
      const svg = Q.buildCardSvg({ name: names[nk], primary: brands[bk][0], background: brands[bk][1], url, logo: logos[lk], fonts }, size);
      const host = document.createElement('div'); host.style.cssText = 'position:absolute;left:0;top:0;width:700px'; host.innerHTML = svg; document.body.appendChild(host);
      const wellFormed = !new DOMParser().parseFromString(svg, 'image/svg+xml').querySelector('parsererror');
      await document.fonts.ready;
      const over: string[] = [], sizes: number[] = [];
      host.querySelectorAll<SVGTextElement>('text[data-box]').forEach(t => {
        const [x0, y0, x1, y1] = t.dataset.box!.split(' ').map(Number), bb = t.getBBox(); sizes.push(parseFloat(t.getAttribute('font-size')!));
        if (bb.x < x0 - 0.4 || bb.x + bb.width > x1 + 0.4 || bb.y < y0 - 1.2 || bb.y + bb.height > y1 + 1.2) over.push(t.textContent + ' ' + [bb.x, bb.y, bb.x + bb.width, bb.y + bb.height].map(v => v.toFixed(1)).join(','));
      });
      const blob: Blob = await Q.renderCardPng(svg, size), b64: string = await new Promise(ok => { const f = new FileReader(); f.onload = () => ok(String(f.result).split(',')[1]); f.readAsDataURL(blob); });
      out.push({ key: [bk, nk, lk, size].join('_'), size, wellFormed, over, minFont: Math.min(...sizes), b64, svgSelfContained: !/(href|src)=["']https?:/.test(svg) && svg.includes('font/ttf;base64'), noScript: !/<script|onload=/i.test(svg), hasNameText: svg.includes(nk === 'amp' ? 'Tom &amp; Jerry' : names[nk].slice(0, 5)) });
      host.remove();
    }
    return out;
  }, { cases, brands, names, logos, url });
  for (const r of results) {
    const file = Buffer.from(r.b64, 'base64');
    await writeFile(`${output}/${r.key}.png`, file);
    assert.ok(r.wellFormed, r.key + ': SVG is well-formed (names are escaped)');
    assert.deepEqual(r.over, [], r.key + ': nothing overflows its box');
    assert.ok(r.svgSelfContained && r.noScript, r.key + ': SVG is self-contained');
    assert.ok(r.hasNameText, r.key + ': venue name is printed');
    if (/short|longEn|amp|_ar_/.test(r.key)) assert.ok(r.minFont >= 3.17, `${r.key}: no text below 9 pt (smallest ${r.minFont.toFixed(2)} mm)`);
    await checkQr(file, r.size as Size, url, r.key);
  }
  console.log(`PASS part 1: ${results.length} cards (${cases.length} brand/name/logo combinations at A5 and A4)`);
  await page.close();

  // ---------- Part 2: the real dashboard ----------
  await migrate(scoped, 'db/postgres'); await migrateAuth(scoped, auth);
  server = serve({ overrideGlobalObjects: false, fetch: app.fetch, hostname: '127.0.0.1', port: 18084 });
  const signUp = async (email: string) => { const r = await app.request(origin + '/api/auth/sign-up/email', { method: 'POST', headers: { origin, 'content-type': 'application/json', 'x-railway-client-ip': '192.0.2.7' }, body: JSON.stringify({ email, name: 'Venue Host', password: 'browser-test-password' }) }); assert.equal(r.status, 200); const link = mail.findLast(m => m.to === email)!.text.match(/https?:\/\/\S+$/)![0], verified = await app.request(link); assert.equal(verified.status, 302); return verified.headers.getSetCookie().map(v => v.split(';')[0]).find(v => v.startsWith('better-auth.session_token='))!; };
  const cookie = await signUp('host@example.test'), userId = (await scoped.query('SELECT id FROM "user" WHERE email=$1', ['host@example.test'])).rows[0].id;
  const businessId = crypto.randomUUID(), locationId = crypto.randomUUID(), logoId = crypto.randomUUID();
  const venueLogo = await sharp({ create: { width: 480, height: 200, channels: 4, background: '#0f5f5c' } }).composite([{ input: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="480" height="200"><circle cx="100" cy="100" r="60" fill="#fff"/><rect x="200" y="70" width="240" height="60" rx="14" fill="#fff"/></svg>'), top: 0, left: 0 }]).png().toBuffer();
  const brandA = { ...blankBrand('Harbour & Co’s Café'), primary: '#0f5f5c', background: '#e3f4f1', logoId };
  await scoped.query("INSERT INTO businesses(id,name,status,contact_email) VALUES ($1,'Harbour','active','host@example.test')", [businessId]);
  await scoped.query("INSERT INTO business_memberships(id,business_id,user_id,role) VALUES ($1,$2,$3,'owner')", [crypto.randomUUID(), businessId, userId]);
  await scoped.query('INSERT INTO venue_assets(id,business_id,location_id,content) VALUES ($1,$2,NULL,$3)', [logoId, businessId, venueLogo]);
  await scoped.query("INSERT INTO venue_locations(id,business_id,slug,name,status,draft,published,rotation_anchor) VALUES ($1,$2,'harbour-card','Olaya','active',$3,$3,NOW())", [locationId, businessId, JSON.stringify(brandA)]);
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  await context.addCookies([{ name: 'better-auth.session_token', value: cookie.slice(cookie.indexOf('=') + 1), url: origin, httpOnly: true, sameSite: 'Lax' }]);
  const dash = await context.newPage(); watch(dash);
  const open = async (lang: 'en' | 'ar') => {
    await dash.goto(origin + '/business');
    if (lang === 'ar') await dash.getByRole('button', { name: 'العربية', exact: true }).click();
    await dash.getByRole('button', { name: /Harbour/ }).click(); await dash.getByRole('button', { name: /Olaya/ }).click();
    await dash.locator('.business-card-preview img').waitFor();
    await dash.waitForFunction(() => { const i = document.querySelector<HTMLImageElement>('.business-card-preview img'); return !!i && i.complete && i.naturalWidth > 0; });
  };
  const download = async (name: RegExp) => { const [d] = await Promise.all([dash.waitForEvent('download'), dash.getByRole('button', { name }).click()]); const p = await d.path(); return { file: await readFile(p!), name: d.suggestedFilename() }; };
  await open('en');
  const token = (await scoped.query("SELECT public_token FROM venue_qr_codes WHERE kind='location'")).rows[0].public_token as string, cardUrl = origin + '/q/' + token;
  await dash.screenshot({ path: `${output}/dashboard-en-brandA.png`, fullPage: true });
  assert.equal(await dash.locator('.business-card-preview.off').count(), 0, 'an active QR is not marked disabled');
  const a5 = await download(/Card PNG/); assert.match(a5.name, /-card-a5\.png$/); await checkQr(a5.file, 'a5', cardUrl, 'dashboard A5 brand A'); await writeFile(`${output}/dashboard-brandA-a5.png`, a5.file);
  const svgDownload = await download(/Card SVG/); const svgText = svgDownload.file.toString('utf8');
  assert.ok(svgText.includes('data:image/png;base64') && svgText.includes('font/ttf;base64') && svgText.includes('Harbour &amp; Co’s Café'), 'SVG embeds the logo and fonts and escapes the name'); assert.ok(!/(href|src)=["']https?:/.test(svgText) && !svgText.includes('/api/business/assets'), 'SVG has no external references');
  await dash.getByRole('button', { name: 'A4 poster', exact: true }).click();
  await dash.waitForFunction(() => document.querySelector('.business-card-preview img')?.getAttribute('src')?.startsWith('blob:'));
  const a4 = await download(/Card PNG/); assert.match(a4.name, /-card-a4\.png$/); await checkQr(a4.file, 'a4', cardUrl, 'dashboard A4 brand A'); await writeFile(`${output}/dashboard-brandA-a4.png`, a4.file);

  // Second brand (warm red, no logo) and a disabled QR.
  const brandB = { ...blankBrand('مقهى الواحة'), primary: '#a8321f', background: '#fff0ea', logoId: null };
  await scoped.query('UPDATE venue_locations SET draft=$2,published=$2 WHERE id=$1', [locationId, JSON.stringify(brandB)]);
  await scoped.query("UPDATE venue_qr_codes SET status='disabled' WHERE kind='location'");
  await open('en');
  assert.ok(await dash.locator('.business-qr-off').isVisible(), 'a disabled QR is obvious in the dashboard');
  assert.equal(await dash.locator('.business-card-preview.off').count(), 1, 'the preview is greyed out when the QR is disabled');
  const b5 = await download(/Card PNG/); await checkQr(b5.file, 'a5', cardUrl, 'dashboard A5 brand B (disabled QR still downloads)'); await writeFile(`${output}/dashboard-brandB-a5-disabled.png`, b5.file);
  await dash.screenshot({ path: `${output}/dashboard-en-brandB-disabled.png`, fullPage: true });
  await scoped.query("UPDATE venue_qr_codes SET status='active' WHERE kind='location'");

  // Arabic dashboard UI.
  await open('ar');
  assert.ok(await dash.getByRole('button', { name: /البطاقة PNG/ }).isVisible() && await dash.getByRole('button', { name: /طباعة أو حفظ PDF/ }).isVisible(), 'card actions are in Arabic');
  assert.equal(await dash.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'no horizontal scroll in the Arabic dashboard');
  const arPng = await download(/البطاقة PNG/); await checkQr(arPng.file, 'a5', cardUrl, 'Arabic dashboard A5'); await writeFile(`${output}/dashboard-brandB-a5-from-arabic-ui.png`, arPng.file);
  await dash.screenshot({ path: `${output}/dashboard-ar-brandB.png`, fullPage: true });

  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, acceptDownloads: true });
  await phone.addCookies([{ name: 'better-auth.session_token', value: cookie.slice(cookie.indexOf('=') + 1), url: origin, httpOnly: true, sameSite: 'Lax' }]);
  const small = await phone.newPage(); watch(small); await small.goto(origin + '/business'); await small.getByRole('button', { name: /Harbour/ }).click(); await small.getByRole('button', { name: /Olaya/ }).click(); await small.locator('.business-card-preview img').waitFor();
  assert.equal(await small.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'the card tools fit a 390 px phone'); await small.screenshot({ path: `${output}/dashboard-phone.png`, fullPage: true });

  assert.deepEqual(errors, [], 'no console or page errors');
  console.log('PASS: printable bilingual QR card: 24 matrix cards (5 brands, long/Arabic/ampersand names, wide/tall/square/tiny/no logo, A5 and A4), exact 300 DPI PNG sizes, no overflow, QR modules and quiet zone verified' + (jsqr ? ' and decoded' : '') + ', self-contained SVG, dashboard downloads in English and Arabic for two brands, disabled-QR warning. Output: ' + output);
} finally {
  await browser?.close(); fontServer.close();
  if (server) await new Promise<void>(r => server!.close(() => r()));
  await scoped.end(); await pool.end(); await master.query('DROP SCHEMA ' + schema + ' CASCADE'); await master.end();
}
