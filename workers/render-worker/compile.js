import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { exec } from "node:child_process";
import { promisify } from "node:util";
const execAsync = promisify(exec);
const ALLOWED_IMPORTS = [
    "remotion",
    "react",
    "react-dom",
    "@remotion/google-fonts",
];
function findNearestNodeModules(startDir) {
    let currentDir = startDir;
    while (true) {
        const candidate = path.join(currentDir, "node_modules");
        if (fs.existsSync(candidate)) {
            return candidate;
        }
        const parent = path.dirname(currentDir);
        if (parent === currentDir) {
            break;
        }
        currentDir = parent;
    }
    return null;
}
export function validateStaticImports(files) {
    const importRegex = /import\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;
    for (const [filename, content] of Object.entries(files)) {
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1] ?? "";
            const isRelative = importPath.startsWith("./") || importPath.startsWith("../");
            const isAllowedPackage = ALLOWED_IMPORTS.some((allowed) => importPath === allowed || importPath.startsWith(`${allowed}/`));
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
export async function compileCode(files, skeletonDir) {
    // 1. Static Import Check
    const staticCheck = validateStaticImports(files);
    if (!staticCheck.ok) {
        return { ok: false, error: staticCheck.error };
    }
    // 2. Prepare Sandbox Directory
    const sandboxDir = fs.mkdtempSync(path.join(os.tmpdir(), "remotion-sandbox-"));
    try {
        // Copy base skeleton files into sandbox
        fs.cpSync(skeletonDir, sandboxDir, { recursive: true });
        const nearestNodeModules = findNearestNodeModules(process.cwd()) || findNearestNodeModules(skeletonDir);
        const hostNodeModules = nearestNodeModules ?? path.join(process.cwd(), "node_modules");
        const sandboxNodeModules = path.join(sandboxDir, "node_modules");
        if (fs.existsSync(hostNodeModules)) {
            try {
                if (fs.existsSync(sandboxNodeModules)) {
                    fs.rmSync(sandboxNodeModules, { recursive: true, force: true });
                }
                fs.symlinkSync(hostNodeModules, sandboxNodeModules, process.platform === "win32" ? "junction" : "dir");
                console.log("[Compile Sandbox] Symlinked sandbox node_modules to host node_modules.");
            }
            catch (e) {
                console.log("[Compile Sandbox] Could not symlink host node_modules into sandbox, falling back to vendoring:", e.message || e);
            }
        }
        else {
            console.log(`[Compile Sandbox] No host node_modules found from ${process.cwd()} or ${skeletonDir}, skipping symlink.`);
        }
        // Write file map into src/
        const srcDir = path.join(sandboxDir, "src");
        fs.mkdirSync(srcDir, { recursive: true });
        for (const [filename, content] of Object.entries(files)) {
            const filePath = path.join(srcDir, filename.replace(/^src\//, ""));
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, content, "utf-8");
        }
        // Ensure sandbox has required runtime packages available by vendoring specific
        // host-installed packages when symlinking host node_modules is unavailable.
        try {
            const pkgToVendor = ["@remotion/google-fonts"];
            const sandboxNodeModulesDir = path.join(sandboxDir, "node_modules");
            if (!fs.existsSync(sandboxNodeModulesDir)) {
                fs.mkdirSync(sandboxNodeModulesDir, { recursive: true });
            }
            const nearestNodeModules = findNearestNodeModules(process.cwd()) || findNearestNodeModules(skeletonDir);
            const hostNodeModules = nearestNodeModules ?? path.join(process.cwd(), "node_modules");
            for (const pkg of pkgToVendor) {
                const hostPkgPath = path.join(hostNodeModules, ...pkg.split("/"));
                const sandboxPkgPath = path.join(sandboxNodeModulesDir, ...pkg.split("/"));
                if (fs.existsSync(hostPkgPath)) {
                    fs.mkdirSync(path.dirname(sandboxPkgPath), { recursive: true });
                    fs.cpSync(hostPkgPath, sandboxPkgPath, { recursive: true });
                    console.log(`[Compile Sandbox] Vendored ${pkg} into sandbox node_modules`);
                }
                else {
                    console.log(`[Compile Sandbox] Host package ${pkg} not found at ${hostPkgPath}, skipping vendoring.`);
                }
            }
        }
        catch (e) {
            console.log("[Compile Sandbox] Failed to vendor host packages into sandbox:", e.message || e);
        }
        // 3. Execute TypeScript check with 90s timeout
        console.log(`[Compile Sandbox] Running TypeScript check in ${sandboxDir}...`);
        // Detect serverless/restricted runtimes (Vercel, Lambda, etc.) where running
        // external package managers or relying on global node_modules layout is unsafe.
        const isServerless = !!process.env.VERCEL ||
            !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
            !!process.env.FUNCTIONS_WORKER_RUNTIME ||
            !!process.env.K_REVISION ||
            !!process.env.GCP_PROJECT ||
            !!process.env.GAE_APPLICATION ||
            // presence of typical serverless deploy root
            fs.existsSync("/var/task") ||
            // Vercel sandbox home path pattern
            (process.env.HOME && process.env.HOME.startsWith("/home/sbx_user"));
        if (isServerless) {
            console.log("[Compile Sandbox] Serverless environment detected — skipping TypeScript check to avoid network/npm operations.");
            return { ok: true, projectDir: sandboxDir };
        }
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
                    .map((d) => {
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
        }
        catch (e) {
            // If programmatic typescript is not available or fails, fall back to external tsc invocation below
            const errMsg = e && e.message ? e.message : e;
            console.log("[Compile Sandbox] Programmatic TypeScript check not available or failed, falling back to external tsc:", errMsg);
        }
        // Look for tsc in monorepo root node_modules first, then skeleton, then local typescript bin, then npm/pnpm exec
        const rootTsc = path.resolve(skeletonDir, "../../node_modules/.bin/tsc");
        const rootTscCmd = path.resolve(skeletonDir, "../../node_modules/.bin/tsc.cmd");
        const skeletonTsc = path.resolve(skeletonDir, "node_modules/.bin/tsc");
        const skeletonTscCmd = path.resolve(skeletonDir, "node_modules/.bin/tsc.cmd");
        const rootTscNode = path.resolve(skeletonDir, "../../node_modules/typescript/bin/tsc");
        const skeletonTscNode = path.resolve(skeletonDir, "node_modules/typescript/bin/tsc");
        let tscCmd = null;
        // Prefer direct bin files (cmd on Windows)
        if (process.platform === "win32") {
            if (fs.existsSync(rootTscCmd))
                tscCmd = `"${rootTscCmd}"`;
            else if (fs.existsSync(skeletonTscCmd))
                tscCmd = `"${skeletonTscCmd}"`;
            else if (fs.existsSync(rootTsc))
                tscCmd = `"${rootTsc}"`;
            else if (fs.existsSync(skeletonTsc))
                tscCmd = `"${skeletonTsc}"`;
        }
        else {
            if (fs.existsSync(rootTsc))
                tscCmd = `"${rootTsc}"`;
            else if (fs.existsSync(skeletonTsc))
                tscCmd = `"${skeletonTsc}"`;
        }
        // If bin not found, prefer running the bundled typescript script with node
        if (!tscCmd) {
            if (fs.existsSync(rootTscNode))
                tscCmd = `node "${rootTscNode}"`;
            else if (fs.existsSync(skeletonTscNode))
                tscCmd = `node "${skeletonTscNode}"`;
        }
        // If still not found, try npm/pnpm exec (npm preferred because pnpm might not be present in runtimes)
        if (!tscCmd) {
            try {
                await execAsync("npm --version");
                tscCmd = "npm exec tsc";
            }
            catch (_err) {
                // npm not available, try pnpm
                try {
                    await execAsync("pnpm --version");
                    tscCmd = "pnpm exec tsc";
                }
                catch (_err2) {
                    // nothing available
                    throw new Error("TypeScript compiler not found locally and neither npm nor pnpm are available to run it. Ensure 'typescript' is installed in the runtime or provide a local tsc binary.");
                }
            }
        }
        console.log(`[Compile Sandbox] Using tsc: ${tscCmd}`);
        await execAsync(`${tscCmd} --noEmit`, {
            cwd: sandboxDir,
            timeout: 90000, // 90 second hard timeout
        });
        return { ok: true, projectDir: sandboxDir };
    }
    catch (err) {
        const errorMsg = (err.stdout || "") + "\n" + (err.stderr || "") + "\n" + (err.message || "");
        return {
            ok: false,
            error: errorMsg.trim() || "Unknown TypeScript compilation error.",
            projectDir: sandboxDir,
        };
    }
}
