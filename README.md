# Pain Pointer MCP

*[Version française](README.fr.md)*

An MCP App server that shows anatomical drawings in Claude that you paint on with your finger: body (front and back), teeth seen from above, face, head in profile, hand, foot, knee and shoulder. One brush per symptom (pain, swelling, skin, numbness), an eraser, undo and full screen. "Send to Claude" posts the painted zones into the conversation with their anatomical name and share, plus an image of the painting when the host accepts images. Zones are computed from invisible named regions under the drawing.

The interface and the messages are available in English and French. The language follows the app's locale, the `lang` argument of the tool, or the FR/EN toggle.

The server is stateless: nothing is stored.

## Use it in Claude

1. In Claude (web or desktop), open Customize > Connectors, then "+ Add" > "Add custom connector".
2. Paste the server address, `https://<your-project>.vercel.app/mcp`, and choose "No sign in".
3. In a conversation, enable the connector and ask, for example, "show me the teeth diagram".

A connector added on web or desktop then shows up on mobile.

## The tool

`show_body_map` takes three optional arguments:

- `schema`: `corps`, `dents`, `visage`, `tete`, `main`, `pied`, `genou`, `epaule`, or the English aliases `body`, `teeth`, `face`, `head`, `hand`, `foot`, `knee`, `shoulder`.
- `side`: `droite`/`gauche` or `right`/`left`, for head, hand, foot, knee and shoulder.
- `lang`: `fr` or `en`.

Teeth use FDI numbering. For gums, the message says which side was painted: cheek or lip on the outside, palate or tongue on the inside.

## Structure

- `server/`: what gets deployed. Vercel function `api/mcp.js` (Streamable HTTP, stateless), rewritten to `/mcp`. The UI is embedded in `lib/app-html.js`.
- `ui/`: UI source. `src/assets/` holds the drawings, `src/catalog.js` assembles them and names the zones, `src/i18n.js` holds the translations, `src/main.js` handles painting, analysis and sending. `test-host/` is a minimal MCP Apps host for end-to-end tests.

## Deploy

From the command line:

```bash
cd server
npm install
npx vercel --prod
```

Or connect this repository to Vercel with **Root Directory** set to `server`: every push to `main` then redeploys.

In both cases, turn off Vercel Deployment Protection for the project, otherwise Claude gets a login page instead of the server.

## Edit the drawings or the interface

```bash
cd ui
npm install
npm run build
npm run embed
```

`embed` copies the built UI into `server/lib/app-html.js`. Commit that file, then redeploy. Local test: `cd server && npm run dev`, endpoint `http://localhost:3001/mcp`.

The UI resource address changes with each UI version (a hash of its content), so hosts that cache the UI load the new one. They only do so after reloading the tool list, which usually means a new conversation.

## Orientation conventions

- Body front, face, teeth (both jaws seen from above): the person's right is on the left of the screen.
- Body back, and the back views of the knee and shoulder: seen from behind.
- Knee and shoulder front: zoom on the body seen from the front.
- Hand and foot (top): as you look at your own hand or foot. Sole: seen from below.

## Drawing credits

- Body (front, back, knee and shoulder zooms): react-native-body-highlighter v3.2.0, © 2022 ELABBASSI Hicham, MIT licence.
- Teeth: react-odontogram v0.6.0, © Pratik Sharma (biomathcode), MIT licence.
- Face, head in profile, hand, foot: original drawings from this project.

Full licence texts are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
