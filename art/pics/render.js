// Renders contact sheets + mechanical checks for pics.json
// node render.js            -> sheet-small.png, sheet-large.png, metrics
// node render.js id1 id2 .. -> zoom.png with only those icons at 44px and 220px
const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const DIR = __dirname;
const IDS = "hello warmup teacher own partner group read write math words listen talk look computer video test cards journal draw game library clean pack lineup bye break calm move water snack lunch restroom music quiet help timer choice outside question done star coin heart paw bolt anchor thumb gem trophy ticket phone art feel-great feel-good feel-tired feel-worried feel-upset".split(" ");
const TOKENS = "star coin heart paw bolt anchor thumb gem".split(" ");

const raw = fs.readFileSync(path.join(DIR, "pics.json"), "utf8");
const pics = JSON.parse(raw);

// ---- mechanical validation ----
let bad = 0;
const fail = (m) => { bad++; console.log("FAIL " + m); };
const keys = Object.keys(pics);
if (keys.length !== IDS.length || keys.some((k, i) => k !== IDS[i])) fail("ids/order mismatch: " + keys.filter((k, i) => k !== IDS[i]).join(","));
for (const id of keys) {
  const { label, svg } = pics[id];
  if (!label || typeof label !== "string") fail(id + " label");
  for (const b of ["<text", "id=", "<style", "url(", "<svg", "gradient", "filter", "mask", "clipPath", "'"]) if (svg.includes(b)) fail(id + " contains " + b);
  if (!svg.includes('class="a"')) fail(id + " no accent");
  if (/[^\x20-\x7e]/.test(svg)) fail(id + " non-ascii");
  if (svg.length > 600) console.log("note " + id + " length " + svg.length);
  const nums = svg.match(/\d*\.\d{2,}/g);
  if (nums) fail(id + " >1 decimal: " + nums.join(" "));
  const tf = svg.match(/transform="[^"]*"/g) || [];
  if (tf.length > 1) fail(id + " multiple transforms");
}

const svgTag = (id, px) => `<svg viewBox="0 0 48 48" width="${px}" height="${px}">${pics[id].svg}</svg>`;
const css = `body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#E9E4D8}
svg{display:block} svg .a{fill:var(--picA);stroke:none}
.sheet{display:grid;gap:8px;padding:12px;color:#1B2E45;--picA:#8FE3D8}
.card{background:#FBF7EE;border-radius:8px;padding:8px 4px 6px;display:flex;flex-direction:column;align-items:center;gap:4px}
.card span{font-size:12px;line-height:1.1;text-align:center}
.row{display:flex;gap:10px;padding:12px;align-items:center}
h2{font-size:14px;margin:8px 12px 0;color:#1B2E45}`;

const small = `<style>${css}</style><div class="sheet" style="grid-template-columns:repeat(10,84px)">${IDS.map(
  (id) => `<div class="card">${svgTag(id, 44)}<span>${pics[id].label}</span></div>`
).join("")}</div>`;

const large = `<style>${css}</style><div class="sheet" style="grid-template-columns:repeat(6,196px)">${IDS.map(
  (id) => `<div class="card">${svgTag(id, 180)}<span>${id} - ${pics[id].label}</span></div>`
).join("")}</div>
<h2>Tokens, gold accent, 90px / 28px</h2>
<div class="row" style="background:#FBF7EE;color:#1B2E45;--picA:#F4C54A">${TOKENS.map((id) => svgTag(id, 90)).join("")}${TOKENS.map((id) => svgTag(id, 28)).join("")}</div>
<h2>Reversed: white ink on navy</h2>
<div class="row" style="background:#1B2E45;color:#fff;--picA:#3FD9C8">${TOKENS.map((id) => svgTag(id, 90)).join("")}${["hello", "group", "talk", "read", "feel-great", "feel-upset"].map((id) => svgTag(id, 90)).join("")}</div>
<h2>Unearned look (no accent) + tiny 20px</h2>
<div class="row" style="background:#FBF7EE;color:#1B2E45;--picA:transparent">${TOKENS.map((id) => svgTag(id, 44)).join("")}<span style="width:20px"></span><span style="display:contents;--picA:#F4C54A">${TOKENS.map((id) => svgTag(id, 20)).join("")}</span></div>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const only = process.argv.slice(2);
  if (only.length) {
    const html = `<style>${css}</style><div class="sheet" style="grid-template-columns:repeat(${Math.min(only.length, 5)},236px)">${only
      .map((id) => `<div class="card"><div style="display:flex;gap:8px;align-items:flex-end">${svgTag(id, 220)}</div>${svgTag(id, 44)}<span>${id}</span></div>`)
      .join("")}</div>`;
    await page.setContent(html);
    await (await page.$(".sheet")).screenshot({ path: path.join(DIR, "zoom.png") });
    await browser.close();
    return;
  }
  await page.setViewportSize({ width: 960, height: 800 });
  await page.setContent(small);
  await (await page.$(".sheet")).screenshot({ path: path.join(DIR, "sheet-small.png") });
  await page.setViewportSize({ width: 1260, height: 900 });
  await page.setContent(large);
  await page.screenshot({ path: path.join(DIR, "sheet-large.png"), fullPage: true });

  // ---- pixel metrics: bounds (must stay inside 4..44) and coverage ----
  await page.setContent("<canvas></canvas>");
  const metrics = await page.evaluate(async (pics) => {
    const S = 10, N = 48 * S;
    const out = {};
    const draw = (inner, css) =>
      new Promise((res, rej) => {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${N}" height="${N}" style="color:#000"><style>${css}</style>${inner}</svg>`;
        const img = new Image();
        img.onload = () => {
          const cv = document.createElement("canvas");
          cv.width = cv.height = N;
          const cx = cv.getContext("2d");
          cx.drawImage(img, 0, 0);
          res(cx.getImageData(0, 0, N, N).data);
        };
        img.onerror = rej;
        img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      });
    for (const id of Object.keys(pics)) {
      const all = await draw(pics[id].svg, ".a{fill:#f00;stroke:none}");
      const ink = await draw(pics[id].svg, ".a{fill:none;stroke:none}");
      let x0 = N, y0 = N, x1 = -1, y1 = -1, nAll = 0, nInk = 0;
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++) {
          const i = (y * N + x) * 4 + 3;
          if (all[i] > 40) { nAll++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
          if (ink[i] > 127) nInk++;
        }
      out[id] = { l: x0 / S, t: y0 / S, r: (x1 + 1) / S, b: (y1 + 1) / S, ink: nInk / (N * N), acc: (nAll - nInk) / (N * N) };
    }
    return out;
  }, pics);
  const f = (n) => n.toFixed(1).padStart(5);
  console.log("id            left   top right   bot |  w    h   cx   cy | ink% acc% | len");
  for (const id of IDS) {
    const m = metrics[id];
    const flags = [];
    if (m.l < 3.95 || m.t < 3.95 || m.r > 44.05 || m.b > 44.05) { flags.push("MARGIN"); bad++; }
    const w = m.r - m.l, h = m.b - m.t;
    if (Math.max(w, h) < 34) flags.push("small");
    if (Math.abs((m.l + m.r) / 2 - 24) > 1.2) flags.push("off-x");
    if (Math.abs((m.t + m.b) / 2 - 24) > 1.2) flags.push("off-y");
    if (m.acc < 0.1) flags.push("low-accent");
    if (m.ink < 0.12) flags.push("light");
    if (m.ink > 0.3) flags.push("heavy");
    console.log(id.padEnd(13) + f(m.l) + " " + f(m.t) + " " + f(m.r) + " " + f(m.b) + " |" + f(w) + f(h) + f((m.l + m.r) / 2) + f((m.t + m.b) / 2) + " |" + f(m.ink * 100) + f(m.acc * 100) + " | " + String(pics[id].svg.length).padStart(3) + " " + flags.join(" "));
  }
  console.log(bad ? "PROBLEMS: " + bad : "all mechanical checks passed");
  await browser.close();
})();
