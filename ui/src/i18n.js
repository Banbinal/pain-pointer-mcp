// Langues de l'interface et des messages envoyés : français (source) et anglais.
// Les textes français servent de clés ; EN donne leur traduction.

let lang = "fr";
export const getLang = () => lang;
export const setLang = (l) => {
  lang = l === "en" ? "en" : "fr";
  document.documentElement.lang = lang;
};

// Choisit la langue à partir d'une locale (« fr-FR », « en-US »…).
export const langFromLocale = (loc) => (String(loc || "").toLowerCase().startsWith("fr") ? "fr" : "en");

// Texte localisé : une chaîne française (traduite via EN) ou un objet { fr, en }.
export function loc(x) {
  if (x == null) return "";
  if (typeof x === "object") return x[lang] ?? x.fr ?? "";
  return lang === "en" ? EN[x] ?? x : x;
}

export const pct = (x) => {
  const n = Math.max(1, Math.round(x * 100));
  return lang === "en" ? `${n}%` : `${n} %`;
};

const EN = {
  /* ----- Schémas, vues, légendes ----- */
  Corps: "Body",
  Dents: "Teeth",
  Visage: "Face",
  Tête: "Head",
  Main: "Hand",
  Pied: "Foot",
  Genou: "Knee",
  Épaule: "Shoulder",
  Face: "Front",
  Dos: "Back",
  Devant: "Front",
  Derrière: "Back",
  Arrière: "Back",
  Paume: "Palm",
  "Dos de la main": "Back of the hand",
  Dessus: "Top",
  Plante: "Sole",
  droite: "right",
  gauche: "left",
  "ta droite": "your right",
  "ta gauche": "your left",
  "mâchoire du haut": "upper jaw",
  "mâchoire du bas": "lower jaw",
  "Face : ta droite est à gauche de l'écran. Dos : vu de derrière.": "Front: your right is on the left of the screen. Back: seen from behind.",
  "Vue de dessus des deux mâchoires. Peins à côté d'une dent pour la gencive : côté joue à l'extérieur, côté palais ou langue à l'intérieur.":
    "Both jaws seen from above. Paint next to a tooth for the gum: cheek side on the outside, palate or tongue side on the inside.",
  "Vue de face : ta droite est à gauche de l'écran.": "Front view: your right is on the left of the screen.",
  "Profil du côté choisi.": "Profile of the chosen side.",
  "Comme tu regardes ta propre main : paume vers toi, puis dos de la main.": "As you look at your own hand: palm towards you, then the back of the hand.",
  "Dessus : comme tu regardes ton pied. Plante : vue de dessous.": "Top: as you look at your own foot. Sole: seen from below.",
  "Devant : vu de face. Derrière : vu de dos.": "Front: seen from the front. Back: seen from behind.",
  "Devant : vu de face. Arrière : vu de dos.": "Front: seen from the front. Back: seen from behind.",

  /* ----- Visage ----- */
  front: "forehead",
  "tempe droite": "right temple",
  "tempe gauche": "left temple",
  "sourcil droit": "right eyebrow",
  "sourcil gauche": "left eyebrow",
  "œil droit et paupières": "right eye and eyelids",
  "œil gauche et paupières": "left eye and eyelids",
  "sous l'œil droit (cerne)": "under the right eye",
  "sous l'œil gauche (cerne)": "under the left eye",
  "pommette droite (zone du sinus)": "right cheekbone (sinus area)",
  "pommette gauche (zone du sinus)": "left cheekbone (sinus area)",
  "joue droite": "right cheek",
  "joue gauche": "left cheek",
  "devant de l'oreille droite (articulation de la mâchoire)": "in front of the right ear (jaw joint)",
  "devant de l'oreille gauche (articulation de la mâchoire)": "in front of the left ear (jaw joint)",
  "oreille droite": "right ear",
  "oreille gauche": "left ear",
  "mâchoire droite": "right jaw",
  "mâchoire gauche": "left jaw",
  "angle de la mâchoire droite": "right angle of the jaw",
  "angle de la mâchoire gauche": "left angle of the jaw",
  "coin droit de la bouche": "right corner of the mouth",
  "coin gauche de la bouche": "left corner of the mouth",
  nez: "nose",
  "lèvre supérieure (et au-dessus)": "upper lip (and above)",
  "lèvre inférieure": "lower lip",
  menton: "chin",
  "cou (devant)": "neck (front)",

  /* ----- Tête de profil ----- */
  "sommet du crâne": "top of the skull",
  "côté du crâne": "side of the skull",
  "arrière du crâne": "back of the skull",
  tempe: "temple",
  œil: "eye",
  oreille: "ear",
  "devant de l'oreille (articulation de la mâchoire)": "in front of the ear (jaw joint)",
  "pommette (zone du sinus)": "cheekbone (sinus area)",
  joue: "cheek",
  bouche: "mouth",
  mâchoire: "jaw",
  "angle de la mâchoire": "angle of the jaw",
  nuque: "back of the neck",
  "côté du cou": "side of the neck",
  "gorge (devant du cou)": "throat (front of the neck)",

  /* ----- Main ----- */
  "auriculaire, base": "little finger, base",
  "auriculaire, milieu": "little finger, middle",
  "auriculaire, bout": "little finger, tip",
  "annulaire, base": "ring finger, base",
  "annulaire, milieu": "ring finger, middle",
  "annulaire, bout": "ring finger, tip",
  "majeur, base": "middle finger, base",
  "majeur, milieu": "middle finger, middle",
  "majeur, bout": "middle finger, tip",
  "index, base": "index finger, base",
  "index, milieu": "index finger, middle",
  "index, bout": "index finger, tip",
  "pouce, base": "thumb, base",
  "pouce, bout": "thumb, tip",
  "gras du pouce (base du pouce dans la paume)": "ball of the thumb (base of the thumb in the palm)",
  "bord de la paume côté auriculaire": "edge of the palm, little finger side",
  "creux de la paume": "hollow of the palm",
  "haut de la paume, sous les doigts": "top of the palm, below the fingers",
  "poignet (intérieur)": "wrist (inner side)",
  "auriculaire, base (dessus)": "little finger, base (back)",
  "auriculaire, milieu (dessus)": "little finger, middle (back)",
  "auriculaire, bout et ongle": "little finger, tip and nail",
  "annulaire, base (dessus)": "ring finger, base (back)",
  "annulaire, milieu (dessus)": "ring finger, middle (back)",
  "annulaire, bout et ongle": "ring finger, tip and nail",
  "majeur, base (dessus)": "middle finger, base (back)",
  "majeur, milieu (dessus)": "middle finger, middle (back)",
  "majeur, bout et ongle": "middle finger, tip and nail",
  "index, base (dessus)": "index finger, base (back)",
  "index, milieu (dessus)": "index finger, middle (back)",
  "index, bout et ongle": "index finger, tip and nail",
  "pouce, base (dessus)": "thumb, base (back)",
  "pouce, bout et ongle": "thumb, tip and nail",
  "dos de la main, côté pouce": "back of the hand, thumb side",
  "dos de la main, centre": "back of the hand, centre",
  "dos de la main, côté auriculaire": "back of the hand, little finger side",
  "jointures (base des doigts)": "knuckles (base of the fingers)",
  "base du pouce (dessus)": "base of the thumb (back)",
  "poignet (dessus)": "wrist (back)",

  /* ----- Pied ----- */
  "gros orteil (dessus)": "big toe (top)",
  "2e orteil (dessus)": "2nd toe (top)",
  "3e orteil (dessus)": "3rd toe (top)",
  "4e orteil (dessus)": "4th toe (top)",
  "petit orteil (dessus)": "little toe (top)",
  "dessus de l'avant-pied": "top of the forefoot",
  "cou-de-pied (milieu du dessus)": "instep (middle of the top)",
  "devant de la cheville": "front of the ankle",
  "malléole interne (bosse intérieure de la cheville)": "inner ankle bone (medial malleolus)",
  "malléole externe (bosse extérieure de la cheville)": "outer ankle bone (lateral malleolus)",
  "gros orteil (dessous)": "big toe (underside)",
  "2e orteil (dessous)": "2nd toe (underside)",
  "3e orteil (dessous)": "3rd toe (underside)",
  "4e orteil (dessous)": "4th toe (underside)",
  "petit orteil (dessous)": "little toe (underside)",
  "avant-pied, sous le gros orteil": "ball of the foot, under the big toe",
  "avant-pied, côté extérieur": "ball of the foot, outer side",
  "voûte plantaire": "arch of the foot",
  "bord extérieur de la plante": "outer edge of the sole",
  "talon (dessous)": "heel (underside)",

  /* ----- Bouche ----- */
  palais: "palate",
  "langue et plancher de la bouche": "tongue and floor of the mouth",
  "joue droite (intérieur)": "right cheek (inside)",
  "joue gauche (intérieur)": "left cheek (inside)",
};

// Textes de l'interface, par clé.
const UI = {
  painPin: { fr: "Douleur", en: "Pain" },
  swelling: { fr: "Gonflement", en: "Swelling" },
  skin: { fr: "Peau", en: "Skin" },
  skinLong: { fr: "Peau (rougeur, plaie, bouton)", en: "Skin (redness, wound, spot)" },
  numb: { fr: "Engourdi", en: "Numb" },
  numbLong: { fr: "Engourdi, fourmillements", en: "Numbness, pins and needles" },
  eraser: { fr: "Gomme", en: "Eraser" },
  fine: { fr: "Fin", en: "Fine" },
  medium: { fr: "Moyen", en: "Medium" },
  large: { fr: "Large", en: "Large" },
  right: { fr: "Droite", en: "Right" },
  left: { fr: "Gauche", en: "Left" },
  undo: { fr: "Annuler le dernier trait", en: "Undo last stroke" },
  wipe: { fr: "Effacer ce schéma", en: "Clear this drawing" },
  full: { fr: "Plein écran", en: "Full screen" },
  exitFull: { fr: "Quitter le plein écran", en: "Exit full screen" },
  cover: { fr: "Agrandir pour peindre", en: "Enlarge to paint" },
  send: { fr: "Envoyer à Claude", en: "Send to Claude" },
  painted: { fr: "peint", en: "painted" },
  empty: { fr: "Choisis un pinceau et peins directement sur le dessin.", en: "Pick a brush and paint directly on the drawing." },
  sending: { fr: "Envoi…", en: "Sending…" },
  sentImg: { fr: "Envoyé, avec l'image.", en: "Sent, with the image." },
  sent: { fr: "Envoyé.", en: "Sent." },
  offline: { fr: "Pas de connexion à la conversation. Copie ce texte :", en: "Not connected to the conversation. Copy this text:" },
  failed: { fr: "L'envoi n'a pas marché. Copie ce texte dans la conversation :", en: "Sending failed. Copy this text into the conversation:" },
  langLabel: { fr: "Langue", en: "Language" },
  schemaGroup: { fr: "Schéma", en: "Diagram" },
  sideGroup: { fr: "Côté", en: "Side" },
  brushGroup: { fr: "Pinceau", en: "Brush" },
  sizeGroup: { fr: "Taille du pinceau", en: "Brush size" },
  paintArea: { fr: "Zone de peinture", en: "Painting area" },
};
export const t = (k) => loc(UI[k]) || k;

// Titres des schémas latéralisés.
const LATERAL = {
  tete: { droite: { fr: "Tête, côté droit", en: "Head, right side" }, gauche: { fr: "Tête, côté gauche", en: "Head, left side" } },
  main: { droite: { fr: "Main droite", en: "Right hand" }, gauche: { fr: "Main gauche", en: "Left hand" } },
  pied: { droite: { fr: "Pied droit", en: "Right foot" }, gauche: { fr: "Pied gauche", en: "Left foot" } },
  genou: { droite: { fr: "Genou droit", en: "Right knee" }, gauche: { fr: "Genou gauche", en: "Left knee" } },
  epaule: { droite: { fr: "Épaule droite", en: "Right shoulder" }, gauche: { fr: "Épaule gauche", en: "Left shoulder" } },
};
export const lateralTitle = (schema, side) => (LATERAL[schema] ? loc(LATERAL[schema][side]) : null);

// Phrases des messages envoyés à Claude.
export const MSG = {
  intro: () => (lang === "en" ? "Here is where I painted on the diagram:" : "Voici où j'ai peint sur le schéma :"),
  outro: () =>
    lang === "en"
      ? "A patch is an area painted in one piece. Percentages in brackets show each zone's share of the patch."
      : "Une tache est une zone peinte d'un seul tenant. Les pourcentages entre parenthèses indiquent la part de chaque zone dans la tache.",
  patch: (i, share) => (lang === "en" ? `patch ${i} (${pct(share)} of the paint)` : `tache ${i} (${pct(share)} de la peinture)`),
  outside: () => (lang === "en" ? "partly outside the named zones, see the image" : "en partie hors des zones nommées, voir l'image"),
  strays: (n, where) => {
    const near = where.length ? (lang === "en" ? `, near: ${where.join("; ")}` : `, près de : ${where.join(" ; ")}`) : "";
    if (lang === "en") return `${n === 1 ? "1 small isolated touch ignored" : `${n} small isolated touches ignored`}${near}`;
    return `${n === 1 ? "1 petite touche isolée ignorée" : `${n} petites touches isolées ignorées`}${near}`;
  },
  straysShort: (n) =>
    lang === "en"
      ? `${n} small isolated touch${n > 1 ? "es" : ""} ignored`
      : `${n} petite${n > 1 ? "s" : ""} touche${n > 1 ? "s" : ""} isolée${n > 1 ? "s" : ""} ignorée${n > 1 ? "s" : ""}`,
  colon: () => (lang === "en" ? ":" : " :"),
  sep: () => (lang === "en" ? "; " : " ; "),
  context: (text) =>
    lang === "en"
      ? `Zones painted by the user on the body map (not sent yet):\n${text}`
      : `Zones peintes par l'utilisateur sur le schéma corporel (pas encore envoyées) :\n${text}`,
  contextEmpty: () => (lang === "en" ? "Nothing is painted on the body map yet." : "Rien n'est peint sur le schéma corporel pour l'instant."),
  upper: () => (lang === "en" ? "upper part" : "partie haute"),
  lower: () => (lang === "en" ? "lower part" : "partie basse"),
};

// Descriptions de gencive.
export function gumText(toothName, sides, onTooth) {
  // sides : sous-ensemble de ["lip", "cheek", "palate", "tongue"]
  const FR = { lip: "côté lèvre", cheek: "côté joue", palate: "côté palais", tongue: "côté langue" };
  const ENS = { lip: "lip", cheek: "cheek", palate: "palate", tongue: "tongue" };
  if (lang === "en") {
    const list = sides.map((s) => ENS[s]);
    const gum = `gum on the ${list.join(" and ")} side${list.length > 1 ? "s" : ""}`;
    return onTooth ? `${toothName}, with the ${gum}` : `${gum} of ${toothName}`;
  }
  const gum = `gencive ${sides.map((s) => FR[s]).join(" et ")}`;
  return onTooth ? `${toothName}, avec la ${gum}` : `${gum} de la ${toothName}`;
}
