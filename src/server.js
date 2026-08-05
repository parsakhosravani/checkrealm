import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkUrl } from "./check.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "checkrealm", time: new Date().toISOString() });
  });

  app.get("/api/check", async (req, res) => {
    const target = req.query.url;
    try {
      const result = await checkUrl(target);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: String(error?.message || error), input: target ?? null });
    }
  });

  app.use(express.static(path.join(__dirname, "..", "public")));

  return app;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const app = createApp();
  app.listen(PORT, HOST, () => {
    console.log(`CheckRealm listening on http://${HOST}:${PORT}`);
  });
}
