import Anthropic from "@anthropic-ai/sdk";
import type { Effort, RefineOptions, RefineResult } from "../types.js";

const DEFAULT_MODEL = "claude-sonnet-5";
const DEFAULT_MAX_TOKENS = 4096;

export function createAnthropicClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey });
}

export async function runAnthropic(
  client: Anthropic,
  characterName: string,
  text: string,
  systemPrompt: string,
  defaults: { model?: string; maxTokens?: number; effort?: Effort },
  options?: RefineOptions
): Promise<Omit<RefineResult, "character">> {
  const effort = options?.effort ?? defaults.effort;

  try {
    const response = await client.messages.create(
      {
        model: options?.model ?? defaults.model ?? DEFAULT_MODEL,
        max_tokens: options?.maxTokens ?? defaults.maxTokens ?? DEFAULT_MAX_TOKENS,
        ...(effort !== undefined && { output_config: { effort } }),
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Transform this quote in the style of ${characterName}: "${text}"`,
          },
        ],
      },
      { signal: options?.signal }
    );

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );

    if (!textBlock) {
      throw new Error(
        `Anthropic returned no text content (stop_reason: ${response.stop_reason})`
      );
    }

    return {
      text: textBlock.text,
      model: response.model,
      usage: response.usage && {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      throw new Error("Anthropic rejected the API key. Check ANTHROPIC_API_KEY.");
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new Error("Anthropic rate limit hit. Retry after a short delay.");
    }
    if (error instanceof Anthropic.APIError) {
      throw new Error(`Anthropic API error (${error.status}): ${error.message}`);
    }
    throw error;
  }
}
