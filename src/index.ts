import { createDefiantJazz, type DefiantJazz } from "./client.js";
import { CHARACTERS } from "./prompt.js";
import type {
  CharacterKey,
  DefiantJazzOptions,
  Effort,
  RefineOptions,
  RefineResult,
} from "./types.js";

export type { CharacterKey, DefiantJazzOptions, Effort, RefineOptions, RefineResult };
export { CHARACTERS, createDefiantJazz };

let defaultInstance: DefiantJazz | null = null;

function getDefaultInstance(): DefiantJazz {
  if (!defaultInstance) {
    defaultInstance = createDefiantJazz();
  }
  return defaultInstance;
}

/**
 * Configure the default `refine` instance with an API key and optional
 * model/provider overrides. Prefer `createDefiantJazz()` for an isolated
 * instance instead of this shared, module-level default.
 */
export function configure(options: DefiantJazzOptions): void {
  getDefaultInstance().configure(options);
}

/**
 * Transform quotes into Severance character voices.
 *
 * @example
 * // Use character methods
 * await refine.dylan("Hello world")
 *
 * // Or use the generic form
 * await refine("Hello world", "dylan")
 */
export const refine = ((text: string, character: CharacterKey, options?: RefineOptions) =>
  getDefaultInstance()(text, character, options)) as DefiantJazz;

refine.mark = (text, options) => getDefaultInstance().mark(text, options);
refine.irving = (text, options) => getDefaultInstance().irving(text, options);
refine.dylan = (text, options) => getDefaultInstance().dylan(text, options);
refine.milchick = (text, options) => getDefaultInstance().milchick(text, options);
refine.configure = configure;
