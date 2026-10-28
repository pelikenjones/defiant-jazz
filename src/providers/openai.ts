import OpenAI from "openai";
import { DEFAULT_MODELS } from "../defaults.js";
import { buildUserMessage } from "../prompt.js";
import { stripWrappingQuotes } from "../strip-quotes.js";
import type { RefineOptions, RefineResult } from "../types.js";

const DEFAULT_MODEL = DEFAULT_MODELS.openai;
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
  try {
    const completion = await client.chat.completions.create(
      {
        model: options?.model ?? defaults.model ?? DEFAULT_MODEL,
        max_completion_tokens: options?.maxTokens ?? defaults.maxTokens ?? DEFAULT_MAX_TOKENS,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: buildUserMessage(characterName, text),
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
      text: stripWrappingQuotes(content),
      model: completion.model,
      usage: completion.usage && {
        inputTokens: completion.usage.prompt_tokens,
        outputTokens: completion.usage.completion_tokens,
      },
    };
  } catch (error) {
    if (error instanceof OpenAI.APIUserAbortError) {
      throw error;
    }
    if (error instanceof OpenAI.AuthenticationError) {
      throw new Error("OpenAI rejected the API key. Check OPENAI_API_KEY.");
    }
    // OpenAI reports an empty balance as a 429, same as a rate limit.
    if (error instanceof OpenAI.RateLimitError && error.code === "insufficient_quota") {
      throw new Error(
        "OpenAI account has no credit left. Add credit or billing at platform.openai.com."
      );
    }
    if (error instanceof OpenAI.RateLimitError) {
      throw new Error("OpenAI rate limit hit. Retry after a short delay.");
    }
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error (${error.status}): ${error.message}`);
    }
    throw error;
  }
}
