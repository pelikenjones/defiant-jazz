// Model comparison for model-comparison.md. Live API calls — costs real money.
//
//   pnpm build
//   node --env-file=.env transcripts/compare-models.mjs [variant ...]
//
// A variant is a model ID, optionally with an effort level: "claude-sonnet-5-5@low".
// IDs starting with "claude-" run on Anthropic; anything else runs on OpenAI.
// Effort is Anthropic-only. Needs the matching key(s) in .env.
// With no arguments, runs the Run 3 set. SAMPLES=n sets samples per pair (default 3).
// Writes transcripts/model-comparison-latest.md.
import { createDefiantJazz } from "../dist/index.js";
import fs from "node:fs";

const DEFAULT_VARIANTS = [
  "claude-sonnet-5",
  "claude-sonnet-5-5",
  "claude-sonnet-5-5@low",
  "claude-haiku-5-5",
  "claude-opus-5-5",
];

// USD per million tokens (input, output). Update when adding models.
// Prices are standard tier, from each provider's pricing page.
const PRICES = {
  "claude-sonnet-5": [2, 10],
  "claude-sonnet-5-5": [2, 10],
  "claude-haiku-5-5": [0.1, 0.5],
  "claude-opus-5-5": [4, 20],
};

const providerFor = (model) => (model.startsWith("claude-") ? "anthropic" : "openai");

const PAIRS = [
  ["They gave us pizza instead of raises.", "milchick"],
  ["I think my landlord is trying to evict me.", "mark"],
  ["This meeting could have been an email.", "dylan"],
  ["I finally finished the quarterly report.", "irving"],
];

const variants = process.argv.length > 2 ? process.argv.slice(2) : DEFAULT_VARIANTS;
const samples = Number(process.env.SAMPLES ?? 3);

const rows = [];
for (const variant of variants) {
  const [model, effort] = variant.split("@");
  const dj = createDefiantJazz({ provider: providerFor(model), model, effort, lore: true });
  for (const [quote, character] of PAIRS) {
    for (let sample = 1; sample <= samples; sample++) {
      const start = Date.now();
      const result = await dj(quote, character);
      rows.push({ variant, model, quote, character, sample, ms: Date.now() - start, ...result });
      process.stderr.write(`${variant} ${character} #${sample}\n`);
    }
  }
}

// OpenAI reports a dated snapshot in row.model, so price by the requested ID.
function cost(row) {
  const price = PRICES[row.variant.split("@")[0]];
  if (!price || !row.usage) return null;
  return (row.usage.inputTokens * price[0] + row.usage.outputTokens * price[1]) / 1e6;
}

const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

let out = `# Model comparison: latest run\n\nGenerated ${new Date().toISOString()}, lore: true, ${samples} sample(s) per pair.\n\n`;
out += "| Variant | Cost/call | Latency | Output tokens | Words |\n| --- | --- | --- | --- | --- |\n";
for (const variant of variants) {
  const vr = rows.filter((r) => r.variant === variant);
  const costs = vr.map(cost);
  const costCell = costs.includes(null) ? "n/a" : `$${avg(costs).toFixed(4)}`;
  out += `| \`${variant}\` | ${costCell} | ${(avg(vr.map((r) => r.ms)) / 1000).toFixed(1)}s | ${Math.round(avg(vr.map((r) => r.usage?.outputTokens ?? 0)))} | ${Math.round(avg(vr.map((r) => r.text.split(/\s+/).length)))} |\n`;
}

for (const [quote, character] of PAIRS) {
  out += `\n## ${character}: "${quote}"\n`;
  for (const variant of variants) {
    out += `\n### \`${variant}\`\n\n`;
    for (const r of rows.filter((r) => r.variant === variant && r.character === character)) {
      out += `${r.sample}. ${r.text.replace(/\n+/g, " ")}\n`;
    }
  }
}

fs.writeFileSync(new URL("./model-comparison-latest.md", import.meta.url), out);
console.log("Wrote transcripts/model-comparison-latest.md");
