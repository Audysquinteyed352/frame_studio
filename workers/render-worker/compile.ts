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
    console.log(`[Compile Sandbox] Running TypeScript check in ${sandboxDir}...`);

    // Prefer using the installed `typescript` package programmatically (no external subprocess)
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ts = require("typescript");

      const configPath = ts.findConfigFile(sandboxDir, ts.sys.fileExists, "tsconfig.json");
      if (!configPath) {
        throw new Error("tsconfig.json not found in sandbox");
      }

      const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
      const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(configPath));

      const program = ts.createProgram(parsed.fileNames, parsed.options);
      const emitResult = program.emit();
      const diagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

      if (diagnostics && diagnostics.length > 0) {
        const formatted = diagnostics
          .map((d: any) => {
            const message = ts.flattenDiagnosticMessageText(d.messageText, "\n");
            if (d.file && typeof d.start === "number") {
              const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
              return `${d.file.fileName} (${line + 1},${character + 1}): ${message}`;
            }
            return message;
          })
          .join("\n");

        throw new Error(formatted);
      }

      return { ok: true, projectDir: sandboxDir };
    } catch (e) {
      // If programmatic typescript is not available or fails, fall back to external tsc invocation below
      console.log("[Compile Sandbox] Programmatic TypeScript check not available or failed, falling back to external tsc:", (e && e.message) || e);
    }
    // Look for tsc in monorepo root node_modules first, then skeleton, then local typescript bin, then npm/pnpm exec
    const rootTsc = path.resolve(skeletonDir, "../../node_modules/.bin/tsc");
    const rootTscCmd = path.resolve(skeletonDir, "../../node_modules/.bin/tsc.cmd");
    const skeletonTsc = path.resolve(skeletonDir, "node_modules/.bin/tsc");
    const skeletonTscCmd = path.resolve(skeletonDir, "node_modules/.bin/tsc.cmd");
    const rootTscNode = path.resolve(skeletonDir, "../../node_modules/typescript/bin/tsc");
    const skeletonTscNode = path.resolve(skeletonDir, "node_modules/typescript/bin/tsc");

    let tscCmd: string | null = null;

    // Prefer direct bin files (cmd on Windows)
    if (process.platform === "win32") {
      if (fs.existsSync(rootTscCmd)) tscCmd = `"${rootTscCmd}"`;
      else if (fs.existsSync(skeletonTscCmd)) tscCmd = `"${skeletonTscCmd}"`;
      else if (fs.existsSync(rootTsc)) tscCmd = `"${rootTsc}"`;
      else if (fs.existsSync(skeletonTsc)) tscCmd = `"${skeletonTsc}"`;
    } else {
      if (fs.existsSync(rootTsc)) tscCmd = `"${rootTsc}"`;
      else if (fs.existsSync(skeletonTsc)) tscCmd = `"${skeletonTsc}"`;
    }

    // If bin not found, prefer running the bundled typescript script with node
    if (!tscCmd) {
      if (fs.existsSync(rootTscNode)) tscCmd = `node "${rootTscNode}"`;
      else if (fs.existsSync(skeletonTscNode)) tscCmd = `node "${skeletonTscNode}"`;
    }

    // If still not found, try npm/pnpm exec (npm preferred because pnpm might not be present in runtimes)
    if (!tscCmd) {
      try {
        await execAsync("npm --version");
        tscCmd = "npm exec tsc";
      } catch (_err) {
        // npm not available, try pnpm
        try {
          await execAsync("pnpm --version");
          tscCmd = "pnpm exec tsc";
        } catch (_err2) {
          // nothing available
          throw new Error(
            "TypeScript compiler not found locally and neither npm nor pnpm are available to run it. Ensure 'typescript' is installed in the runtime or provide a local tsc binary."
          );
        }
      }
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
