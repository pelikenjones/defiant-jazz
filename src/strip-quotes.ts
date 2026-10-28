// Opening quote character -> its closing partner.
const QUOTE_PAIRS: Record<string, string> = {
  '"': '"',
  "“": "”", // “ ”
  "'": "'",
  "‘": "’", // ‘ ’
};

const LETTER = /\p{L}/u;

/** A ' or ’ between two letters ("can't", "Kier’s") is an apostrophe, not a quote. */
function isApostrophe(text: string, i: number): boolean {
  const ch = text[i];
  if (ch !== "'" && ch !== "’") return false;
  return LETTER.test(text[i - 1] ?? "") && LETTER.test(text[i + 1] ?? "");
}

/**
 * True when the opening quote at the start of the text is the one closed by
 * the final character, rather than closed early by a quote mark inside.
 * Guards against `"Fine," he said, "whatever."`, where the first and last
 * characters are quotes but they belong to two separate quoted spans.
 */
function wrapsWholeText(inner: string, open: string, close: string): boolean {
  let depth = 1;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if ((ch !== open && ch !== close) || isApostrophe(inner, i)) continue;
    // Straight quotes can't be told apart, so any inner one closes the outer.
    depth += ch === close ? -1 : 1;
    if (depth === 0) return false;
  }
  return depth === 1;
}

/**
 * Remove one pair of quotation marks wrapping the entire model output, e.g.
 * `"I wanted to bring to your attention…"`. Quotes inside the text are left
 * alone, and text that isn't wrapped is returned unchanged.
 */
export function stripWrappingQuotes(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length < 2) return text;

  const open = trimmed[0];
  const close = QUOTE_PAIRS[open];
  if (close === undefined || trimmed[trimmed.length - 1] !== close) return text;

  const inner = trimmed.slice(1, -1);
  if (inner.trim() === "" || !wrapsWholeText(inner, open, close)) return text;

  return inner.trim();
}
