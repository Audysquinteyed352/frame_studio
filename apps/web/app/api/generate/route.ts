import { NextRequest, NextResponse } from "next/server";
import { getApiKey } from "@/lib/apiKey";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { planFromPrompt, generateCode, fixCode, type Brief, type CodeFileMap } from "pipeline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveSkeletonDir() {
  const candidates = [
    path.resolve(process.cwd(), "packages/remotion-skeleton"),
    path.resolve(process.cwd(), "../packages/remotion-skeleton"),
    path.resolve(process.cwd(), "../../packages/remotion-skeleton"),
    path.resolve(process.cwd(), "../../../packages/remotion-skeleton"),
    path.resolve(__dirname, "../../../../../packages/remotion-skeleton"),
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

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for render

export async function POST(req: NextRequest) {
  try {
    const skeletonDir = resolveSkeletonDir();
    const body = await req.json();
    const prompt = body.prompt?.trim();
    const model = body.model?.trim() || "gemini-3.5-flash";
    const clientApiKey = body.apiKey?.trim();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    // Check for API key: first from request body, then from cookies, finally from env
    const apiKey = clientApiKey || (await getApiKey()) || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key required. Please provide your Gemini API key." },
        { status: 401 }
      );
    }

    console.log(`\n[Generate] Starting generation for prompt: "${prompt}"`);
    console.log(`[Generate] Model: ${model}`);

    // Set API key in environment for LLM calls
    process.env.GEMINI_API_KEY = apiKey;

    // STAGE 1: PLAN
    console.log(`[Generate] STAGE: Planning...`);
    const planResult = await planFromPrompt(prompt, model);

    if (!planResult.valid) {
      console.log(`[Generate] Request rejected: ${planResult.reason}`);
      return NextResponse.json(
        { error: planResult.reason },
        { status: 400 }
      );
    }

    const brief: Brief = planResult.brief;
    console.log(`[Generate] Planning complete. Scenes: ${brief.scenes.length}`);

    // STAGE 2: CODEGEN
    console.log(`[Generate] STAGE: Generating Code...`);
    let code: CodeFileMap = await generateCode(brief, [], model);
    console.log(`[Generate] Codegen complete. Files: ${Object.keys(code).join(", ")}`);

    // STAGE 3 & 4: COMPILE & FIX LOOP
    console.log(`[Generate] STAGE: Compiling...`);
    const { compileCode } = await import("../../../../../workers/render-worker/compile");
    let currentCode = { ...code };
    let attempt = 0;
    let compiledProjectDir: string | null = null;
    const maxRetries = 3;

    while (attempt <= maxRetries) {
      const compileResult = await compileCode(currentCode, skeletonDir);

      if (compileResult.ok) {
        console.log(`[Generate] Compilation succeeded on attempt ${attempt}`);
        compiledProjectDir = compileResult.projectDir!;
        code = currentCode;
        break;
      }

      attempt++;
      console.warn(`[Generate] Compilation failed (attempt ${attempt}/${maxRetries}):`);
      console.warn(compileResult.error);

      if (attempt > maxRetries) {
        return NextResponse.json(
          {
            error: `Compilation failed after ${maxRetries} attempts: ${compileResult.error}`,
          },
          { status: 500 }
        );
      }

      console.log(`[Generate] Calling Fix AI for attempt ${attempt}...`);
      currentCode = await fixCode(currentCode, compileResult.error!, model);
    }

    if (!compiledProjectDir) {
      throw new Error("Missing compiled project directory");
    }

    // STAGE 5: RENDERING
    console.log(`[Generate] STAGE: Rendering MP4 & Thumbnail...`);
    const { renderComposition } = await import("../../../../../workers/render-worker/render");
    const renderResult = await renderComposition(compiledProjectDir);
    console.log(`[Generate] Rendering complete. Duration: ${renderResult.durationSeconds}s`);

    // Return video as direct download
    return new NextResponse(renderResult.videoBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="frame-studio-${Date.now()}.mp4"`,
        "X-Duration": renderResult.durationSeconds.toString(),
      },
    });
  } catch (err: any) {
    console.error("[Generate] Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
