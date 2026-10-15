import { BODY_FRONT, BODY_BACK, BODY_OUTLINE_FRONT, BODY_OUTLINE_BACK } from "./assets/body.js";
import { TEETH, QUAD_MATRIX, TOOTH_CENTER, ARCH_CENTER } from "./assets/teeth.js";
import { DRAWN, ellipsePath, rectPath } from "./assets/drawings.js";

/* ---------- Corps ---------- */

const MUSCLE = {
  chest: { fr: "pectoral (poitrine)", en: "pectoral (chest)" },
  abs: { fr: "abdominaux (ventre)", en: "abdominals (belly)" },
  obliques: { fr: "flanc (obliques)", en: "flank (obliques)" },
  biceps: { fr: "biceps (devant du bras)", en: "biceps (front of the upper arm)" },
  triceps: { fr: "triceps (arrière du bras)", en: "triceps (back of the upper arm)" },
  forearm: { fr: "avant-bras", en: "forearm" },
  deltoids: { fr: "épaule (deltoïde)", en: "shoulder (deltoid)" },
  trapezius: { fr: "trapèze (entre le cou et l'épaule)", en: "trapezius (between the neck and the shoulder)" },
  neck: { fr: "cou", en: "neck" },
  head: { fr: "tête", en: "head" },
  hair: { fr: "tête", en: "head" },
  hands: { fr: "main", en: "hand" },
  quadriceps: { fr: "devant de la cuisse (quadriceps)", en: "front of the thigh (quadriceps)" },
  adductors: { fr: "intérieur de la cuisse (adducteurs)", en: "inner thigh (adductors)" },
  knees: { fr: "genou", en: "knee" },
  tibialis: { fr: "devant de la jambe (tibia)", en: "front of the lower leg (shin)" },
  calves: { fr: "mollet", en: "calf" },
  ankles: { fr: "cheville", en: "ankle" },
  feet: { fr: "pied", en: "foot" },
  gluteal: { fr: "fesse", en: "buttock" },
  hamstring: { fr: "arrière de la cuisse (ischio-jambiers)", en: "back of the thigh (hamstrings)" },
  "lower-back": { fr: "bas du dos (lombaires)", en: "lower back (lumbar)" },
  "upper-back": { fr: "haut du dos", en: "upper back" },
};
// Vu de dos, le trapèze couvre le haut et le milieu du dos, pas seulement le dessus de l'épaule.
const MUSCLE_BACK = {
  trapezius: { fr: "haut du dos, entre les omoplates (trapèze)", en: "upper back, between the shoulder blades (trapezius)" },
};
const SIDE = { droit: { fr: "côté droit", en: "right side" }, gauche: { fr: "côté gauche", en: "left side" } };
const withSide = (n, side) => (side ? { fr: `${n.fr}, ${SIDE[side].fr}`, en: `${n.en}, ${SIDE[side].en}` } : n);

const MID_FRONT = 364;
const MID_BACK = 1084;

function avgX(d) {
  const nums = d.match(/-?\d*\.?\d+/g) || [];
  // Moyenne grossière des abscisses absolues : suffisante pour savoir de quel côté est la forme.
  const m = d.match(/^M\s*(-?\d*\.?\d+)/);
  return m ? parseFloat(m[1]) : nums.length ? parseFloat(nums[0]) : 0;
}

function bodyRegions(front) {
  const data = front ? BODY_FRONT : BODY_BACK;
  const mid = front ? MID_FRONT : MID_BACK;
  const out = [];
  for (const p of data) {
    const base = (!front && MUSCLE_BACK[p.slug]) || MUSCLE[p.slug] || { fr: p.slug, en: p.slug };
    const all = [...p.left, ...p.right, ...p.common];
    for (const d of all) {
      const x = avgX(d);
      let side = "";
      if (Math.abs(x - mid) > 30 && !["head", "hair", "neck"].includes(p.slug)) {
        const screenLeft = x < mid;
        // Face : la gauche de l'écran est le côté droit de la personne. Dos : l'inverse.
        side = front === screenLeft ? "droit" : "gauche";
      }
      const name =
        p.slug === "hair" || (p.slug === "head" && !front)
          ? front
            ? { fr: "tête (cuir chevelu)", en: "head (scalp)" }
            : { fr: "arrière de la tête", en: "back of the head" }
          : base;
      out.push({ name: withSide(name, side), d, dilate: 16, detail: !["hands", "feet", "head", "hair", "neck", "ankles"].includes(p.slug) });
    }
  }
  return out;
}

function bodySvg(front) {
  const data = front ? BODY_FRONT : BODY_BACK;
  const outline = front ? BODY_OUTLINE_FRONT : BODY_OUTLINE_BACK;
  let s = `<path class="skin" d="${outline}"/>`;
  for (const p of data) {
    const cls = p.slug === "hair" ? "hair" : "mus";
    for (const d of [...p.left, ...p.right, ...p.common]) s += `<path class="${cls}" d="${d}"/>`;
  }
  s += `<path class="ol" d="${outline}"/>`;
  return s;
}

const BODY_SVG = { front: null, back: null };
const BODY_REG = { front: null, back: null };
function body(front) {
  const k = front ? "front" : "back";
  if (!BODY_SVG[k]) {
    BODY_SVG[k] = bodySvg(front);
    BODY_REG[k] = bodyRegions(front);
  }
  return { svg: BODY_SVG[k], regions: BODY_REG[k] };
}

const CROPS = {
  genou: {
    front: { droite: [215, 880, 160, 260], gauche: [353, 880, 160, 260] },
    back: { droite: [1073, 880, 160, 260], gauche: [935, 880, 160, 260] },
  },
  epaule: {
    front: { droite: [120, 240, 230, 240], gauche: [378, 240, 230, 240] },
    back: { droite: [1098, 240, 230, 240], gauche: [840, 240, 230, 240] },
  },
};

/* ---------- Dents ---------- */

const TOOTH_NAMES = { 1: "incisive centrale", 2: "incisive latérale", 3: "canine", 4: "1re prémolaire", 5: "2e prémolaire", 6: "1re molaire", 7: "2e molaire", 8: "dent de sagesse" };
const QUAD_POS = { 1: "en haut à droite", 2: "en haut à gauche", 3: "en bas à gauche", 4: "en bas à droite" };
const TOOTH_NAMES_EN = { 1: "central incisor", 2: "lateral incisor", 3: "canine", 4: "first premolar", 5: "second premolar", 6: "first molar", 7: "second molar", 8: "wisdom tooth" };
const QUAD_POS_EN = { 1: "upper right", 2: "upper left", 3: "lower left", 4: "lower right" };

function applyM(m, [x, y]) {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

let TEETH_CACHE = null;
function teeth() {
  if (TEETH_CACHE) return TEETH_CACHE;
  let svg = `<path class="gum" d="M4 318C-4 190 34 4 204 2C374 4 412 190 404 318C392 342 336 342 322 318C322 196 300 94 204 86C108 94 86 196 86 318C72 342 16 342 4 318Z"/>`;
  svg += `<path class="gum" transform="matrix(1 0 0 -1 0 694)" d="M4 318C-4 190 34 4 204 2C374 4 412 190 404 318C392 342 336 342 322 318C322 196 300 94 204 86C108 94 86 196 86 318C72 342 16 342 4 318Z"/>`;
  svg += `<path class="soft" d="M86 318C86 196 108 94 204 86C300 94 322 196 322 318Z"/>`;
  svg += `<path class="soft" d="M86 376C86 498 108 600 204 608C300 600 322 498 322 376Z"/>`;
  const regions = [];
  for (const [n, t] of Object.entries(TEETH)) {
    const q = +n[0];
    const pos = +n[1];
    const m = QUAD_MATRIX[q];
    const mat = `matrix(${m.join(" ")})`;
    svg += `<g transform="${mat}"><path class="tooth" d="${t.outline}"/>${t.detail.map((d) => `<path class="toothd" d="${d}"/>`).join("")}</g>`;
    regions.push({
      name: { fr: `dent ${n} (${TOOTH_NAMES[pos]} ${QUAD_POS[q]})`, en: `tooth ${n} (${QUAD_POS_EN[q]} ${TOOTH_NAMES_EN[pos]})` },
      d: t.outline,
      m,
      dilate: 18,
      tooth: { n, arch: q <= 2 ? "haut" : "bas", c: applyM(m, TOOTH_CENTER[pos]) },
    });
  }
  regions.push({ name: "palais", d: "M86 318C86 196 108 94 204 86C300 94 322 196 322 318Z" });
  regions.push({ name: "langue et plancher de la bouche", d: "M86 376C86 498 108 600 204 608C300 600 322 498 322 376Z" });
  regions.push({ name: "joue droite (intérieur)", d: rectPath(0, 250, 40, 194) });
  regions.push({ name: "joue gauche (intérieur)", d: rectPath(369, 250, 40, 194) });
  TEETH_CACHE = { svg, regions };
  return TEETH_CACHE;
}

/* ---------- Dessins originaux ---------- */

function drawnView(v, side) {
  const svg = v.silhouette.map((d) => `<path class="olw" d="${d}"/>`).join("") + v.silhouette.map((d) => `<path class="skin" d="${d}"/>`).join("") + v.lines.map((d) => `<path class="ln" d="${d}"/>`).join("");
  return { title: v.title, viewBox: v.viewBox, mirror: v.mirrorWhen ? v.mirrorWhen === side : !!v.mirror, svg, regions: v.regions };
}

/* ---------- Catalogue ---------- */

export const SCHEMAS = {
  corps: {
    label: "Corps",
    hint: "Face : ta droite est à gauche de l'écran. Dos : vu de derrière.",
    views: () => [
      { title: "Face", viewBox: [30, 40, 670, 1360], ...body(true), captions: ["droite", "gauche"] },
      { title: "Dos", viewBox: [750, 40, 670, 1360], ...body(false), captions: ["gauche", "droite"] },
    ],
  },
  dents: {
    label: "Dents",
    hint: "Vue de dessus des deux mâchoires. Peins à côté d'une dent pour la gencive : côté joue à l'extérieur, côté palais ou langue à l'intérieur.",
    views: () => [{ title: "", viewBox: [0, 0, 409, 694], ...teeth(), captions: ["ta droite", "ta gauche"], mid: ["mâchoire du haut", "mâchoire du bas"] }],
  },
  visage: {
    label: "Visage",
    hint: DRAWN.visage.hint,
    views: () => DRAWN.visage.views.map((v) => ({ ...drawnView(v), captions: ["ta droite", "ta gauche"] })),
  },
  tete: {
    label: "Tête",
    lateral: true,
    hint: DRAWN.tete.hint,
    views: (side) => DRAWN.tete.views.map((v) => drawnView(v, side)),
  },
  main: { label: "Main", lateral: true, hint: DRAWN.main.hint, views: (side) => DRAWN.main.views.map((v) => drawnView(v, side)) },
  pied: { label: "Pied", lateral: true, hint: DRAWN.pied.hint, views: (side) => DRAWN.pied.views.map((v) => drawnView(v, side)) },
  genou: {
    label: "Genou",
    lateral: true,
    hint: "Devant : vu de face. Derrière : vu de dos.",
    views: (side) => [
      { title: "Devant", viewBox: CROPS.genou.front[side], ...body(true) },
      { title: "Derrière", viewBox: CROPS.genou.back[side], ...body(false) },
    ],
  },
  epaule: {
    label: "Épaule",
    lateral: true,
    hint: "Devant : vu de face. Arrière : vu de dos.",
    views: (side) => [
      { title: "Devant", viewBox: CROPS.epaule.front[side], ...body(true) },
      { title: "Arrière", viewBox: CROPS.epaule.back[side], ...body(false) },
    ],
  },
};

export const SCHEMA_IDS = ["corps", "dents", "visage", "tete", "main", "pied", "genou", "epaule"];
export const ARCH = ARCH_CENTER;
export { ellipsePath };
