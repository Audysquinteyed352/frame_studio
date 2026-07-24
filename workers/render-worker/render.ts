import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

export interface RenderResult {
  videoBuffer: Buffer;
  durationSeconds: number;
}

export async function renderComposition(
  projectDir: string
): Promise<RenderResult> {
  const entryPoint = path.join(projectDir, "src/index.ts");
  console.log(`[Render] Bundling Remotion project at ${entryPoint}...`);

  const bundled = await bundle({
    entryPoint,
    webpackOverride: (config) => config,
  });

  console.log(`[Render] Bundle created at ${bundled}`);

  const composition = await selectComposition({
    serveUrl: bundled,
    id: "Main",
  });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "remotion-render-"));
  const mp4Path = path.join(tmpDir, "output.mp4");

  console.log(`[Render] Rendering video (${composition.durationInFrames} frames, ${composition.fps} fps)...`);

  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: "h264",
    outputLocation: mp4Path,
  });

  const durationSeconds = composition.durationInFrames / composition.fps;

  const videoBuffer = fs.readFileSync(mp4Path);

  // Cleanup temp folder
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (e) {
    // ignore
  }

  return {
    videoBuffer,
    durationSeconds,
  };
}
