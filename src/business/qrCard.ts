import QRCode from 'qrcode';

/**
 * Printable bilingual venue card (A5 table card, A4 poster).
 * Presentation only: it draws the venue's permanent QR (location.origin + '/q/' + token) and the venue's own
 * brand colours. Everything is vector and self-contained (fonts and logo are embedded) so the SVG opens the same
 * anywhere and the PNG export uses the same fonts as the screen.
 */
export type CardSize = 'a5' | 'a4';
export const CARD_SIZES: Record<CardSize, { mmW: number; mmH: number; pxW: number; pxH: number }> = {
  a5: { mmW: 148, mmH: 210, pxW: 1748, pxH: 2480 }, // 300 DPI
  a4: { mmW: 210, mmH: 297, pxW: 2480, pxH: 3508 },
};
export type CardLogo = { dataUrl: string; width: number; height: number };
export type CardFonts = { regular: string; bold: string }; // base64 TTF data
export type CardInput = { name: string; primary: string; background: string; url: string; logo?: CardLogo | null; fonts?: CardFonts | null };

/** Fixed card copy. The card is permanent, so it never prints the daily code. */
export const CARD_COPY = {
  headlineEn: 'Make room for play.',
  headlineAr: 'خلّونا نلعب مع بعض.',
  stepsEn: ['Scan with your phone camera.', 'Ask our team for today’s six-digit code.', 'Play together. No app, no account.'],
  stepsAr: ['صوّروا الرمز بكاميرا جوالكم.', 'اطلبوا من فريقنا رمز اليوم المكوّن من ٦ أرقام.', 'العبوا مع بعض، بدون تطبيق وبدون حساب.'],
  footer: 'Powered by Paperclub',
};

const SERIF = "Georgia,'Times New Roman',serif", SANS = 'Arial,Helvetica,sans-serif', ARABIC = "Tajawal,Arial,sans-serif";
const W = 148, DESIGN_H = 210, SAFE = 8; // design units are millimetres on an A5 page
const CORAL = '#bc4d3a', QR_DARK = '#111827', PAPER = '#ffffff';

const esc = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/[<>&"']/g, v => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[v]!));
const n = (v: number) => Math.round(v * 100) / 100;
const hexRgb = (h: string) => { const m = /^#?([0-9a-f]{6})$/i.exec(h.trim()); const v = m ? parseInt(m[1], 16) : 0; return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
const lum = (h: string) => { const [r, g, b] = hexRgb(h).map(c => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const contrast = (a: string, b: string) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const safeColour = (c: string, fallback: string) => /^#[0-9a-f]{6}$/i.test(c) ? c : fallback;
const isArabic = (s: string) => { const first = s.match(/[A-Za-z؀-ۿ]/)?.[0]; return !!first && /[؀-ۿ]/.test(first); };

type Measure = (text: string, family: string, weight: number) => number; // width of the text at font-size 1
let canvas: CanvasRenderingContext2D | null = null;
const measure: Measure = (text, family, weight) => {
  canvas ??= document.createElement('canvas').getContext('2d')!;
  canvas.font = `${weight} 100px ${family}`;
  return canvas.measureText(text).width / 100;
};
function wrap(text: string, family: string, weight: number, size: number, maxW: number) {
  const words = text.trim().split(/\s+/).filter(Boolean), lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? line + ' ' + word : word;
    if (!line || measure(next, family, weight) * size <= maxW) line = next; else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}
/** Largest font size (within limits) at which the text fits the box; shrinks further rather than overflow. */
function fitBlock(text: string, family: string, weight: number, boxW: number, boxH: number, maxSize: number, minSize: number, maxLines: number, lh = 1.2) {
  for (let size = maxSize; size >= minSize - 1e-6; size -= 0.2) {
    const lines = wrap(text, family, weight, size, boxW);
    if (lines.length <= maxLines && lines.length * lh * size <= boxH + 1e-6 && lines.every(l => measure(l, family, weight) * size <= boxW + 1e-6)) return { size, lines };
  }
  let size = minSize, lines = wrap(text, family, weight, size, boxW);
  while (size > 1.8 && (lines.length > maxLines || lines.length * lh * size > boxH || lines.some(l => measure(l, family, weight) * size > boxW))) { size -= 0.1; lines = wrap(text, family, weight, size, boxW); }
  if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…'; }
  return { size, lines };
}

function qrPath(url: string, x0: number, y0: number, panel: number) {
  const q = QRCode.create(url, { errorCorrectionLevel: 'Q' }), N = q.modules.size, m = panel / (N + 8); // 4-module quiet zone on every side
  let d = '';
  for (let r = 0; r < N; r++) for (let c = 0; c < N;) {
    if (!q.modules.get(r, c)) { c++; continue; }
    let e = c; while (e < N && q.modules.get(r, e)) e++;
    d += `M${n(x0 + (c + 4) * m)} ${n(y0 + (r + 4) * m)}h${n((e - c) * m)}v${n(m)}h${n(-(e - c) * m)}z`;
    c = e;
  }
  return { d, modules: N, qrMm: N * m };
}
const sparkle = (cx: number, cy: number, r: number, fill: string) => `<path d="M${n(cx)} ${n(cy - r)}Q${n(cx)} ${n(cy)} ${n(cx + r)} ${n(cy)}Q${n(cx)} ${n(cy)} ${n(cx)} ${n(cy + r)}Q${n(cx)} ${n(cy)} ${n(cx - r)} ${n(cy)}Q${n(cx)} ${n(cy)} ${n(cx)} ${n(cy - r)}Z" fill="${fill}"/>`;
const asterisk = (cx: number, cy: number, r: number, stroke: string) => [0, 60, 120].map(a => { const t = a * Math.PI / 180, dx = Math.cos(t) * r, dy = Math.sin(t) * r; return `<path d="M${n(cx - dx)} ${n(cy - dy)}L${n(cx + dx)} ${n(cy + dy)}" stroke="${stroke}" stroke-width=".55" stroke-linecap="round"/>`; }).join('');

export function buildCardSvg(input: CardInput, size: CardSize): string {
  const S = CARD_SIZES[size], vbH = n(W * S.mmH / S.mmW), dy = n((vbH - DESIGN_H) / 2);
  const ink = safeColour(input.primary, '#24365b'), bg = safeColour(input.background, '#faf9f6');
  const accent = contrast(bg, CORAL) >= 3 ? CORAL : ink;
  const name = input.name.replace(/\s+/g, ' ').trim() || 'Paperclub';
  const boxes: string[] = [];
  const text = (x: number, y: number, s: number, value: string, o: { family: string; weight?: number; rtl?: boolean; fill?: string; box: [number, number, number, number]; align?: 'middle' | 'start' | 'end' }) => {
    const w = measure(value, o.family, o.weight || 400) * s;
    // Anchor deterministically so right-to-left lines sit flush right in every renderer.
    const cx = o.align === 'end' ? x - w / 2 : o.align === 'start' ? x + w / 2 : x;
    return `<text x="${n(cx)}" y="${n(y)}" text-anchor="middle" font-size="${n(s)}" font-family="${o.family}" font-weight="${o.weight || 400}" fill="${o.fill || ink}"${o.rtl ? ' direction="rtl" style="direction:rtl;unicode-bidi:embed"' : ' direction="ltr"'} data-box="${o.box.join(' ')}">${esc(value)}</text>`;
  };
  void boxes;
  const parts: string[] = [];

  // Header: logo (when there is one) and the venue name.
  const nameArabic = isArabic(name), nameFamily = nameArabic ? ARABIC : SERIF, nameWeight = nameArabic ? 700 : 400;
  if (input.logo) {
    const L = input.logo, boxW = 80, boxH = 20, dpiCap = 150 / 25.4; // never print a raster logo below 150 dpi
    let w = Math.min(boxW, L.width / dpiCap), h = w * L.height / L.width;
    if (h > boxH) { h = boxH; w = h * L.width / L.height; }
    if (h < 14 && L.height / L.width <= boxH / boxW * 4) { const k = Math.min(14 / h, boxW / w, boxH / h); w *= k; h *= k; }
    const x = (W - w) / 2, y = 9 + (boxH - h) / 2;
    parts.push(`<image href="${input.logo.dataUrl}" xlink:href="${input.logo.dataUrl}" x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" preserveAspectRatio="xMidYMid meet"/>`);
    const f = fitBlock(name, nameFamily, nameWeight, 124, 12, 6.4, 3.6, 2, 1.18);
    f.lines.forEach((l, i) => parts.push(text(W / 2, 31.6 + f.size * 0.82 + i * f.size * 1.18, f.size, l, { family: nameFamily, weight: nameWeight, rtl: nameArabic, box: [SAFE, 31, W - SAFE, 43] })));
  } else {
    const f = fitBlock(name, nameFamily, nameWeight, 124, 32, 15, 4.2, 3, 1.15), top = 10 + (32 - f.lines.length * f.size * 1.15) / 2;
    f.lines.forEach((l, i) => parts.push(text(W / 2, top + f.size * 0.85 + i * f.size * 1.15, f.size, l, { family: nameFamily, weight: nameWeight, rtl: nameArabic, box: [SAFE, 10, W - SAFE, 42] })));
  }

  // Headline in both languages, equal prominence.
  const hEn = fitBlock(CARD_COPY.headlineEn, SERIF, 400, 132, 10, 9, 5, 1), hAr = fitBlock(CARD_COPY.headlineAr, ARABIC, 700, 132, 10, 9, 5, 1);
  parts.push(text(W / 2, 53, hEn.size, CARD_COPY.headlineEn, { family: SERIF, box: [SAFE, 45, W - SAFE, 57] }));
  const enW = measure(CARD_COPY.headlineEn, SERIF, 400) * hEn.size;
  parts.push(`<path d="M${n(W / 2 - enW / 2)} 55.9Q${n(W / 2 - enW / 4)} 54.5 ${n(W / 2)} 55.7T${n(W / 2 + enW / 2)} 55.5" fill="none" stroke="${accent}" stroke-width=".75" stroke-linecap="round"/>`);
  parts.push(text(W / 2, 65.6, hAr.size, CARD_COPY.headlineAr, { family: ARABIC, weight: 700, rtl: true, box: [SAFE, 57, W - SAFE, 70] }));

  // QR: dark modules on a flat white panel with a 4-module quiet zone. Nothing decorative touches the panel.
  const panel = 70, px = (W - panel) / 2, py = 77, q = qrPath(input.url, px, py, panel);
  parts.push(`<rect x="${n(px - 4)}" y="${n(py - 4)}" width="${panel + 8}" height="${panel + 8}" rx="4.5" fill="none" stroke="${ink}" stroke-width=".4" stroke-dasharray="1.6 1.4" stroke-linecap="round"/>`);
  parts.push(`<rect x="${n(px)}" y="${py}" width="${panel}" height="${panel}" rx="2.2" fill="${PAPER}"/>`);
  parts.push(`<path d="${q.d}" fill="${QR_DARK}" shape-rendering="crispEdges" data-qr="${q.modules}" data-qr-mm="${n(q.qrMm)}"/>`);
  parts.push(sparkle(px - 9, py + 4, 3.2, accent), sparkle(px + panel + 9.5, py + panel - 6, 2.4, accent), sparkle(px + panel + 7, py - 1, 1.5, accent));

  // Three steps, English left to right and Arabic right to left, side by side.
  const rowY = [161, 174, 187], colEn: [number, number] = [SAFE, 64], colAr: [number, number] = [84, W - SAFE];
  const fits = (family: string, weight: number, items: string[], s: number) => items.every(t => { const L = wrap(t, family, weight, s, 56); return L.length <= 2 && L.every(l => measure(l, family, weight) * s <= 56); });
  let ss = 3.9; while (ss > 3.2 && !(fits(SANS, 400, CARD_COPY.stepsEn, ss) && fits(ARABIC, 400, CARD_COPY.stepsAr, ss))) ss -= 0.1;
  const lh = ss * 1.28;
  rowY.forEach((cy, i) => {
    parts.push(`<circle cx="${W / 2}" cy="${cy}" r="4.3" fill="${ink}"/><text x="${W / 2}" y="${n(cy + 1.55)}" text-anchor="middle" font-size="4.6" font-family="${SERIF}" font-weight="700" fill="${bg}" direction="ltr">${i + 1}</text>`);
    const en = wrap(CARD_COPY.stepsEn[i], SANS, 400, ss, 56), ar = wrap(CARD_COPY.stepsAr[i], ARABIC, 400, ss, 56);
    en.forEach((l, k) => parts.push(text(colEn[0], cy - (en.length - 1) * lh / 2 + k * lh + ss * 0.35, ss, l, { family: SANS, align: 'start', box: [colEn[0], cy - 6.5, colEn[1], cy + 6.5] })));
    ar.forEach((l, k) => parts.push(text(colAr[1], cy - (ar.length - 1) * lh / 2 + k * lh + ss * 0.35, ss, l, { family: ARABIC, rtl: true, align: 'end', box: [colAr[0], cy - 6.5, colAr[1], cy + 6.5] })));
  });

  // Footer.
  const fw = measure(CARD_COPY.footer, SANS, 400) * 3.3;
  parts.push(text(W / 2 + 2.8, 200.6, 3.3, CARD_COPY.footer, { family: SANS, box: [SAFE, 197, W - SAFE, 202] }), asterisk(W / 2 - fw / 2 - 0.2, 199.5, 1.5, accent));

  const fonts = input.fonts ? `<style>@font-face{font-family:Tajawal;font-weight:400;src:url(data:font/ttf;base64,${input.fonts.regular}) format('truetype')}@font-face{font-family:Tajawal;font-weight:700;src:url(data:font/ttf;base64,${input.fonts.bold}) format('truetype')}</style>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${S.mmW}mm" height="${S.mmH}mm" viewBox="0 0 ${W} ${vbH}" role="img" aria-label="${esc(name)}" data-size="${size}"><defs>${fonts}</defs><rect width="${W}" height="${vbH}" fill="${PAPER}"/><g transform="translate(0 ${dy})"><rect x="4" y="4" width="140" height="202" rx="6" fill="${bg}" stroke="${ink}" stroke-opacity=".22" stroke-width=".35"/>${parts.join('')}</g></svg>`;
}

let fontCache: CardFonts | null = null;
const b64 = (buf: ArrayBuffer) => { let s = ''; const a = new Uint8Array(buf); for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode(...a.subarray(i, i + 0x8000)); return btoa(s); };
export async function loadCardFonts(): Promise<CardFonts | null> {
  if (fontCache) return fontCache;
  try {
    const [r, bd] = await Promise.all(['Regular', 'Bold'].map(w => fetch('/fonts/Tajawal-' + w + '.ttf').then(x => { if (!x.ok) throw Error('font'); return x.arrayBuffer(); })));
    fontCache = { regular: b64(r), bold: b64(bd) };
    // Register the very files embedded in the card so text is measured with the real Arabic shapes, whatever page this runs on.
    const faces = [new FontFace('Tajawal', r, { weight: '400' }), new FontFace('Tajawal', bd, { weight: '700' })];
    await Promise.all(faces.map(f => f.load().then(v => { (document.fonts as unknown as { add(face: FontFace): void }).add(v); }))).catch(() => undefined);
    await Promise.all([document.fonts.load('400 20px Tajawal'), document.fonts.load('700 20px Tajawal')]).catch(() => undefined);
    return fontCache;
  } catch { return null; }
}
/** Logo as a self-contained data URL (it is stored privately, so it is fetched with the dashboard session). */
export async function loadCardLogo(logoId: string | undefined | null): Promise<CardLogo | null> {
  if (!logoId) return null;
  try {
    const res = await fetch('/api/business/assets/' + encodeURIComponent(logoId), { credentials: 'same-origin' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((ok, bad) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => bad(r.error); r.readAsDataURL(blob); });
    const dims = await new Promise<{ w: number; h: number }>((ok, bad) => { const img = new Image(); img.onload = () => ok({ w: img.naturalWidth, h: img.naturalHeight }); img.onerror = () => bad(Error('logo')); img.src = dataUrl; });
    return dims.w > 0 && dims.h > 0 ? { dataUrl, width: dims.w, height: dims.h } : null;
  } catch { return null; }
}

const crcTable = (() => { const t = new Uint32Array(256); for (let i = 0; i < 256; i++) { let c = i; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[i] = c >>> 0; } return t; })();
const crc32 = (b: Uint8Array) => { let c = 0xffffffff; for (const v of b) c = crcTable[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
/** Stamp 300 DPI into the PNG so print software places it at the true paper size. */
function withDpi(png: Uint8Array, dpi = 300) {
  const ppm = Math.round(dpi / 0.0254), chunk = new Uint8Array(21), view = new DataView(chunk.buffer);
  view.setUint32(0, 9); chunk.set([0x70, 0x48, 0x59, 0x73], 4); view.setUint32(8, ppm); view.setUint32(12, ppm); chunk[16] = 1; view.setUint32(17, crc32(chunk.subarray(4, 17)));
  const out = new Uint8Array(png.length + 21); out.set(png.subarray(0, 33)); out.set(chunk, 33); out.set(png.subarray(33), 54);
  return out;
}
export async function renderCardPng(svg: string, size: CardSize): Promise<Blob> {
  const S = CARD_SIZES[size];
  const img = new Image();
  img.decoding = 'sync';
  await new Promise<void>((ok, bad) => { img.onload = () => ok(); img.onerror = () => bad(Error('card render')); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
  const c = document.createElement('canvas'); c.width = S.pxW; c.height = S.pxH;
  const g = c.getContext('2d')!; g.fillStyle = PAPER; g.fillRect(0, 0, S.pxW, S.pxH); g.drawImage(img, 0, 0, S.pxW, S.pxH);
  const blob = await new Promise<Blob>((ok, bad) => c.toBlob(v => v ? ok(v) : bad(Error('png')), 'image/png'));
  return new Blob([withDpi(new Uint8Array(await blob.arrayBuffer()))], { type: 'image/png' });
}
/** Browser print dialog (Print or save as PDF) at the exact paper size, no browser margins. */
export async function printCard(svg: string, size: CardSize) {
  const S = CARD_SIZES[size], frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true'); frame.style.cssText = 'position:fixed;inset-inline-start:-9999px;top:0;width:1px;height:1px;border:0';
  document.body.appendChild(frame);
  const doc = frame.contentDocument!; doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>Paperclub</title><style>@page{size:${S.mmW}mm ${S.mmH}mm;margin:0}html,body{margin:0;background:#fff}svg{display:block;width:${S.mmW}mm;height:${S.mmH}mm}</style></head><body>${svg}</body></html>`); doc.close();
  try { await doc.fonts.ready; } catch { /* print anyway */ }
  frame.contentWindow!.focus(); frame.contentWindow!.print();
  setTimeout(() => frame.remove(), 60000);
}
