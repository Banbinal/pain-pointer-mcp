// Dessins originaux (visage, profil, main, pied) et leurs zones nommées.
// Toutes les coordonnées sont en repère « de base » ; l'inversion gauche/droite
// est appliquée par transformation au rendu et au calcul des zones.

const f = (n) => Math.round(n * 10) / 10;

function rot([x, y], [cx, cy], deg) {
  const a = (deg * Math.PI) / 180;
  const dx = x - cx;
  const dy = y - cy;
  return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
}

function poly(pts) {
  return "M" + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L") + "Z";
}

export function ellipsePath(cx, cy, rx, ry, deg = 0) {
  const pts = [];
  for (let i = 0; i < 36; i++) {
    const t = (i / 36) * Math.PI * 2;
    pts.push(rot([cx + rx * Math.cos(t), cy + ry * Math.sin(t)], [cx, cy], deg));
  }
  return poly(pts);
}

export function rectPath(x, y, w, h) {
  return poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
}

// Segment de doigt : rectangle (arrondi en bout si `tip`) partant de la base,
// orienté vers le haut puis tourné de `deg` autour de la base.
function fingerPart(base, w, from, to, deg, tip) {
  const [bx, by] = base;
  const pts = [];
  const top = by - to;
  const bot = by - from;
  pts.push([bx - w / 2, bot]);
  if (tip) {
    pts.push([bx - w / 2, top + w / 2]);
    for (let i = 1; i < 12; i++) {
      const t = Math.PI + (i / 12) * Math.PI;
      pts.push([bx + (w / 2) * Math.cos(t), top + w / 2 + (w / 2) * Math.sin(t)]);
    }
    pts.push([bx + w / 2, top + w / 2]);
  } else {
    pts.push([bx - w / 2, top]);
    pts.push([bx + w / 2, top]);
  }
  pts.push([bx + w / 2, bot]);
  return poly(pts.map((p) => rot(p, base, deg)));
}

function crease(base, w, at, deg, k = 0.62, bend = 3) {
  const [bx, by] = base;
  const y = by - at;
  const a = rot([bx - (w / 2) * k, y], base, deg);
  const c = rot([bx, y + bend], base, deg);
  const b = rot([bx + (w / 2) * k, y], base, deg);
  return `M${f(a[0])} ${f(a[1])}Q${f(c[0])} ${f(c[1])} ${f(b[0])} ${f(b[1])}`;
}

/* ================= Main ================= */

const FINGERS = [
  { name: "auriculaire", base: [97, 224], w: 25, len: 94, deg: -11 },
  { name: "annulaire", base: [125, 213], w: 28, len: 120, deg: -3.5 },
  { name: "majeur", base: [155, 209], w: 29, len: 132, deg: 1.5 },
  { name: "index", base: [184, 215], w: 28, len: 117, deg: 8 },
];
const THUMB = { name: "pouce", base: [200, 318], w: 34, len: 112, deg: 36 };
const PALM =
  "M94 400C88 352 75 304 74 256C73 230 84 212 104 207C132 202 172 202 192 207C211 212 216 230 215 254C214 300 204 352 182 400Z";
const WRIST = rectPath(98, 372, 80, 70);
const THENAR = ellipsePath(190, 300, 30, 54, -14);

const SEG = [0, 0.42, 0.72, 1];

function handSilhouette() {
  const parts = [PALM, WRIST, THENAR];
  for (const fi of [...FINGERS, THUMB]) parts.push(fingerPart(fi.base, fi.w, -8, fi.len, fi.deg, true));
  return parts;
}

function handLines(palmSide) {
  const ln = [];
  for (const fi of FINGERS) {
    for (const s of [SEG[1], SEG[2]]) ln.push(crease(fi.base, fi.w, fi.len * s, fi.deg, palmSide ? 0.62 : 0.4, palmSide ? 3 : -3));
    if (!palmSide) {
      // ongle
      const [bx, by] = fi.base;
      const top = by - fi.len;
      const c = rot([bx, top + fi.w * 0.62], fi.base, fi.deg);
      ln.push(ellipsePath(c[0], c[1], fi.w * 0.3, fi.w * 0.42, fi.deg));
    }
  }
  ln.push(crease(THUMB.base, THUMB.w, THUMB.len * 0.55, THUMB.deg, palmSide ? 0.62 : 0.4, palmSide ? 3 : -3));
  if (!palmSide) {
    const [bx, by] = THUMB.base;
    const top = by - THUMB.len;
    const w = THUMB.w;
    const c = rot([bx, top + w * 0.62], THUMB.base, THUMB.deg);
    ln.push(ellipsePath(c[0], c[1], w * 0.3, w * 0.42, THUMB.deg));
  }
  if (palmSide) {
    ln.push("M86 236C120 226 168 226 206 232"); // pli digito-palmaire
    ln.push("M84 268C112 256 150 254 196 242"); // ligne de cœur
    ln.push("M203 262C176 270 136 282 98 306"); // ligne de tête
    ln.push("M203 262C178 292 166 330 170 386"); // ligne de vie
    ln.push("M118 392C130 396 150 396 162 392"); // pli du poignet
  } else {
    // jointures et tendons
    for (const fi of FINGERS) {
      const k = rot([fi.base[0], fi.base[1] + 8], fi.base, fi.deg);
      ln.push(`M${f(k[0] - 6)} ${f(k[1])}Q${f(k[0])} ${f(k[1] - 4)} ${f(k[0] + 6)} ${f(k[1])}`);
      const t = rot([fi.base[0], fi.base[1] + 22], fi.base, fi.deg);
      ln.push(`M${f(t[0])} ${f(t[1])}L${f(fi.base[0] + (138 - fi.base[0]) * 0.55)} 360`);
    }
  }
  return ln;
}

function handRegions(palmSide) {
  const r = [];
  const segNames = palmSide ? ["base", "milieu", "bout"] : ["base (dessus)", "milieu (dessus)", "bout et ongle"];
  for (const fi of FINGERS) {
    for (let i = 0; i < 3; i++) {
      r.push({ name: `${fi.name}, ${segNames[i]}`, d: fingerPart(fi.base, fi.w + 6, fi.len * SEG[i] - (i === 0 ? 6 : 0), fi.len * SEG[i + 1] + (i === 2 ? 4 : 0), fi.deg, i === 2) });
    }
  }
  const tn = palmSide ? ["base", "bout"] : ["base (dessus)", "bout et ongle"];
  r.push({ name: `pouce, ${tn[0]}`, d: fingerPart(THUMB.base, THUMB.w + 6, 30, THUMB.len * 0.55, THUMB.deg, false) });
  r.push({ name: `pouce, ${tn[1]}`, d: fingerPart(THUMB.base, THUMB.w + 6, THUMB.len * 0.55, THUMB.len + 4, THUMB.deg, true) });
  if (palmSide) {
    r.push({ name: "gras du pouce (base du pouce dans la paume)", d: ellipsePath(188, 304, 34, 58, -14) });
    r.push({ name: "bord de la paume côté auriculaire", d: rectPath(70, 244, 42, 150) });
    r.push({ name: "creux de la paume", d: rectPath(112, 244, 52, 116) });
    r.push({ name: "haut de la paume, sous les doigts", d: rectPath(76, 200, 142, 44) });
    r.push({ name: "poignet (intérieur)", d: rectPath(96, 372, 84, 50) });
  } else {
    r.push({ name: "dos de la main, côté pouce", d: rectPath(162, 244, 56, 128) });
    r.push({ name: "dos de la main, centre", d: rectPath(112, 244, 50, 128) });
    r.push({ name: "dos de la main, côté auriculaire", d: rectPath(70, 244, 42, 128) });
    r.push({ name: "jointures (base des doigts)", d: rectPath(76, 200, 142, 44) });
    r.push({ name: "base du pouce (dessus)", d: ellipsePath(188, 304, 34, 58, -14) });
    r.push({ name: "poignet (dessus)", d: rectPath(96, 372, 84, 50) });
  }
  return r;
}

/* ================= Pied ================= */

const FOOT_BODY =
  "M74 150C66 196 72 236 82 276C90 310 92 340 100 364C110 392 156 394 166 368C174 346 176 316 180 282C186 238 206 196 206 170C206 150 196 134 178 128C150 118 112 116 94 122C82 128 76 138 74 150Z";
const TOES = [
  { name: "gros orteil", cx: 93, cy: 110, rx: 22, ry: 30, deg: -4 },
  { name: "2e orteil", cx: 127, cy: 96, rx: 13.5, ry: 22, deg: 4 },
  { name: "3e orteil", cx: 152, cy: 103, rx: 12.5, ry: 19, deg: 10 },
  { name: "4e orteil", cx: 173, cy: 116, rx: 11.5, ry: 17, deg: 18 },
  { name: "petit orteil", cx: 190, cy: 134, rx: 10, ry: 14, deg: 28 },
];

function footSilhouette() {
  return [FOOT_BODY, ...TOES.map((t) => ellipsePath(t.cx, t.cy, t.rx, t.ry, t.deg))];
}

function footLines(top) {
  const ln = [];
  if (top) {
    for (const t of TOES) {
      const w = t.rx * 0.9;
      const p = [
        [t.cx - w * 0.75, t.cy - t.ry * 0.15],
        [t.cx - w * 0.8, t.cy - t.ry * 0.62],
        [t.cx, t.cy - t.ry * 0.86],
        [t.cx + w * 0.8, t.cy - t.ry * 0.62],
        [t.cx + w * 0.75, t.cy - t.ry * 0.15],
      ].map((q) => rot(q, [t.cx, t.cy], t.deg));
      void p;
      ln.push(ellipsePath(t.cx, t.cy - t.ry * 0.48, t.rx * 0.62, t.ry * 0.36, t.deg));
    }
    ln.push("M94 140C104 190 114 240 124 290"); // tendons
    ln.push("M128 116C132 170 136 230 138 290");
    ln.push("M152 120C154 170 154 230 150 290");
    ln.push("M104 300C118 312 150 314 166 302"); // pli de la cheville
  } else {
    for (const t of TOES) ln.push(ellipsePath(t.cx, t.cy + t.ry * 0.25, t.rx * 0.62, t.ry * 0.55, t.deg));
    ln.push("M76 168C100 144 176 140 204 166"); // coussinet avant-pied
    ln.push("M78 206C112 224 170 222 200 196");
    ln.push("M98 222C108 256 112 290 114 318"); // voûte
    ln.push("M106 330C118 316 156 312 172 328"); // talon
  }
  return ln;
}

function footRegions(top) {
  const r = TOES.map((t) => ({ name: top ? `${t.name} (dessus)` : `${t.name} (dessous)`, d: ellipsePath(t.cx, t.cy, t.rx + 3, t.ry + 3, t.deg) }));
  if (top) {
    r.push({ name: "dessus de l'avant-pied", d: rectPath(68, 124, 144, 86) });
    r.push({ name: "cou-de-pied (milieu du dessus)", d: rectPath(74, 210, 118, 84) });
    r.push({ name: "devant de la cheville", d: rectPath(94, 294, 82, 104) });
    r.push({ name: "malléole interne (bosse intérieure de la cheville)", d: ellipsePath(86, 322, 16, 20) });
    r.push({ name: "malléole externe (bosse extérieure de la cheville)", d: ellipsePath(184, 336, 16, 20) });
  } else {
    r.push({ name: "avant-pied, sous le gros orteil", d: rectPath(68, 124, 64, 92) });
    r.push({ name: "avant-pied, côté extérieur", d: rectPath(132, 124, 80, 92) });
    r.push({ name: "voûte plantaire", d: rectPath(72, 216, 56, 100) });
    r.push({ name: "bord extérieur de la plante", d: rectPath(128, 216, 64, 100) });
    r.push({ name: "talon (dessous)", d: ellipsePath(134, 350, 44, 46) });
  }
  return r;
}

/* ================= Visage de face ================= */

const FACE_HEAD =
  "M200 44C286 44 330 108 330 192C330 246 322 286 304 322C284 364 244 404 200 410C156 404 116 364 96 322C78 286 70 246 70 192C70 108 114 44 200 44Z";
const EAR_L = "M82 182C60 166 44 186 48 214C52 242 62 264 88 272Z";
const EAR_R = "M318 182C340 166 356 186 352 214C348 242 338 264 312 272Z";
const NECK = "M146 368C148 410 140 446 116 476L284 476C260 446 252 410 254 368Z";

function faceSilhouette() {
  return [NECK, EAR_L, EAR_R, FACE_HEAD];
}

function faceLines() {
  return [
    "M90 150C98 96 146 70 200 70C254 70 302 96 310 150", // implantation des cheveux
    "M116 176C132 164 158 162 180 170", // sourcils
    "M284 176C268 164 242 162 220 170",
    "M120 204C134 190 164 190 180 204C164 216 134 216 120 204Z", // yeux
    "M280 204C266 190 236 190 220 204C236 216 266 216 280 204Z",
    "M150 196A8 8 0 1 0 150 212A8 8 0 1 0 150 196Z",
    "M250 196A8 8 0 1 0 250 212A8 8 0 1 0 250 196Z",
    "M188 212C186 238 180 256 172 268C176 282 190 284 200 278C210 284 224 282 228 268C220 256 214 238 212 212", // nez
    "M182 272Q188 266 194 272",
    "M206 272Q212 266 218 272",
    "M160 322C176 314 190 312 200 318C210 312 224 314 240 322C222 328 178 328 160 322Z", // lèvres
    "M160 322C176 342 224 342 240 322",
    "M170 288C160 302 156 314 158 324", // sillons
    "M230 288C240 302 244 314 242 324",
    "M182 372Q200 378 218 372", // menton
    "M62 196C58 210 60 230 70 244", // oreilles internes
    "M338 196C342 210 340 230 330 244",
  ];
}

function faceRegions() {
  // Repère de base : la gauche de l'écran = côté droit de la personne.
  const both = (name, dRight, dLeft) => [
    { name: `${name} droit${name.endsWith("e") && !name.endsWith("re") ? "e" : ""}`, d: dRight },
    { name: `${name} gauche`, d: dLeft },
  ];
  const sym = (cx, cy, rx, ry, deg = 0) => [ellipsePath(cx, cy, rx, ry, deg), ellipsePath(400 - cx, cy, rx, ry, -deg)];
  const r = [];
  const add = (nameR, nameL, [a, b]) => {
    r.push({ name: nameR, d: a });
    r.push({ name: nameL, d: b });
  };
  void both;
  r.push({ name: "front", d: ellipsePath(200, 118, 112, 52) });
  add("tempe droite", "tempe gauche", sym(88, 168, 18, 36));
  add("sourcil droit", "sourcil gauche", sym(148, 168, 36, 12));
  add("œil droit et paupières", "œil gauche et paupières", sym(150, 204, 34, 16));
  add("sous l'œil droit (cerne)", "sous l'œil gauche (cerne)", sym(146, 228, 30, 10));
  add("pommette droite (zone du sinus)", "pommette gauche (zone du sinus)", sym(128, 252, 34, 22));
  add("joue droite", "joue gauche", sym(126, 298, 34, 30));
  add("devant de l'oreille droite (articulation de la mâchoire)", "devant de l'oreille gauche (articulation de la mâchoire)", sym(84, 254, 12, 22));
  add("oreille droite", "oreille gauche", sym(58, 222, 14, 44));
  add("mâchoire droite", "mâchoire gauche", sym(126, 352, 34, 22, 30));
  add("angle de la mâchoire droite", "angle de la mâchoire gauche", sym(98, 314, 16, 22));
  add("coin droit de la bouche", "coin gauche de la bouche", sym(158, 326, 10, 10));
  r.push({ name: "nez", d: "M186 208L214 208L230 270L218 286L182 286L170 270Z" });
  r.push({ name: "lèvre supérieure (et au-dessus)", d: ellipsePath(200, 306, 36, 16) });
  r.push({ name: "lèvre inférieure", d: ellipsePath(200, 332, 36, 10) });
  r.push({ name: "menton", d: ellipsePath(200, 374, 44, 26) });
  r.push({ name: "cou (devant)", d: rectPath(140, 404, 120, 76) });
  return r;
}

/* ================= Tête de profil ================= */

const PROFILE_HEAD =
  "M122 440C126 400 122 356 102 326C72 284 56 234 60 182C66 102 124 46 204 44C268 42 312 78 324 128C328 148 326 162 332 178L352 226C355 234 350 238 342 239L336 240C340 250 339 258 335 264C340 268 340 276 335 281C336 292 332 302 320 305C314 320 302 332 284 336C266 340 254 346 250 366C246 386 246 410 250 440Z";
const PROFILE_EAR = "M176 180C196 166 224 178 222 210C220 242 206 264 186 262C172 260 170 240 172 224Z";

function profileSilhouette() {
  return [PROFILE_HEAD, PROFILE_EAR];
}

function profileLines() {
  return [
    "M292 166Q304 158 316 166Q304 172 292 166Z", // œil
    "M286 150Q302 142 320 150", // sourcil
    "M318 274L336 272", // bouche
    "M204 258C208 290 222 314 248 328", // angle de la mâchoire
    "M188 194C204 188 212 204 208 222C204 238 194 244 188 236", // pavillon
    "M96 186C100 116 150 66 214 62C254 62 286 80 302 108", // cheveux
    "M330 236C322 238 318 232 322 226", // narine
  ];
}

function profileRegions() {
  return [
    { name: "sommet du crâne", d: ellipsePath(170, 70, 80, 26) },
    { name: "front", d: ellipsePath(300, 118, 26, 38, 20) },
    { name: "côté du crâne", d: ellipsePath(170, 128, 56, 36) },
    { name: "arrière du crâne", d: ellipsePath(84, 178, 26, 56) },
    { name: "tempe", d: ellipsePath(246, 168, 28, 26) },
    { name: "œil", d: ellipsePath(304, 166, 16, 12) },
    { name: "oreille", d: ellipsePath(192, 220, 24, 38) },
    { name: "devant de l'oreille (articulation de la mâchoire)", d: ellipsePath(228, 228, 14, 18) },
    { name: "pommette (zone du sinus)", d: ellipsePath(278, 210, 28, 18) },
    { name: "joue", d: ellipsePath(268, 258, 26, 22) },
    { name: "nez", d: "M326 168L356 230L330 244L314 220Z" },
    { name: "bouche", d: ellipsePath(330, 272, 14, 14) },
    { name: "menton", d: ellipsePath(310, 314, 20, 18) },
    { name: "mâchoire", d: ellipsePath(262, 312, 32, 18, 20) },
    { name: "angle de la mâchoire", d: ellipsePath(210, 286, 18, 24) },
    { name: "nuque", d: rectPath(96, 290, 70, 150) },
    { name: "côté du cou", d: rectPath(166, 320, 70, 120) },
    { name: "gorge (devant du cou)", d: rectPath(236, 340, 30, 100) },
  ];
}

/* ================= Catalogue ================= */

export const DRAWN = {
  visage: {
    views: [{ title: "", viewBox: [20, 30, 360, 450], silhouette: faceSilhouette(), lines: faceLines(), regions: faceRegions(), mirror: false }],
    captions: ["Ta droite", "Ta gauche"],
    hint: "Vue de face : ta droite est à gauche de l'écran.",
  },
  tete: {
    lateral: true,
    views: [{ title: "", viewBox: [40, 30, 330, 410], silhouette: profileSilhouette(), lines: profileLines(), regions: profileRegions(), mirrorWhen: "gauche" }],
    hint: "Profil du côté choisi.",
  },
  main: {
    lateral: true,
    views: [
      { title: "Paume", viewBox: [56, 70, 246, 350], silhouette: handSilhouette(), lines: handLines(true), regions: handRegions(true), mirrorWhen: "gauche" },
      { title: "Dos de la main", viewBox: [56, 70, 246, 350], silhouette: handSilhouette(), lines: handLines(false), regions: handRegions(false), mirrorWhen: "droite" },
    ],
    hint: "Comme tu regardes ta propre main : paume vers toi, puis dos de la main.",
  },
  pied: {
    lateral: true,
    views: [
      { title: "Dessus", viewBox: [50, 58, 175, 350], silhouette: footSilhouette(), lines: footLines(true), regions: footRegions(true), mirrorWhen: "gauche" },
      { title: "Plante", viewBox: [50, 58, 175, 350], silhouette: footSilhouette(), lines: footLines(false), regions: footRegions(false), mirrorWhen: "droite" },
    ],
    hint: "Dessus : comme tu regardes ton pied. Plante : vue de dessous.",
  },
};
