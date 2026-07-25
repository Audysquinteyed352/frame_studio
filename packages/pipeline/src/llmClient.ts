import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tryParseJson } from "./repairJson.js";

// Always resolve .env from monorepo root, regardless of cwd
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const MAX_JSON_RETRIES = 2;

async function fetchGemini(
  messages: LLMMessage[],
  jsonMode: boolean,
  model: string,
  apiKey: string
): Promise<string> {
  const systemMessage = messages.find((m) => m.role === "system");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const requestBody: any = { contents };
  if (systemMessage) {
    requestBody.systemInstruction = {
      parts: [{ text: systemMessage.content }],
    };
  }
  if (jsonMode) {
    requestBody.generationConfig = { responseMimeType: "application/json" };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  console.log(`[Gemini API] Calling model: ${model}`);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(
      `Gemini API request failed (${response.status}): ${responseText}`
    );
  }

  let envelope: any;
  try {
    envelope = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Gemini API returned non-JSON response: ${responseText.slice(0, 300)}`
    );
  }

  const content: string | undefined =
    envelope.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content || content.trim() === "") {
    throw new Error(
      `Gemini API returned empty content. Full response: ${responseText.slice(0, 300)}`
    );
  }

  return content;
}

export async function callLLM(
  messages: LLMMessage[],
  jsonMode: boolean = true,
  modelName?: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = modelName || process.env.GEMINI_MODEL || "gemini-3.6-flash";

  if (!apiKey) {
    throw new Error(
      "Missing GEMINI_API_KEY. Please provide your Google Gemini API key."
    );
  }

  try {
    let content = await fetchGemini(messages, jsonMode, model, apiKey);

    if (jsonMode) {
      for (let attempt = 0; attempt <= MAX_JSON_RETRIES; attempt++) {
        const result = tryParseJson<any>(content);
        if (result.ok) {
          return JSON.stringify(result.data);
        }

        if (attempt < MAX_JSON_RETRIES) {
          console.warn(`[Gemini] JSON parse failed (attempt ${attempt + 1}), retrying...`);
          const fixMessages: LLMMessage[] = [
            {
              role: "system",
              content: "You previously output invalid JSON. Fix ONLY the JSON syntax errors. Return the corrected JSON with no extra text.",
            },
            {
              role: "user",
              content: `The following JSON is invalid. Fix it and return ONLY valid JSON:\n\n${content}\n\nParse error: ${(result as { error: string }).error}`,
            },
          ];
          content = await fetchGemini(fixMessages, true, model, apiKey);
        } else {
          throw new Error(
            `Gemini response is not valid JSON after ${MAX_JSON_RETRIES + 1} attempts.\n` +
            `Parse error: ${(result as { error: string }).error}\n` +
            `Raw content (first 700 chars): ${content.slice(0, 700)}`
          );
        }
      }
    }

    return content;
  } catch (err: any) {
    const message = err?.message ?? String(err);
    throw new Error(`[Gemini] ${message}`);
  }
}

