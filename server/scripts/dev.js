// Local test server: http://localhost:3001/mcp
import http from "node:http";
import handler from "../api/mcp.js";

http
  .createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        req.body = body ? JSON.parse(body) : undefined;
      } catch {
        req.body = undefined;
      }
      handler(req, res);
    });
  })
  .listen(3001, () => console.log("Local MCP: http://localhost:3001/mcp"));
