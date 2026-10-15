import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
const dir = fileURLToPath(new URL(".", import.meta.url));
export default defineConfig({ root: dir, build: { outDir: "dist", emptyOutDir: true, rollupOptions: { input: dir + "host.html" } } });
