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
    webpackOverride: (config) => {
      // Ensure bundler resolves modules from the main project's node_modules
      config.resolve = config.resolve || {};
      config.resolve.modules = config.resolve.modules || [];
      const hostNodeModules = path.join(process.cwd(), "node_modules");
      if (!config.resolve.modules.includes(hostNodeModules)) {
        config.resolve.modules.unshift(hostNodeModules);
      }

      // Alias @remotion/google-fonts to the host installation so subpaths
      // like '@remotion/google-fonts/Inter' can be resolved when the sandbox
      // doesn't have its own node_modules installed.
      // Cast to any because webpack types allow multiple shapes for alias
      (config.resolve as any).alias = (config.resolve as any).alias || {};
      try {
        const googleFontsPath = path.join(process.cwd(), "node_modules", "@remotion", "google-fonts");
        if (fs.existsSync(googleFontsPath)) {
          (config.resolve as any).alias["@remotion/google-fonts"] = googleFontsPath;
        }
      } catch (e) {
        // ignore aliasing if it fails
      }

      return config;
    },
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
