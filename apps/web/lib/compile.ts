import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { transform } from "esbuild";
import type { CodeFileMap } from "pipeline";

const execAsync = promisify(exec);

export interface CompileResult {
  ok: boolean;
  error?: string;
  compiledFiles?: Record<string, string>;
}

const ALLOWED_IMPORTS = [
  "remotion",
  "react",
  "react-dom",
  "@remotion/google-fonts",
];

export function validateStaticImports(
  files: CodeFileMap,
): { ok: boolean; error?: string } {
  const importRegex = /import\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;

  for (const [filename, content] of Object.entries(files)) {
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1] ?? "";
      const isRelative =
        importPath.startsWith("./") || importPath.startsWith("../");
      const isAllowedPackage = ALLOWED_IMPORTS.some(
        (allowed) =>
          importPath === allowed || importPath.startsWith(`${allowed}/`),
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

export async function compileToJs(
  files: CodeFileMap,
): Promise<Record<string, string>> {
  const compiled: Record<string, string> = {};
  for (const [filename, code] of Object.entries(files)) {
    if (typeof code !== "string") {
      console.warn(`[Compile] Skipping ${filename}: content is ${typeof code}`);
      continue;
    }
    if (!filename.endsWith(".ts") && !filename.endsWith(".tsx")) {
      compiled[filename] = code;
      continue;
    }
    try {
      const result = await transform(code, {
        loader: filename.endsWith(".tsx") ? "tsx" : "ts",
        format: "cjs",
        jsx: "automatic",
        target: "es2020",
        sourcemap: false,
      });
      compiled[filename] = result.code;
    } catch (transformErr: any) {
      console.warn(`[Compile] esbuild transform failed for ${filename}: ${transformErr.message}`);
      throw transformErr;
    }
  }
  return compiled;
}

export async function compileCode(
  files: CodeFileMap,
  skeletonDir: string,
): Promise<CompileResult> {
  const staticCheck = validateStaticImports(files);
  if (!staticCheck.ok) {
    return { ok: false, error: staticCheck.error };
  }

  const tmpDir = path.join(os.tmpdir(), "frame-studio-compile");
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  const sandboxDir = fs.mkdtempSync(path.join(tmpDir, "sandbox-"));

  try {
    fs.cpSync(skeletonDir, sandboxDir, { recursive: true });

    const srcDir = path.join(sandboxDir, "src");
    fs.mkdirSync(srcDir, { recursive: true });

    for (const [filename, content] of Object.entries(files) as Array<
      [string, string]
    >) {
      const filePath = path.join(srcDir, filename.replace(/^src\//, ""));
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content, "utf-8");
    }

    const isServerless =
      !!process.env.VERCEL ||
      !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
      !!process.env.FUNCTIONS_WORKER_RUNTIME;
    if (!isServerless) {
      try {
        const ts = require("typescript");
        const configPath = ts.findConfigFile(
          sandboxDir,
          ts.sys.fileExists,
          "tsconfig.json",
        );
        if (configPath) {
          const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
          const parsed = ts.parseJsonConfigFileContent(
            configFile.config,
            ts.sys,
            path.dirname(configPath),
          );
          const program = ts.createProgram(parsed.fileNames, parsed.options);
          const emitResult = program.emit();
          const diagnostics = ts
            .getPreEmitDiagnostics(program)
            .concat(emitResult.diagnostics);

          if (diagnostics && diagnostics.length > 0) {
            const formatted = diagnostics
              .map((d: any) => {
                const message = ts.flattenDiagnosticMessageText(
                  d.messageText,
                  "\n",
                );
                if (d.file && typeof d.start === "number") {
                  const { line, character } =
                    d.file.getLineAndCharacterOfPosition(d.start);
                  return `${d.file.fileName} (${line + 1},${character + 1}): ${message}`;
                }
                return message;
              })
              .join("\n");
            throw new Error(formatted);
          }
        }
      } catch (e) {
        const errMsg =
          e && (e as any).message ? (e as any).message : String(e);
        console.log(
          "[Compile] Programmatic TS check failed:",
          errMsg,
        );
      }
    }

    const compiledFiles = await compileToJs(files);

    return { ok: true, compiledFiles };
  } catch (err: any) {
    const errorMsg =
      (err.stdout || "") + "\n" + (err.stderr || "") + "\n" + (err.message || "");
    return {
      ok: false,
      error: errorMsg.trim() || "Unknown TypeScript compilation error.",
    };
  } finally {
    try {
      fs.rmSync(sandboxDir, { recursive: true, force: true });
    } catch {
      //
    }
  }
}
