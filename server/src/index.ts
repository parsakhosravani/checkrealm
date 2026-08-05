import express from "express";
import cors from "cors";
import { checkUrl, normalizeUrl } from "./checker.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "checkrealm", time: new Date().toISOString() });
});

app.post("/api/check", async (req, res) => {
  const { url } = (req.body ?? {}) as { url?: unknown };
  if (typeof url !== "string" || !url.trim()) {
    res.status(400).json({ error: "Body must include a non-empty 'url' string." });
    return;
  }
  try {
    normalizeUrl(url);
  } catch {
    res.status(400).json({ error: "Invalid URL." });
    return;
  }
  const result = await checkUrl(url);
  res.json(result);
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`[checkrealm] API listening on http://localhost:${port}`);
});
