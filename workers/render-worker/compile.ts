import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { CodeFileMap } from "pipeline";

const execAsync = promisify(exec);

export interface CompileResult {
  ok: boolean;
  error?: string;
  projectDir?: string;
}

const ALLOWED_IMPORTS = [
  "remotion",
  "react",
  "react-dom",
  "@remotion/google-fonts",
];

export function validateStaticImports(files: CodeFileMap): { ok: boolean; error?: string } {
  const importRegex = /import\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;

  for (const [filename, content] of Object.entries(files)) {
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      const isRelative = importPath.startsWith("./") || importPath.startsWith("../");
      const isAllowedPackage = ALLOWED_IMPORTS.some(
        (allowed) => importPath === allowed || importPath.startsWith(`${allowed}/`)
      );

      if (!isRelative && !isAllowedPackage) {
        return {
          ok: false,
          error: `Disallowed import "${importPath}" in ${filename}. Only 'remotion', 'react', 'react-dom', '@remotion/google-fonts', and relative files are permitted.`,
        };
      }
    }
  }

  return { ok: true };
}

export async function compileCode(
  files: CodeFileMap,
  skeletonDir: string
): Promise<CompileResult> {
  // 1. Static Import Check
  const staticCheck = validateStaticImports(files);
  if (!staticCheck.ok) {
    return { ok: false, error: staticCheck.error };
  }

  // 2. Prepare Sandbox Directory
  const sandboxDir = fs.mkdtempSync(path.join(os.tmpdir(), "remotion-sandbox-"));

  try {
    // Copy base skeleton (package.json, tsconfig.json, node_modules)
    fs.cpSync(skeletonDir, sandboxDir, { recursive: true });

    // Write file map into src/
    const srcDir = path.join(sandboxDir, "src");
    fs.mkdirSync(srcDir, { recursive: true });

    for (const [filename, content] of Object.entries(files)) {
      const filePath = path.join(srcDir, filename.replace(/^src\//, ""));
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content, "utf-8");
    }

    // 3. Execute TypeScript check with 90s timeout
    console.log(`[Compile Sandbox] Running tsc --noEmit in ${sandboxDir}...`);
    // Look for tsc in monorepo root node_modules first, then skeleton, then pnpm
    // skeletonDir: <repo>/packages/remotion-skeleton
    // monorepo root is two levels up from skeletonDir: <repo>/
    const rootTsc = path.resolve(skeletonDir, "../../node_modules/.bin/tsc");
    const rootTscCmd = path.resolve(skeletonDir, "../../node_modules/.bin/tsc.cmd");
    const skeletonTsc = path.resolve(skeletonDir, "node_modules/.bin/tsc");
    const skeletonTscCmd = path.resolve(skeletonDir, "node_modules/.bin/tsc.cmd");

    let tscCmd = "pnpm exec tsc";
    if (process.platform === "win32") {
      if (fs.existsSync(rootTscCmd)) tscCmd = `"${rootTscCmd}"`;
      else if (fs.existsSync(skeletonTscCmd)) tscCmd = `"${skeletonTscCmd}"`;
      else if (fs.existsSync(rootTsc)) tscCmd = `"${rootTsc}"`;
      else if (fs.existsSync(skeletonTsc)) tscCmd = `"${skeletonTsc}"`;
    } else {
      if (fs.existsSync(rootTsc)) tscCmd = `"${rootTsc}"`;
      else if (fs.existsSync(skeletonTsc)) tscCmd = `"${skeletonTsc}"`;
    }
    console.log(`[Compile Sandbox] Using tsc: ${tscCmd}`);

    await execAsync(`${tscCmd} --noEmit`, {
      cwd: sandboxDir,
      timeout: 90000, // 90 second hard timeout
    });

    return { ok: true, projectDir: sandboxDir };
  } catch (err: any) {
    const errorMsg = (err.stdout || "") + "\n" + (err.stderr || "") + "\n" + (err.message || "");
    return {
      ok: false,
      error: errorMsg.trim() || "Unknown TypeScript compilation error.",
      projectDir: sandboxDir,
    };
  }
}
