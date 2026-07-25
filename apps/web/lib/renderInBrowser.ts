"use client";

import { renderMediaOnWeb } from "@remotion/web-renderer";
import * as remotion from "remotion";
import React from "react";
import * as ReactDOM from "react-dom";

interface VideoMetadata {
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  durationSeconds: number;
}

export interface RenderProgress {
  percent: number;
  stage: string;
}

type ProgressCallback = (progress: RenderProgress) => void;

function evaluateCjs(code: string, requireFn: (id: string) => any): any {
  const exports: any = {};
  const mod = { exports };

  const fn = new Function("require", "exports", "module", code);
  fn(requireFn, exports, mod);

  return mod.exports;
}

function createGoogleFontShim(fontName: string): any {
  return {
    loadFont: () => ({ fontFamily: fontName }),
    fontFamily: fontName,
  };
}

export async function renderVideoInBrowser(
  compiledFiles: Record<string, string>,
  metadata: VideoMetadata,
  onProgress?: ProgressCallback,
): Promise<Blob> {
  const jsxRuntime = await import("react/jsx-runtime");

  const modules: Record<string, any> = {
    remotion,
    react: React,
    "react-dom": ReactDOM,
    "react/jsx-runtime": jsxRuntime,
    "@remotion/google-fonts": { loadFont: () => ({ fontFamily: "Inter" }) },
  };

  function resolveImportPath(id: string): string | null {
    if (modules[id]) return id;
    if (id.startsWith(".")) {
      const relative = id.slice(id.startsWith("./") ? 2 : 1);
      const patterns = [
        `src/${relative}.tsx`,
        `src/${relative}.ts`,
        `src/${relative}/index.tsx`,
        `src/${relative}/index.ts`,
        `src/${relative}`,
      ];
      for (const p of patterns) {
        if (compiledFiles[p]) return p;
      }
    }
    if (id.startsWith("@remotion/google-fonts/")) {
      const fontName = id.split("/").pop()!;
      modules[id] = createGoogleFontShim(fontName);
      return id;
    }
    return null;
  }

  const evaluated = new Set<string>();

  function requireModule(id: string): any {
    const cached = modules[id];
    if (cached) return cached;

    const resolved = resolveImportPath(id);
    if (!resolved) {
      throw new Error(`Module not found: ${id}`);
    }

    if (evaluated.has(resolved)) {
      return modules[resolved];
    }

    const code = compiledFiles[resolved];
    if (!code) {
      throw new Error(`Module source not found: ${resolved}`);
    }

    evaluated.add(resolved);
    modules[resolved] = {};
    const result = evaluateCjs(code, requireModule);
    modules[resolved] = result;
    return result;
  }

  onProgress?.({ percent: 0, stage: "Evaluating modules..." });

  const sceneFiles = Object.keys(compiledFiles).filter(
    (f) => f.startsWith("src/") && f !== "src/Root.tsx" && f !== "src/index.ts",
  );
  for (const f of sceneFiles) {
    requireModule(f);
  }

  const rootModule = requireModule("src/Root.tsx");
  const Root = rootModule.Root;

  if (!Root) {
    throw new Error(
      "Could not find Root component - ensure src/Root.tsx exports a component named 'Root'",
    );
  }

  onProgress?.({ percent: 5, stage: "Rendering video in browser..." });

  const { getBlob } = await renderMediaOnWeb({
    composition: {
      component: Root,
      durationInFrames: metadata.durationInFrames,
      fps: metadata.fps,
      width: metadata.width,
      height: metadata.height,
      calculateMetadata: null,
      id: "Main",
    },
    inputProps: {},
  });

  onProgress?.({ percent: 100, stage: "Downloading..." });

  return getBlob();
}
