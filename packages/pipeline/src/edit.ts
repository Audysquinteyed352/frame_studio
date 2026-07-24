import { callLLM } from "./llmClient";
import { EDIT_SYSTEM_PROMPT } from "./prompts/editSystemPrompt";
import { CodeFileMapSchema, type Brief, type CodeFileMap } from "./schemas";
import { ensureRootFile } from "./codegen";

// Let's implement filename cleaning in editCode
export async function editCode(
  priorBrief: Brief,
  priorCode: CodeFileMap,
  instruction: string,
  modelName?: string
): Promise<CodeFileMap> {
  const userContent = JSON.stringify({
    priorBrief,
    priorCode,
    instruction,
  }, null, 2);

  const messages = [
    { role: "system" as const, content: EDIT_SYSTEM_PROMPT },
    { role: "user" as const, content: `Apply the following edit instruction to the Remotion video project:\n${userContent}` },
  ];

  const responseText = await callLLM(messages, true, modelName);
  const json = JSON.parse(responseText);
  const files = CodeFileMapSchema.parse(json);

  const cleanedFiles: CodeFileMap = {};
  for (const [key, val] of Object.entries(files)) {
    const cleanKey = key.replace(/^src\//, "");
    cleanedFiles[cleanKey] = val;
  }

  return ensureRootFile(cleanedFiles, priorBrief);
}
