import { App, applyDocumentTheme, applyHostFonts, applyHostStyleVariables } from "@modelcontextprotocol/ext-apps";
import { SCHEMAS, SCHEMA_IDS, ARCH } from "./catalog.js";
import { loc, t, pct, MSG, gumText, lateralTitle, getLang, setLang, langFromLocale } from "./i18n.js";
import "./style.css";

const BRUSHES = [
  { id: "douleur", label: "painPin", color: "#E24B4A" },
  { id: "gonflement", label: "swelling", color: "#EF9F27" },
  { id: "peau", label: "skin", long: "skinLong", color: "#D4537E" },
  { id: "engourdi", label: "numb", long: "numbLong", color: "#378ADD" },
  { id: "gomme", label: "eraser", erase: true },
];
const brushName = (b) => t(b.long || b.label);
const BRUSH = Object.fromEntries(BRUSHES.map((b) => [b.id, b]));
const SIZES = [
  { id: "s", label: "fine", w: 5 },
  { id: "m", label: "medium", w: 11 },
  { id: "l", label: "large", w: 22 },
];
// Identifiants acceptés pour les schémas et les côtés, en français et en anglais.
const SCHEMA_ALIAS = { body: "corps", teeth: "dents", face: "visage", head: "tete", hand: "main", foot: "pied", knee: "genou", shoulder: "epaule" };
const SIDE_ALIAS = { right: "droite", left: "gauche" };
const W = 400;

const state = {
  schema: "corps",
  side: "droite",
  brush: "douleur",
  size: "m",
  strokes: new Map(), // "schema|side" -> [{brush, w, pts}]
  connected: false,
  displayMode: "inline",
  hostCtx: null,
  langForced: false, // langue imposée par l'outil ou choisie par l'utilisateur
};

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const keyOf = (schema = state.schema, side = state.side) => `${schema}|${SCHEMAS[schema].lateral ? side : "-"}`;
const title = (schema, side) => lateralTitle(schema, side) || loc(SCHEMAS[schema].label);

/* ================= Géométrie ================= */

const layoutCache = new Map();
function layout(schema = state.schema, side = state.side) {
  const key = keyOf(schema, side);
  if (layoutCache.has(key)) return layoutCache.get(key);
  const views = SCHEMAS[schema].views(side);
  const n = views.length;
  const slotW = W / n;
  let H = 0;
  for (const v of views) H = Math.max(H, (v.viewBox[3] * slotW) / v.viewBox[2]);
  H = Math.round(H);
  const placed = views.map((v, i) => {
    const [vx, vy, vw, vh] = v.viewBox;
    const k = Math.min(slotW / vw, H / vh);
    const ox = i * slotW + (slotW - vw * k) / 2;
    const oy = (H - vh * k) / 2;
    const T = v.mirror ? [-k, 0, 0, k, ox + (vx + vw) * k, oy - vy * k] : [k, 0, 0, k, ox - vx * k, oy - vy * k];
    return { ...v, slot: [i * slotW, 0, slotW, H], T, k };
  });
  const L = { views: placed, H };
  layoutCache.set(key, L);
  return L;
}

const mul = (a, b) => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
const apply = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

/* ================= Rendu du dessin ================= */

function drawingSvg(L, { exportMode = false } = {}) {
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${L.H}" preserveAspectRatio="xMidYMid meet">`;
  if (exportMode) s += `<style>${EXPORT_CSS}</style><rect width="${W}" height="${L.H}" fill="#ffffff"/>`;
  for (const v of L.views) {
    const [sx, sy, sw, sh] = v.slot;
    s += `<svg x="${sx}" y="${sy}" width="${sw}" height="${sh}" viewBox="${sx} ${sy} ${sw} ${sh}" overflow="hidden"><g transform="matrix(${v.T.join(" ")})">${v.svg}</g></svg>`;
    if (v.captions) {
      s += `<text class="cap" x="${sx + 6}" y="${sy + 14}" text-anchor="start">${esc(loc(v.captions[0]))}</text>`;
      s += `<text class="cap" x="${sx + sw - 6}" y="${sy + 14}" text-anchor="end">${esc(loc(v.captions[1]))}</text>`;
    }
    if (v.mid) {
      s += `<text class="cap" x="${sx + sw / 2}" y="${apply(v.T, [0, 347])[1] - 6}" text-anchor="middle">${esc(loc(v.mid[0]))}</text>`;
      s += `<text class="cap" x="${sx + sw / 2}" y="${apply(v.T, [0, 347])[1] + 16}" text-anchor="middle">${esc(loc(v.mid[1]))}</text>`;
    }
  }
  return s + "</svg>";
}

const EXPORT_CSS = `
.skin{fill:#efe9df}.mus{fill:#e3dccf;stroke:#9b9486;stroke-width:1}.hair{fill:#c9c3b8;stroke:#9b9486;stroke-width:1}
.ol{fill:none;stroke:#3d3a35;stroke-width:2;vector-effect:non-scaling-stroke}
.olw{fill:none;stroke:#3d3a35;stroke-width:4;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.ln{fill:none;stroke:#8a8274;stroke-width:1.2;stroke-linecap:round;vector-effect:non-scaling-stroke}
.tooth{fill:#fbf9f4;stroke:#5b5850;stroke-width:1.4;vector-effect:non-scaling-stroke}
.toothd{fill:none;stroke:#9b9486;stroke-width:.8;vector-effect:non-scaling-stroke}
.gum{fill:#f2dcd6}.soft{fill:#f7ebe7}
.cap{font:11px sans-serif;fill:#5f5e5a}`;

/* ================= Peinture ================= */

const canvas = $("paint");
const ctx = canvas.getContext("2d");
let current = null;

function strokesFor(key = keyOf()) {
  if (!state.strokes.has(key)) state.strokes.set(key, []);
  return state.strokes.get(key);
}

function drawStrokes(c, strokes, scale, onlyBrush) {
  c.save();
  c.setTransform(scale, 0, 0, scale, 0, 0);
  c.lineCap = "round";
  c.lineJoin = "round";
  for (const s of strokes) {
    const b = BRUSH[s.brush];
    if (onlyBrush && !b.erase && s.brush !== onlyBrush) continue;
    c.globalCompositeOperation = b.erase ? "destination-out" : "source-over";
    c.strokeStyle = b.erase ? "#000" : b.color;
    c.fillStyle = c.strokeStyle;
    c.lineWidth = s.w;
    if (s.pts.length === 1) {
      c.beginPath();
      c.arc(s.pts[0][0], s.pts[0][1], s.w / 2, 0, Math.PI * 2);
      c.fill();
      continue;
    }
    c.beginPath();
    c.moveTo(s.pts[0][0], s.pts[0][1]);
    for (let i = 1; i < s.pts.length - 1; i++) {
      const mx = (s.pts[i][0] + s.pts[i + 1][0]) / 2;
      const my = (s.pts[i][1] + s.pts[i + 1][1]) / 2;
      c.quadraticCurveTo(s.pts[i][0], s.pts[i][1], mx, my);
    }
    const last = s.pts[s.pts.length - 1];
    c.lineTo(last[0], last[1]);
    c.stroke();
  }
  c.restore();
}

function sizeCanvas() {
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const w = Math.max(1, Math.round(r.width * dpr));
  const h = Math.max(1, Math.round(r.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
}

function redrawPaint() {
  sizeCanvas();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStrokes(ctx, strokesFor(), canvas.width / W);
}

function toLocal(e) {
  const r = canvas.getBoundingClientRect();
  return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * layout().H];
}

canvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 && e.pointerType === "mouse") return;
  e.preventDefault();
  canvas.setPointerCapture(e.pointerId);
  const b = BRUSH[state.brush];
  const base = SIZES.find((s) => s.id === state.size).w;
  current = { brush: state.brush, w: b.erase ? base * 1.6 : base, pts: [toLocal(e)] };
  strokesFor().push(current);
  redrawPaint();
});
canvas.addEventListener("pointermove", (e) => {
  if (!current) return;
  e.preventDefault();
  const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
  for (const ev of evs) current.pts.push(toLocal(ev));
  redrawPaint();
});
const endStroke = () => {
  if (!current) return;
  current = null;
  invalidateAnalysis();
  renderSummary();
  renderChips();
  scheduleContext();
};
canvas.addEventListener("pointerup", endStroke);
canvas.addEventListener("pointercancel", endStroke);
window.addEventListener("resize", () => redrawPaint());

/* ================= Analyse des zones peintes ================= */

const labelCache = new Map();
function labels(schema, side) {
  const key = keyOf(schema, side);
  if (labelCache.has(key)) return labelCache.get(key);
  const L = layout(schema, side);
  const Wp = W;
  const Hp = L.H;
  const off = document.createElement("canvas");
  off.width = Wp;
  off.height = Hp;
  const c = off.getContext("2d", { willReadFrequently: true });
  const regions = [];
  for (const v of L.views) {
    for (const r of v.regions) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, Wp, Hp);
      c.save();
      c.beginPath();
      c.rect(...v.slot);
      c.clip();
      const T = r.m ? mul(v.T, r.m) : v.T;
      c.setTransform(...T);
      const p = new Path2D(r.d);
      c.fillStyle = "#000";
      c.fill(p);
      if (r.dilate) {
        c.lineWidth = r.dilate;
        c.lineJoin = "round";
        c.strokeStyle = "#000";
        c.stroke(p);
      }
      c.restore();
      const a = c.getImageData(0, 0, Wp, Hp).data;
      const idx = [];
      for (let i = 3, j = 0; i < a.length; i += 4, j++) if (a[i] > 100) idx.push(j);
      if (!idx.length) continue;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const j of idx) {
        const x = j % Wp, y = (j / Wp) | 0;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      const reg = { ...r, view: v, idx, area: idx.length, bbox: [minX, minY, maxX, maxY] };
      if (r.tooth) {
        reg.toothC = apply(v.T, r.tooth.c);
        reg.archC = apply(v.T, ARCH[r.tooth.arch]);
        // Contour exact de la dent, sans la marge de gencive, pour distinguer dent et gencive.
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, Wp, Hp);
        c.setTransform(...T);
        c.fill(p);
        // Le bord de la dent compte comme gencive : on retire une bande de ~4 px au contour.
        c.globalCompositeOperation = "destination-out";
        c.lineWidth = 8;
        c.stroke(p);
        c.globalCompositeOperation = "source-over";
        const b = c.getImageData(0, 0, Wp, Hp).data;
        reg.core = [];
        for (let i = 3, j = 0; i < b.length; i += 4, j++) if (b[i] > 100) reg.core.push(j);
      }
      regions.push(reg);
    }
  }
  const map = new Int16Array(Wp * Hp).fill(-1);
  const areaAt = new Float64Array(Wp * Hp).fill(Infinity);
  regions.forEach((r, ri) => {
    for (const j of r.idx) {
      if (r.area < areaAt[j]) {
        areaAt[j] = r.area;
        map[j] = ri;
      }
    }
  });
  // Les interstices entre zones (traits, marges) prennent la zone la plus proche,
  // dans la limite de quelques pixels, pour qu'un coup de pinceau à cheval ne soit pas perdu.
  let frontier = [];
  for (let j = 0; j < map.length; j++) if (map[j] >= 0) frontier.push(j);
  for (let step = 0; step < 14 && frontier.length; step++) {
    const next = [];
    for (const j of frontier) {
      const x = j % Wp;
      const nb = [x > 0 ? j - 1 : -1, x < Wp - 1 ? j + 1 : -1, j - Wp, j + Wp];
      for (const q of nb) {
        if (q < 0 || q >= map.length || map[q] >= 0) continue;
        map[q] = map[j];
        next.push(q);
      }
    }
    frontier = next;
  }
  const core = new Int16Array(Wp * Hp).fill(-1);
  regions.forEach((r, ri) => {
    if (r.core) for (const j of r.core) core[j] = ri;
  });
  const res = { regions, map, core, Wp, Hp };
  labelCache.set(key, res);
  return res;
}

let analysisCache = null;
function invalidateAnalysis() {
  analysisCache = null;
}

// Décrit ce qu'une tache recouvre dans une zone. Pour une dent, on regarde
// où se répartit la peinture (sur la dent, gencive côté joue, côté palais/langue)
// plutôt que son seul centre.
function describe(reg, e) {
  const name = loc(reg.name);
  if (reg.toothC) {
    const parts = [
      ["tooth", e.core / e.n],
      [+reg.tooth.n[1] <= 3 ? "lip" : "cheek", e.outer / e.n],
      [reg.tooth.arch === "haut" ? "palate" : "tongue", e.inner / e.n],
    ];
    const max = Math.max(...parts.map((p) => p[1]));
    const kept = parts.filter((p) => p[1] >= 0.12 || p[1] === max).map((p) => p[0]);
    const gum = kept.filter((k) => k !== "tooth");
    if (!gum.length) return name;
    return gumText(name, gum, kept.includes("tooth"));
  }
  if (reg.detail && reg.bbox[3] - reg.bbox[1] > 45) {
    const f = (e.sy / e.n - reg.bbox[1]) / (reg.bbox[3] - reg.bbox[1] || 1);
    if (f < 0.34) return `${name} (${MSG.upper()})`;
    if (f > 0.66) return `${name} (${MSG.lower()})`;
  }
  return name;
}

// En dessous de cette surface (en pixels du repère d'analyse, soit à peu près
// un point du pinceau moyen) et si elle pèse peu dans le total, une tache isolée
// est traitée comme une touche involontaire.
const STRAY_PX = 140;
const STRAY_SHARE = 0.08;

function analyseKey(key) {
  const [schema, sideRaw] = key.split("|");
  const side = sideRaw === "-" ? state.side : sideRaw;
  const strokes = state.strokes.get(key) || [];
  if (!strokes.some((s) => !BRUSH[s.brush].erase)) return null;
  const lab = labels(schema, side);
  const { Wp, Hp } = lab;
  const off = document.createElement("canvas");
  off.width = Wp;
  off.height = Hp;
  const c = off.getContext("2d", { willReadFrequently: true });
  const out = [];
  for (const b of BRUSHES) {
    if (b.erase || !strokes.some((s) => s.brush === b.id)) continue;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, Wp, Hp);
    drawStrokes(c, strokes, 1, b.id);
    const a = c.getImageData(0, 0, Wp, Hp).data;
    const painted = new Uint8Array(Wp * Hp);
    let total = 0;
    for (let i = 3, j = 0; i < a.length; i += 4, j++) if (a[i] >= 60) (painted[j] = 1), total++;
    if (!total) continue;

    // Taches : composantes connexes de la peinture (8-voisinage).
    const comp = new Int32Array(Wp * Hp).fill(-1);
    const blobs = [];
    for (let s = 0; s < painted.length; s++) {
      if (!painted[s] || comp[s] >= 0) continue;
      const id = blobs.length;
      const px = [];
      const stack = [s];
      comp[s] = id;
      while (stack.length) {
        const j = stack.pop();
        px.push(j);
        const x = j % Wp;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx;
            const q = j + dy * Wp + dx;
            if (nx < 0 || nx >= Wp || q < 0 || q >= painted.length) continue;
            if (painted[q] && comp[q] < 0) {
              comp[q] = id;
              stack.push(q);
            }
          }
      }
      blobs.push(px);
    }

    const taches = [];
    const strays = [];
    for (const px of blobs) {
      const count = new Map();
      let outside = 0;
      for (const j of px) {
        const ri = lab.map[j];
        if (ri < 0) {
          outside++;
          continue;
        }
        let e = count.get(ri);
        if (!e) count.set(ri, (e = { n: 0, sx: 0, sy: 0, core: 0, outer: 0, inner: 0 }));
        e.n++;
        const x = j % Wp;
        const y = (j / Wp) | 0;
        e.sx += x;
        e.sy += y;
        const reg = lab.regions[ri];
        if (reg.toothC) {
          if (lab.core[j] === ri) e.core++;
          else {
            const d = (p) => Math.hypot(p[0] - reg.archC[0], p[1] - reg.archC[1]);
            if (d([x, y]) >= d(reg.toothC)) e.outer++;
            else e.inner++;
          }
        }
      }
      // Regroupe les descriptions identiques (ex. plusieurs formes d'un même muscle).
      const merged = new Map();
      for (const [ri, e] of count) {
        const label = describe(lab.regions[ri], e);
        merged.set(label, (merged.get(label) || 0) + e.n);
      }
      const items = [...merged.entries()].sort((x, y) => y[1] - x[1]).map(([label, n]) => ({ label, share: n / px.length }));
      const shown = items.filter((it) => it.share >= 0.1).slice(0, 6);
      const tc = { n: px.length, share: px.length / total, items: shown.length ? shown : items.slice(0, 1), outside: outside / px.length };
      if (px.length < STRAY_PX && tc.share < STRAY_SHARE) strays.push(tc);
      else taches.push(tc);
    }
    // Si tout est minuscule, on garde quand même ce qui a été peint.
    if (!taches.length) taches.push(...strays.splice(0));
    taches.sort((x, y) => y.n - x.n);
    out.push({ brush: b, taches, strays });
  }
  return out.length ? { key, schema, side, title: title(schema, side), groups: out } : null;
}

function analyseAll() {
  if (analysisCache) return analysisCache;
  const res = [];
  for (const key of state.strokes.keys()) {
    const r = analyseKey(key);
    if (r) res.push(r);
  }
  analysisCache = res;
  return res;
}

function tacheText(tc, withShares) {
  const parts = tc.items.map((it) => (withShares && tc.items.length > 1 ? `${it.label} (${pct(it.share)})` : it.label));
  if (tc.outside > 0.25) parts.push(MSG.outside());
  return parts.join(MSG.sep());
}

function analysisText(res) {
  return res
    .map((r) => {
      const lines = r.groups.map((g) => {
        const head = `- ${brushName(g.brush)}`;
        let body;
        if (g.taches.length === 1) body = `${MSG.colon()} ${tacheText(g.taches[0], true)}`;
        else body = ":\n" + g.taches.map((tc, i) => `  - ${MSG.patch(i + 1, tc.share)}${MSG.colon()} ${tacheText(tc, true)}`).join("\n");
        if (g.strays.length) {
          const where = [...new Set(g.strays.map((st) => st.items[0]?.label).filter(Boolean))];
          body += `\n  - ${MSG.strays(g.strays.length, where)}`;
        }
        return head + body;
      });
      return `${r.title}${MSG.colon()}\n${lines.join("\n")}`;
    })
    .join("\n\n");
}

/* ================= Image exportée ================= */

function loadImage(src) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  });
}

async function exportImage(key) {
  const [schema, sideRaw] = key.split("|");
  const side = sideRaw === "-" ? state.side : sideRaw;
  const L = layout(schema, side);
  const scale = 2;
  const out = document.createElement("canvas");
  out.width = W * scale;
  out.height = (L.H + 26) * scale;
  const c = out.getContext("2d");
  c.fillStyle = "#fff";
  c.fillRect(0, 0, out.width, out.height);
  c.fillStyle = "#3d3a35";
  c.font = `${13 * scale}px sans-serif`;
  c.fillText(title(schema, side) + "  " + L.views.map((v) => loc(v.title)).filter(Boolean).join(" / "), 8 * scale, 17 * scale);
  const svg = drawingSvg(L, { exportMode: true });
  const im = await loadImage("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg));
  c.drawImage(im, 0, 26 * scale, W * scale, L.H * scale);
  const layer = document.createElement("canvas");
  layer.width = W * scale;
  layer.height = L.H * scale;
  drawStrokes(layer.getContext("2d"), state.strokes.get(key) || [], scale);
  c.globalAlpha = 0.62;
  c.drawImage(layer, 0, 26 * scale);
  c.globalAlpha = 1;
  return out.toDataURL("image/jpeg", 0.85).split(",")[1];
}

/* ================= Interface ================= */

function renderStatic() {
  $("schemas").setAttribute("aria-label", t("schemaGroup"));
  $("sides").setAttribute("aria-label", t("sideGroup"));
  $("colors").setAttribute("aria-label", t("brushGroup"));
  $("sizes").setAttribute("aria-label", t("sizeGroup"));
  $("langs").setAttribute("aria-label", t("langLabel"));
  $("undo").setAttribute("aria-label", t("undo"));
  $("undo").title = t("undo");
  $("wipe").setAttribute("aria-label", t("wipe"));
  $("wipe").title = t("wipe");
  $("paint").setAttribute("aria-label", t("paintArea"));
  $("cover").textContent = t("cover");
  $("send").textContent = t("send");
}

function renderChips() {
  $("schemas").innerHTML = SCHEMA_IDS.map((id) => {
    const n = [...state.strokes.entries()].filter(([k, v]) => k.startsWith(id + "|") && v.length).length;
    return `<button class="chip${id === state.schema ? " on" : ""}" data-schema="${id}" aria-pressed="${id === state.schema}">${esc(loc(SCHEMAS[id].label))}${n ? `<span class="pip" aria-label="${t("painted")}"></span>` : ""}</button>`;
  }).join("");
  $("sides").hidden = !SCHEMAS[state.schema].lateral;
  $("sides").innerHTML = ["droite", "gauche"].map((s) => `<button class="seg${s === state.side ? " on" : ""}" data-side="${s}" aria-pressed="${s === state.side}">${t(s === "droite" ? "right" : "left")}</button>`).join("");
  $("colors").innerHTML = BRUSHES.map(
    (b) => `<button class="seg brush${b.id === state.brush ? " on" : ""}" data-brush="${b.id}" aria-pressed="${b.id === state.brush}" title="${esc(brushName(b))}">${b.erase ? '<span class="eraser"></span>' : `<span class="dot" style="background:${b.color}"></span>`}${t(b.label)}</button>`,
  ).join("");
  $("sizes").innerHTML = SIZES.map((s) => `<button class="seg${s.id === state.size ? " on" : ""}" data-size="${s.id}" aria-pressed="${s.id === state.size}"><span class="sz" style="width:${4 + s.w / 2}px;height:${4 + s.w / 2}px"></span>${t(s.label)}</button>`).join("");
  $("langs").innerHTML = ["fr", "en"].map((l) => `<button class="seg lang${l === getLang() ? " on" : ""}" data-lang="${l}" aria-pressed="${l === getLang()}" lang="${l}">${l.toUpperCase()}</button>`).join("");
  const hasStroke = strokesFor().length > 0;
  $("undo").disabled = !hasStroke;
  $("wipe").disabled = !hasStroke;
  const full = state.hostCtx?.availableDisplayModes?.includes("fullscreen");
  $("full").hidden = !state.connected || !full;
  $("full").textContent = state.displayMode === "fullscreen" ? "⤡" : "⤢";
  $("full").setAttribute("aria-label", t(state.displayMode === "fullscreen" ? "exitFull" : "full"));
  $("full").title = t(state.displayMode === "fullscreen" ? "exitFull" : "full");
}

function renderDrawing() {
  const L = layout();
  $("stage").style.aspectRatio = `${W} / ${L.H}`;
  $("stage").style.setProperty("--ratio", `${W / L.H}`);
  $("drawing").innerHTML = drawingSvg(L);
  $("titles").innerHTML = L.views.map((v) => `<span>${esc(loc(v.title))}</span>`).join("");
  $("titles").hidden = L.views.every((v) => !v.title);
  $("hint").textContent = loc(SCHEMAS[state.schema].hint);
  const mobileInline = state.hostCtx?.platform === "mobile" && state.displayMode !== "fullscreen" && state.hostCtx?.availableDisplayModes?.includes("fullscreen");
  $("cover").hidden = !mobileInline;
  requestAnimationFrame(redrawPaint);
}

function renderSummary() {
  const res = analyseAll();
  const box = $("summary");
  if (!res.length) {
    box.innerHTML = `<p class="muted">${esc(t("empty"))}</p>`;
  } else {
    box.innerHTML = res
      .map(
        (r) =>
          `<div class="sum"><strong>${esc(r.title)}</strong>${r.groups
            .map(
              (g) =>
                `<div class="row"><span class="dot" style="background:${g.brush.color}"></span><span>${g.taches
                  .map((tc) => esc(tc.items.map((it) => it.label).join(", ")))
                  .join("<br>")}${g.strays.length ? `<br><em>${esc(MSG.straysShort(g.strays.length))}</em>` : ""}</span></div>`,
            )
            .join("")}</div>`,
      )
      .join("");
  }
  $("send").disabled = !res.length;
}

function render() {
  renderStatic();
  renderChips();
  renderDrawing();
  renderSummary();
}

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-schema],[data-brush],[data-side],[data-size],[data-lang]");
  if (!el) return;
  if (el.dataset.lang) {
    state.langForced = true;
    switchLang(el.dataset.lang);
    return;
  }
  if (el.dataset.schema) state.schema = el.dataset.schema;
  if (el.dataset.brush) state.brush = el.dataset.brush;
  if (el.dataset.side) state.side = el.dataset.side;
  if (el.dataset.size) state.size = el.dataset.size;
  if (el.dataset.schema || el.dataset.side) renderDrawing();
  renderChips();
});

$("undo").addEventListener("click", () => {
  strokesFor().pop();
  invalidateAnalysis();
  redrawPaint();
  renderChips();
  renderSummary();
  scheduleContext();
});
$("wipe").addEventListener("click", () => {
  state.strokes.set(keyOf(), []);
  invalidateAnalysis();
  redrawPaint();
  renderChips();
  renderSummary();
  scheduleContext();
});
$("full").addEventListener("click", () => toggleFullscreen());
$("cover").addEventListener("click", () => toggleFullscreen(true));

function switchLang(l) {
  if (l === getLang()) return;
  setLang(l);
  invalidateAnalysis();
  render();
  scheduleContext();
}

async function toggleFullscreen(force) {
  if (!state.connected) return;
  const mode = force || state.displayMode !== "fullscreen" ? "fullscreen" : "inline";
  try {
    const r = await app.requestDisplayMode({ mode });
    setDisplayMode(r?.mode || mode);
  } catch {
    $("cover").hidden = true;
  }
}

function setDisplayMode(mode) {
  state.displayMode = mode;
  document.documentElement.dataset.mode = mode;
  renderChips();
  renderDrawing();
}

/* ================= Échanges avec la conversation ================= */

let ctxTimer;
function scheduleContext() {
  if (!state.connected) return;
  clearTimeout(ctxTimer);
  ctxTimer = setTimeout(() => {
    const res = analyseAll();
    const text = res.length ? MSG.context(analysisText(res)) : MSG.contextEmpty();
    app.updateModelContext({ content: [{ type: "text", text }] }).catch(() => {});
  }, 900);
}

$("send").addEventListener("click", async () => {
  const res = analyseAll();
  if (!res.length) return;
  const text = `${MSG.intro()}\n\n${analysisText(res)}\n\n${MSG.outro()}`;
  if (!state.connected) {
    $("status").textContent = t("offline");
    $("fallback").hidden = false;
    $("fallback").textContent = text;
    return;
  }
  $("send").disabled = true;
  $("status").textContent = t("sending");
  const canImage = !!state.hostCaps?.message?.image;
  const content = [{ type: "text", text }];
  if (canImage) {
    for (const r of res) {
      try {
        content.push({ type: "image", data: await exportImage(r.key), mimeType: "image/jpeg" });
      } catch {
        /* l'image est un plus, le texte suffit */
      }
    }
  }
  try {
    let r = await app.sendMessage({ role: "user", content }, { signal: AbortSignal.timeout(15000) });
    if (r?.isError && content.length > 1) r = await app.sendMessage({ role: "user", content: [content[0]] }, { signal: AbortSignal.timeout(10000) });
    if (r?.isError) throw new Error("refusé");
    $("status").textContent = t(content.length > 1 ? "sentImg" : "sent");
  } catch {
    $("status").textContent = t("failed");
    $("fallback").hidden = false;
    $("fallback").textContent = text;
  } finally {
    $("send").disabled = false;
  }
});

function applyArgs(args) {
  if (!args) return;
  const schema = SCHEMA_ALIAS[args.schema] || args.schema;
  const side = SIDE_ALIAS[args.side] || args.side;
  if (schema && SCHEMAS[schema]) state.schema = schema;
  if (side === "droite" || side === "gauche") state.side = side;
  if (args.lang === "fr" || args.lang === "en") {
    state.langForced = true;
    setLang(args.lang);
    invalidateAnalysis();
  }
  render();
}

function applyCtx(ctx) {
  if (!ctx) return;
  state.hostCtx = { ...(state.hostCtx || {}), ...ctx };
  if (ctx.locale && !state.langForced) {
    setLang(langFromLocale(ctx.locale));
    invalidateAnalysis();
  }
  if (ctx.theme) applyDocumentTheme(ctx.theme);
  if (ctx.styles?.variables) applyHostStyleVariables(ctx.styles.variables);
  if (ctx.styles?.css?.fonts) applyHostFonts(ctx.styles.css.fonts);
  if (ctx.safeAreaInsets) {
    const s = ctx.safeAreaInsets;
    $("app").style.padding = `${s.top + 4}px ${s.right + 2}px ${s.bottom + 8}px ${s.left + 2}px`;
  }
  if (ctx.containerDimensions?.height) document.documentElement.style.setProperty("--host-h", `${ctx.containerDimensions.height}px`);
  if (ctx.displayMode) setDisplayMode(ctx.displayMode);
  else render();
}

const app = new App({ name: "Pain Pointer", version: "2.1.0" }, { availableDisplayModes: ["inline", "fullscreen"] });
app.ontoolinput = (p) => applyArgs(p?.arguments);
app.ontoolresult = (r) => applyArgs(r?.structuredContent);
app.onhostcontextchanged = applyCtx;
app.onerror = () => {};

setLang(langFromLocale(navigator.language));
render();
const params = new URLSearchParams(location.search);
if (params.get("schema") || params.get("lang")) applyArgs({ schema: params.get("schema"), side: params.get("side"), lang: params.get("lang") });
window.__painPointer = { state, analyseAll, analysisText, exportImage, render, invalidateAnalysis, switchLang };

if (window.parent !== window) {
  app
    .connect()
    .then(() => {
      state.connected = true;
      state.hostCaps = app.getHostCapabilities();
      applyCtx(app.getHostContext());
      renderChips();
    })
    .catch(() => {});
}
