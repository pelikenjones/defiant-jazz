import type Anthropic from "@anthropic-ai/sdk";

export type CharacterKey = "mark" | "irving" | "dylan" | "milchick";

export type Provider = "anthropic" | "openai";

/** Anthropic effort level, taken from the SDK so new levels arrive with SDK updates. */
export type Effort = NonNullable<Anthropic.OutputConfig["effort"]>;

export interface RefineResult {
  text: string;
  character: string;
}

export interface DefiantJazzOptions {
  /** Explicit provider. Defaults to whichever API key is set (Anthropic first). */
  provider?: Provider;
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  /**
   * How much the model reasons before answering (Anthropic only). Lower is
   * cheaper and faster. Leave unset to use the model's own default, which
   * varies by model. Setting it with the OpenAI provider throws.
   */
  effort?: Effort;
  /**
   * Whether characters reach for Lumon/Severance vocabulary (the break room,
   * waffle parties, Kier, innie/outie, etc.) when a quote's situation calls
   * for it. Defaults to `true`. Set `false` for clean voice-only
   * transformations with no show-specific vocabulary.
   */
  lore?: boolean;
}

export interface RefineOptions {
  model?: string;
  maxTokens?: number;
  /**
   * How much the model reasons before answering (Anthropic only). Overrides
   * the instance-level setting. Leave unset to use the model's own default.
   */
  effort?: Effort;
  signal?: AbortSignal;
  /**
   * Whether this call reaches for Lumon/Severance vocabulary. Overrides the
   * instance-level setting. Defaults to `true`.
   */
  lore?: boolean;
}
