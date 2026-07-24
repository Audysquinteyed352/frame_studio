import { callLLM } from "./llmClient.js";
import { FIX_SYSTEM_PROMPT } from "./prompts/fixSystemPrompt.js";
import { CodeFileMapSchema, type CodeFileMap } from "./schemas.js";

export async function fixCode(
  files: CodeFileMap,
  error: string,
  modelName?: string
): Promise<CodeFileMap> {
  const userContent = JSON.stringify({
    currentFiles: files,
    compileError: error,
  }, null, 2);

  const messages = [
    { role: "system" as const, content: FIX_SYSTEM_PROMPT },
    { role: "user" as const, content: `Fix the following compilation error in the provided Remotion codebase:\n${userContent}` },
  ];

  const responseText = await callLLM(messages, true, modelName);
  const json = JSON.parse(responseText);
  return CodeFileMapSchema.parse(json);
}
