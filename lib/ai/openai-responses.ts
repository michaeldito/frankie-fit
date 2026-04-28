type StructuredFormat = {
  name: string;
  schema: Record<string, unknown>;
};

function hasOutputText(value: unknown): value is { output_text: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "output_text" in value &&
    typeof (value as { output_text?: unknown }).output_text === "string"
  );
}

function getNestedOutputText(value: unknown) {
  if (!value || typeof value !== "object" || !("output" in value)) {
    return null;
  }

  const output = (value as { output?: unknown }).output;

  if (!Array.isArray(output)) {
    return null;
  }

  for (const item of output) {
    if (!item || typeof item !== "object" || !("content" in item)) {
      continue;
    }

    const content = (item as { content?: unknown }).content;

    if (!Array.isArray(content)) {
      continue;
    }

    for (const part of content) {
      if (
        part &&
        typeof part === "object" &&
        "type" in part &&
        (part as { type?: unknown }).type === "output_text" &&
        "text" in part &&
        typeof (part as { text?: unknown }).text === "string"
      ) {
        return (part as { text: string }).text;
      }
    }
  }

  return null;
}

async function createOpenAiResponse(input: {
  model: string;
  messages: Array<{ role: "system" | "user"; content: string }>;
  structuredFormat?: StructuredFormat;
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: input.model,
      input: input.messages,
      ...(input.structuredFormat
        ? {
            text: {
              format: {
                type: "json_schema",
                name: input.structuredFormat.name,
                strict: true,
                schema: input.structuredFormat.schema
              }
            }
          }
        : {})
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenAI Responses API returned ${response.status}: ${errorText || "Unknown error"}`
    );
  }

  return (await response.json()) as unknown;
}

export function hasOpenAiApiKey() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function createStructuredOpenAiResponse(input: {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  schemaName: string;
  schema: Record<string, unknown>;
}) {
  const response = await createOpenAiResponse({
    model: input.model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      { role: "system", content: input.systemPrompt },
      { role: "user", content: input.userPrompt }
    ],
    structuredFormat: {
      name: input.schemaName,
      schema: input.schema
    }
  });

  const outputText = hasOutputText(response)
    ? response.output_text
    : getNestedOutputText(response);

  if (!outputText) {
    throw new Error("OpenAI structured response did not include output text.");
  }

  return JSON.parse(outputText) as unknown;
}

export async function createTextOpenAiResponse(input: {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
}) {
  const response = await createOpenAiResponse({
    model: input.model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      { role: "system", content: input.systemPrompt },
      { role: "user", content: input.userPrompt }
    ]
  });

  const outputText = hasOutputText(response)
    ? response.output_text
    : getNestedOutputText(response);

  if (!outputText) {
    throw new Error("OpenAI text response did not include output text.");
  }

  return outputText.trim();
}
