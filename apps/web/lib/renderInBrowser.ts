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
    if (compiledFiles[id]) return id;
    if (id.startsWith(".")) {
      const relative = id.slice(id.startsWith("./") ? 2 : 1);
      const patterns = [
        `src/${relative}.tsx`,
        `src/${relative}.ts`,
        `${relative}.tsx`,
        `${relative}.ts`,
        `src/${relative}/index.tsx`,
        `src/${relative}/index.ts`,
        `${relative}/index.tsx`,
        `${relative}/index.ts`,
        `src/${relative}`,
        relative,
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

    if (modules[resolved]) return modules[resolved];

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
    (f) => f.endsWith(".tsx") && f !== "Root.tsx" && f !== "index.ts",
  );
  for (const f of sceneFiles) {
    requireModule(f);
  }

  const rootModule = requireModule("Root.tsx");
  const Root = rootModule.Root;

  if (!Root) {
    throw new Error(
      "Could not find Root component - ensure Root.tsx exports a component named 'Root'",
    );
  }

  const rootCode = compiledFiles["Root.tsx"];
  const compMatch = rootCode?.match(/component\s*=\s*\{(\w+)\}/);
  const innerCompName = compMatch?.[1];

  let RenderComponent: any = null;

  // Step 1: Try to find the inner component declared in <Composition component={X}>
  if (innerCompName) {
    if (rootModule[innerCompName]) {
      RenderComponent = rootModule[innerCompName];
    } else {
      // Search all modules for the named export
      for (const mod of Object.values(modules)) {
        if (typeof mod === "object" && mod !== null && mod[innerCompName]) {
          RenderComponent = mod[innerCompName];
          break;
        }
      }
    }
  }

  // Step 2: Validate that RenderComponent doesn't contain Composition
  if (RenderComponent && typeof RenderComponent === "function") {
    const fnStr = RenderComponent.toString();
    // If the component's source contains "Composition", it's unsafe to use
    if (fnStr.includes("Composition")) {
      console.warn(`[renderInBrowser] Component ${innerCompName} contains Composition reference, searching for alternative...`);
      RenderComponent = null;
    }
  }

  // Step 3: Fallback - find ANY exported component that isn't Root and doesn't render Composition
  if (!RenderComponent) {
    for (const [modulePath, mod] of Object.entries(modules)) {
      // Skip built-in modules and Root.tsx
      if (modulePath === "Root.tsx" || !modulePath.endsWith(".tsx")) continue;
      
      if (typeof mod === "object" && mod !== null) {
        for (const [key, val] of Object.entries(mod)) {
          if (key === "Root" || typeof val !== "function") continue;
          
          const fnStr = val.toString();
          // Skip if it contains Composition or createElement with Composition
          if (fnStr.includes("Composition")) continue;
          
          // Found a safe component
          RenderComponent = val;
          console.log(`[renderInBrowser] Using fallback component: ${key} from ${modulePath}`);
          break;
        }
      }
      if (RenderComponent) break;
    }
  }

  // Step 4: Last resort - create a safe placeholder that never nests Composition
  if (!RenderComponent || typeof RenderComponent !== "function") {
    console.warn("[renderInBrowser] No safe component found, using placeholder");
    RenderComponent = () => React.createElement(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#000",
          color: "#fff",
          fontSize: "48px",
          fontFamily: "Inter, sans-serif"
        }
      },
      "Render Error: No valid component found"
    );
  }

  onProgress?.({ percent: 5, stage: "Rendering video in browser..." });

  const { getBlob } = await renderMediaOnWeb({
    composition: {
      component: RenderComponent,
      durationInFrames: metadata.durationInFrames,
      fps: metadata.fps,
      width: metadata.width,
      height: metadata.height,
      calculateMetadata: null,
      id: "Main",
    },
    inputProps: {},
    onProgress: ({ encodedFrames, progress, renderEstimatedTime, doneIn }) => {
      // Convert 0-1 progress to 5-95%, reserve 95-100% for getBlob()
      const percent = Math.floor(5 + (progress * 90));
      
      if (doneIn !== null) {
        onProgress?.({ percent: 95, stage: "Finalizing video..." });
      } else if (encodedFrames !== null) {
        const remaining = renderEstimatedTime ? ` (${Math.ceil(renderEstimatedTime / 1000)}s remaining)` : '';
        onProgress?.({ 
          percent, 
          stage: `Encoding frame ${encodedFrames}/${metadata.durationInFrames}${remaining}` 
        });
      } else {
        onProgress?.({ percent, stage: "Rendering frames..." });
      }
    },
  });

  onProgress?.({ percent: 100, stage: "Download ready!" });

  return getBlob();
}
