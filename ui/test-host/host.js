import { AppBridge, PostMessageTransport } from "@modelcontextprotocol/ext-apps/app-bridge";
import html from "../dist/mcp-app.html?raw";
window.__messages = []; window.__ctx = []; window.__ready = false; window.__modes = [];
const f = document.getElementById("f");
const mobile = location.search.includes("mobile");
const bridge = new AppBridge(null, { name: "test-host", version: "1" },
  { message: { text: {}, image: {} }, updateModelContext: { text: {} } },
  { hostContext: { theme: "light", displayMode: "inline", availableDisplayModes: ["inline", "fullscreen"], platform: mobile ? "mobile" : "web", locale: new URLSearchParams(location.search).get("locale") || "fr-FR", containerDimensions: { width: 400, height: 900 } } });
bridge.onmessage = async (p) => { window.__messages.push(p); return {}; };
bridge.onupdatemodelcontext = async (p) => { window.__ctx.push(p); return {}; };
bridge.onrequestdisplaymode = async ({ mode }) => { window.__modes.push(mode); bridge.setHostContext({ displayMode: mode }); return { mode }; };
bridge.oninitialized = () => { window.__ready = true; bridge.sendToolInput({ arguments: { schema: "dents" } }); };
f.srcdoc = html;
f.onload = () => bridge.connect(new PostMessageTransport(f.contentWindow, f.contentWindow));
