import path from "node:path";
import { compileCode } from "./compile.ts";
import { renderComposition } from "./render.ts";

async function main() {
  const skeletonDir = path.resolve(process.cwd(), "../../packages/remotion-skeleton");
  console.log("Skeleton dir:", skeletonDir);

  const compileResult = await compileCode({}, skeletonDir);
  if (!compileResult.ok) {
    console.error("Compile failed:", compileResult.error);
    process.exit(1);
  }

  console.log("Compile OK:", compileResult.projectDir);

  const renderResult = await renderComposition(compileResult.projectDir!);
  console.log(
    "Render OK:",
    renderResult.durationSeconds,
    "seconds,",
    renderResult.videoBuffer.length,
    "bytes"
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
