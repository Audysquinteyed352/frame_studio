export function repairJson(raw: string): string {
  let cleaned = raw.trim();

  const codeFenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeFenceMatch) {
    cleaned = codeFenceMatch[1].trim();
  }
  const openBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (openBrace !== -1 && lastBrace > openBrace) {
    cleaned = cleaned.slice(openBrace, lastBrace + 1);
  }

  let repaired = cleaned;

  if (repaired.endsWith(",")) {
    repaired = repaired.slice(0, -1).trim();
  }

  repaired = repaired.replace(/,(\s*[}\]])/g, "$1");

  repaired = repaired.replace(/:\s*"([^"]*?)"(?=\s*[:,\]\}])/g, (match) => {
    return match;
  });

  let depth = 0;
  let inString = false;
  let result = "";
  let lastChar = "";
  for (let i = 0; i < repaired.length; i++) {
    const ch = repaired[i];
    const prev = i > 0 ? repaired[i - 1] : "";

    if (ch === '"' && prev !== "\\") {
      inString = !inString;
      result += ch;
      continue;
    }

    if (!inString) {
      if (ch === "'") {
        result += '"';
        continue;
      }
      if (ch === "{" || ch === "[") depth++;
      if (ch === "}" || ch === "]") depth--;
    }
    result += ch;
    lastChar = ch;
  }

  if (depth > 0) {
    result += "}".repeat(depth);
  }

  repaired = result;

  return repaired;
}

export function tryParseJson<T>(text: string): { ok: true; data: T } | { ok: false; error: string } {
  const raw = text.trim();

  const strategies = [
    () => JSON.parse(raw),
    () => JSON.parse(repairJson(raw)),
    () => {
      const unescaped = raw
        .replace(/\\(?!["\\/bfnrtu])/g, "")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
      return JSON.parse(unescaped);
    },
    () => {
      const aggressive = raw
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
      return JSON.parse(aggressive);
    },
  ];

  const errors: string[] = [];
  for (const strategy of strategies) {
    try {
      const data = strategy();
      return { ok: true, data };
    } catch (e: any) {
      errors.push(e.message);
    }
  }

  return { ok: false, error: errors.join(" | ") };
}