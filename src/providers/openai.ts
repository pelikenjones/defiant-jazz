import OpenAI from "openai";
import type { RefineOptions, RefineResult } from "../types.js";

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_MAX_TOKENS = 4096;

export function createOpenAiClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey });
}

export async function runOpenAi(
  client: OpenAI,
  characterName: string,
  text: string,
  systemPrompt: string,
  defaults: { model?: string; maxTokens?: number },
  options?: RefineOptions
): Promise<Omit<RefineResult, "character">> {
  const completion = await client.chat.completions.create(
    {
      model: options?.model ?? defaults.model ?? DEFAULT_MODEL,
      max_tokens: options?.maxTokens ?? defaults.maxTokens ?? DEFAULT_MAX_TOKENS,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Transform this quote in the style of ${characterName}: "${text}"`,
        },
      ],
    },
    { signal: options?.signal }
  );

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned no content.");
  }

  return {
    text: content,
    model: completion.model,
    usage: completion.usage && {
      inputTokens: completion.usage.prompt_tokens,
      outputTokens: completion.usage.completion_tokens,
    },
  };
}
