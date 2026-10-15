import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import APP_HTML from "./app-html.js";

// The resource URI changes with every UI version so that hosts caching the
// resource load the new one. Older URIs keep being served (with the current
// content) for sessions that still have them in memory.
const RESOURCE_URI = `ui://pain-pointer/app-${createHash("sha256").update(APP_HTML).digest("hex").slice(0, 10)}.html`;
const LEGACY_URIS = ["ui://schema-corporel/app.html", "ui://schema-corporel/app-98e924acfe.html"];

// Internal ids are French; English aliases are accepted too.
const SCHEMA_ALIAS = { body: "corps", teeth: "dents", face: "visage", head: "tete", hand: "main", foot: "pied", knee: "genou", shoulder: "epaule" };
const SIDE_ALIAS = { right: "droite", left: "gauche" };
const SCHEMAS = ["corps", "dents", "visage", "tete", "main", "pied", "genou", "epaule"];

const LABELS = {
  corps: { fr: "corps de face et de dos", en: "body, front and back" },
  dents: { fr: "dentition", en: "teeth" },
  visage: { fr: "visage de face", en: "face, front view" },
  tete: { fr: "tête de profil", en: "head, side view" },
  main: { fr: "main (paume et dos)", en: "hand (palm and back)" },
  pied: { fr: "pied (dessus et plante)", en: "foot (top and sole)" },
  genou: { fr: "genou (devant et derrière)", en: "knee (front and back)" },
  epaule: { fr: "épaule (devant et arrière)", en: "shoulder (front and back)" },
};

export function createServer() {
  const server = new McpServer({ name: "Pain Pointer", version: "2.1.0" });

  registerAppTool(
    server,
    "show_body_map",
    {
      title: "Pain Pointer: body map to paint on",
      description:
        "Shows an anatomical drawing (body front/back, teeth seen from above, face, head in profile, hand, foot, knee, shoulder) " +
        "on which the user paints with a finger where a symptom is (pain, swelling, skin, numbness). " +
        "Use it when the user wants to show WHERE it hurts or where a problem is, or when you need to locate a symptom " +
        "they find hard to describe. The result then arrives in a user message: the painted zones with their anatomical name " +
        "and share (FDI tooth numbering, cheek/lip or palate/tongue side for gums), with an image of the painting when the app allows it. " +
        "The interface is available in French and English. It does not diagnose and stores nothing. " +
        "Affiche un schéma anatomique à peindre au doigt pour montrer où se situe un symptôme (interface en français et en anglais).",
      inputSchema: z.object({
        schema: z
          .enum([...SCHEMAS, ...Object.keys(SCHEMA_ALIAS)])
          .default("corps")
          .describe("Diagram to open first; the user can switch afterwards. French ids or English aliases (body, teeth, face, head, hand, foot, knee, shoulder)."),
        side: z.enum(["droite", "gauche", "right", "left"]).optional().describe("Body side, for head, hand, foot, knee and shoulder."),
        lang: z.enum(["fr", "en"]).optional().describe("Interface and message language. Use the user's language; defaults to the app's locale."),
      }),
      annotations: { readOnlyHint: true, openWorldHint: false },
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async ({ schema = "corps", side, lang }) => {
      const id = SCHEMA_ALIAS[schema] || schema;
      const s = SIDE_ALIAS[side] || side;
      const l = lang === "fr" || lang === "en" ? lang : null;
      const what = LABELS[id][l || "en"] + (s ? (l === "fr" ? `, côté ${s === "droite" ? "droit" : "gauche"}` : `, ${s === "droite" ? "right" : "left"} side`) : "");
      const text =
        l === "fr"
          ? `Schéma affiché : ${what}. L'utilisateur va peindre les endroits concernés puis les envoyer dans la conversation. Attends son message plutôt que de deviner.`
          : `Diagram shown: ${what}. The user will paint the relevant areas and send them to the conversation. Wait for their message rather than guessing.`;
      return {
        content: [{ type: "text", text }],
        structuredContent: { schema: id, side: s ?? null, lang: l },
      };
    },
  );

  for (const uri of [RESOURCE_URI, ...LEGACY_URIS]) {
    registerAppResource(server, uri === RESOURCE_URI ? "Pain Pointer" : `Pain Pointer (legacy address ${uri})`, uri, { mimeType: RESOURCE_MIME_TYPE }, async () => ({
      contents: [{ uri, mimeType: RESOURCE_MIME_TYPE, text: APP_HTML }],
    }));
  }

  return server;
}
