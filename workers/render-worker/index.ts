import express from "express";
import { renderComposition } from "./render.js";
import { compileCode } from "./compile.js";
import path from "node:path";
import fs from "node:fs";

const app = express();
app.use(express.json({ limit: "50mb" }));

function resolveSkeletonDir() {
  const configured = process.env.SKELETON_DIR?.trim();
  if (configured && fs.existsSync(configured)) {
    return configured;
  }

  const candidates = [
    path.resolve(process.cwd(), "../packages/remotion-skeleton"),
    path.resolve(process.cwd(), "../../packages/remotion-skeleton"),
    path.resolve(process.cwd(), "packages/remotion-skeleton"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Could not locate packages/remotion-skeleton. Checked: ${candidates.join(", ")}`
  );
}

app.post("/render", async (req, res) => {
  try {
    const files = req.body.files;
    if (!files || typeof files !== "object") {
      return res.status(400).json({ error: "Missing or invalid files payload." });
    }

    const skeletonDir = resolveSkeletonDir();
    const compileResult = await compileCode(files, skeletonDir);
    if (!compileResult.ok || !compileResult.projectDir) {
      return res.status(500).json({ error: compileResult.error || "Compilation failed." });
    }

    const renderResult = await renderComposition(compileResult.projectDir);
    return res.json({
      mp4: renderResult.videoBuffer.toString("base64"),
      durationSeconds: renderResult.durationSeconds,
    });
  } catch (err: any) {
    console.error("[Render Worker] Error:", err);
    res.status(500).json({ error: err?.message || "Worker error" });
  }
});

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(port, () => {
  console.log(`[Render Worker] Listening on port ${port}`);
});
