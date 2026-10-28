import type { Provider } from "./types.js";

/**
 * The model each provider uses when `model` is not set. Exported so callers
 * can see what a zero-config call will run (and be billed for) without
 * reading the docs. See model-comparison.md for why Sonnet 5 is the default.
 */
export const DEFAULT_MODELS: Readonly<Record<Provider, string>> = Object.freeze({
  anthropic: "claude-sonnet-5",
  openai: "gpt-4o-mini",
});
