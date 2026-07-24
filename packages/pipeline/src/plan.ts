import { callLLM } from "./llmClient";
import { PLAN_SYSTEM_PROMPT } from "./prompts/planSystemPrompt";
import { PlanResultSchema, type PlanResult } from "./schemas";

export async function planFromPrompt(userPrompt: string, modelName?: string): Promise<PlanResult> {
  const messages = [
    { role: "system" as const, content: PLAN_SYSTEM_PROMPT },
    { role: "user" as const, content: `User Prompt: "${userPrompt}"` },
  ];

  const responseText = await callLLM(messages, true, modelName);
  const json = JSON.parse(responseText);
  return PlanResultSchema.parse(json);
}
