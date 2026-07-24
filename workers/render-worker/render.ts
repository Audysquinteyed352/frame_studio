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
      let currentDir = process.cwd();
      let hostNodeModules: string | null = null;
      while (true) {
        const candidate = path.join(currentDir, "node_modules");
        if (fs.existsSync(candidate)) {
          hostNodeModules = candidate;
          break;
        }
        const parent = path.dirname(currentDir);
        if (parent === currentDir) {
          break;
        }
        currentDir = parent;
      }
      if (hostNodeModules && !config.resolve.modules.includes(hostNodeModules)) {
        config.resolve.modules.unshift(hostNodeModules);
        // On platforms like Render.com with pnpm, we need to explicitly allow resolving from pnpm store's hidden node_modules
        const pnpmNodeModules = path.join(hostNodeModules, ".pnpm", "node_modules");
        if (fs.existsSync(pnpmNodeModules)) {
          config.resolve.modules.push(pnpmNodeModules);
        }
      }

      // Alias @remotion/google-fonts to the host installation so subpaths
      // like '@remotion/google-fonts/Inter' can be resolved when the sandbox
      // doesn't have its own node_modules installed.
      // Cast to any because webpack types allow multiple shapes for alias
      (config.resolve as any).alias = (config.resolve as any).alias || {};
      try {
        const googleFontsPath = hostNodeModules
          ? path.join(hostNodeModules, "@remotion", "google-fonts", "dist", "cjs")
          : path.join(process.cwd(), "node_modules", "@remotion", "google-fonts", "dist", "cjs");
        if (fs.existsSync(googleFontsPath)) {
          (config.resolve as any).alias["@remotion/google-fonts"] = googleFontsPath;
        }
      } catch (e) {
        // ignore aliasing if it fails
      }

      // Fix for @remotion/studio-shared resolution in v4.0.x
      (config.resolve as any).alias = (config.resolve as any).alias || {};
      (config.resolve as any).browser = (config.resolve as any).browser || {};
      try {
        const studioSharedPath = hostNodeModules
          ? path.join(hostNodeModules, "@remotion", "studio-shared")
          : path.join(process.cwd(), "node_modules", "@remotion", "studio-shared");
        if (fs.existsSync(studioSharedPath)) {
          (config.resolve as any).alias["@remotion/studio-shared"] = studioSharedPath;
          // Fix browser field issue
          (config.resolve as any).browser = (config.resolve as any).browser || {};
          (config.resolve as any).browser["@remotion/studio-shared"] = studioSharedPath;
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
