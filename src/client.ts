import type Anthropic from "@anthropic-ai/sdk";
import type OpenAI from "openai";
import { createAnthropicClient, runAnthropic } from "./providers/anthropic.js";
import { createOpenAiClient, runOpenAi } from "./providers/openai.js";
import { buildSystemPrompt, CHARACTERS } from "./prompt.js";
import type {
  CharacterKey,
  DefiantJazzOptions,
  Provider,
  RefineOptions,
  RefineResult,
} from "./types.js";

function resolveProvider(options: DefiantJazzOptions): {
  provider: Provider;
  apiKey: string;
} {
  if (options.provider === "anthropic" || options.provider === "openai") {
    const apiKey =
      options.apiKey ??
      (options.provider === "anthropic"
        ? process.env.ANTHROPIC_API_KEY
        : process.env.OPENAI_API_KEY);
    if (!apiKey) {
      throw new Error(
        `${options.provider} API key required. Set ${
          options.provider === "anthropic" ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY"
        } or pass apiKey.`
      );
    }
    return { provider: options.provider, apiKey };
  }

  if (options.apiKey) {
    return { provider: "anthropic", apiKey: options.apiKey };
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return { provider: "anthropic", apiKey: process.env.ANTHROPIC_API_KEY };
  }

  if (process.env.OPENAI_API_KEY) {
    return { provider: "openai", apiKey: process.env.OPENAI_API_KEY };
  }

  throw new Error(
    "No API key found. Set ANTHROPIC_API_KEY or OPENAI_API_KEY " +
      "(or pass apiKey/provider to configure()/createDefiantJazz())."
  );
}

export interface DefiantJazz {
  (text: string, character: CharacterKey, options?: RefineOptions): Promise<RefineResult>;
  mark: (text: string, options?: RefineOptions) => Promise<RefineResult>;
  irving: (text: string, options?: RefineOptions) => Promise<RefineResult>;
  dylan: (text: string, options?: RefineOptions) => Promise<RefineResult>;
  milchick: (text: string, options?: RefineOptions) => Promise<RefineResult>;
  configure: (options: DefiantJazzOptions) => void;
}

export function createDefiantJazz(initialOptions: DefiantJazzOptions = {}): DefiantJazz {
  let config: DefiantJazzOptions = { ...initialOptions };
  let cachedClient: Anthropic | OpenAI | null = null;
  let cachedFor: Provider | null = null;

  function getClient(): { provider: Provider; client: Anthropic | OpenAI } {
    const { provider, apiKey } = resolveProvider(config);

    if (!cachedClient || cachedFor !== provider) {
      cachedClient =
        provider === "anthropic" ? createAnthropicClient(apiKey) : createOpenAiClient(apiKey);
      cachedFor = provider;
    }

    return { provider, client: cachedClient };
  }

  async function transform(
    text: string,
    characterKey: CharacterKey,
    options?: RefineOptions
  ): Promise<RefineResult> {
    if (characterKey !== null && typeof characterKey === "object") {
      throw new Error(
        'Expected a character key (e.g. "dylan") but received an options object. ' +
          "Did you mean refine(text, character, options) or refine.dylan(text, options)?"
      );
    }

    if (!Object.prototype.hasOwnProperty.call(CHARACTERS, characterKey)) {
      const validKeys = Object.keys(CHARACTERS).join(", ");
      throw new Error(
        `Unknown character: "${String(characterKey)}". Expected one of: ${validKeys}`
      );
    }

    if (!text || text.trim().length === 0) {
      throw new Error("Text is required and cannot be empty");
    }

    const characterName = CHARACTERS[characterKey];
    const { provider, client } = getClient();
    const effort = options?.effort ?? config.effort;
    if (effort !== undefined && provider === "openai") {
      throw new Error("effort is only supported with the Anthropic provider.");
    }
    const defaults = { model: config.model, maxTokens: config.maxTokens, effort: config.effort };
    const lore = options?.lore ?? config.lore ?? true;
    const systemPrompt = buildSystemPrompt(lore);

    const result =
      provider === "anthropic"
        ? await runAnthropic(client as Anthropic, characterName, text, systemPrompt, defaults, options)
        : await runOpenAi(client as OpenAI, characterName, text, systemPrompt, defaults, options);

    return { ...result, character: characterName };
  }

  const fn = ((text: string, character: CharacterKey, options?: RefineOptions) =>
    transform(text, character, options)) as DefiantJazz;

  fn.mark = (text, options) => transform(text, "mark", options);
  fn.irving = (text, options) => transform(text, "irving", options);
  fn.dylan = (text, options) => transform(text, "dylan", options);
  fn.milchick = (text, options) => transform(text, "milchick", options);

  fn.configure = (options: DefiantJazzOptions) => {
    config = { ...config, ...options };
    cachedClient = null;
    cachedFor = null;
  };

  return fn;
}
