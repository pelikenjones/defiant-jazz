# defiant-jazz

Transform quotes into Severance character voices, using Claude or OpenAI.

```bash
npm install defiant-jazz
```

## Usage

```typescript
import { refine } from 'defiant-jazz';

const result = await refine.dylan("I need to focus on my work");
console.log(result.text);
// => "Yeah, no, I gotta get back to my numbers. Some of us are actually
//     trying to hit quota here, so — shoo. Go bother someone in O&D."
console.log(result.character);
// => "Dylan G."

await refine.mark("...");     // Mark S. - thoughtful, restrained
await refine.irving("...");   // Irving B. - formal, poetic
await refine.dylan("...");    // Dylan G. - sarcastic, irreverent
await refine.milchick("..."); // Mr. Milchick - cheerful, corporate

// Generic form, useful for dynamic character selection
await refine("Hello world", "dylan");
```

Set `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` in your environment and you're done —
whichever is present is used automatically (Anthropic first if both are set).

**Default models: `claude-sonnet-5` (Anthropic), `gpt-4o-mini` (OpenAI).**
Sonnet 5 was chosen over Opus 5 after a head-to-head comparison found
matching output quality at 40% of the cost — see
[model-comparison.md](model-comparison.md) for the full writeup, including a
documented regression on Haiku 4.5 that ruled it out as a default. Override
with `model` on `createDefiantJazz()` or per call; see
[Choosing a provider](#choosing-a-provider).

## Lore

By default, characters reach for Lumon/*Severance* vocabulary — the break
room, waffle parties, Kier, innie/outie — when a quote's situation actually
calls for it. It's restrained on purpose: usually zero references, at most
one, and only when it genuinely fits. Same quote, both settings:

```typescript
await refine.dylan("They gave us pizza instead of raises");
// => "Pizza. Not money — *pizza*. A greasy little circle of bread and
//     suddenly we're all supposed to be jazzed about it. Cool. Great.
//     Love that math.
//
//     Although… okay, real talk, was it the good kind? Because if
//     somebody's putting stuffed crust in front of me, I'm compromised.
//     I'm not proud of it. I'd sell you out for a waffle party too, so."

await refine.dylan("They gave us pizza instead of raises", { lore: false });
// => "Oh cool, no raise, but hey — pizza. Cheese and marinara, the
//     universal language of 'go screw yourself.' You know what I can't
//     do with a pepperoni? Pay rent. But sure, throw me a slice, I'll
//     frame it. Employee of the goddamn month."
```

Turn it off per-call, or for a whole instance:

```typescript
await refine.dylan("...", { lore: false });

const plain = createDefiantJazz({ lore: false });
```

## Choosing a provider

```typescript
import { createDefiantJazz } from 'defiant-jazz';

const claude = createDefiantJazz({
  provider: 'anthropic',
  apiKey: 'sk-ant-...',
  model: 'claude-sonnet-5', // optional, this is the default — see model-comparison.md
});

const gpt = createDefiantJazz({
  provider: 'openai',
  apiKey: 'sk-...',
  model: 'gpt-4o-mini', // optional, this is the default
});

await claude.dylan("Hello world");
await gpt.dylan("Hello world");
```

`refine` is a shared default instance using auto-detected credentials. Use
`createDefiantJazz()` whenever you need an isolated instance — a specific
provider, different API keys per request, a non-default model, testing.

Per-call overrides work on both forms:

```typescript
await refine.dylan("Hello world", { model: 'claude-opus-5', maxTokens: 1024 });
```

### Effort (Anthropic only)

`effort` controls how much the model reasons before answering: `'low'`,
`'medium'`, `'high'`, `'xhigh'` or `'max'`. Lower is cheaper and faster. Leave
it unset to use the model's own default, which varies by model.

```typescript
const fast = createDefiantJazz({ effort: 'low' });
await refine.dylan("Hello world", { effort: 'low' }); // per-call works too
```

- Setting `effort` with the OpenAI provider throws.
- Not every model accepts every level (older models may reject `effort`
  entirely); the API's error is passed through.
- Reasoning tokens count toward `maxTokens`. At `xhigh` or `max`, raise
  `maxTokens` if you see "returned no text content (stop_reason: max_tokens)".

## Usage and cost

Every result includes the model that answered and the request's token
counts, normalized across providers:

```typescript
const result = await refine.dylan("Hello world");
// {
//   text: "...",
//   character: "Dylan G.",
//   model: "claude-sonnet-5",
//   usage: { inputTokens: 2770, outputTokens: 77 },
// }
```

`outputTokens` includes any reasoning tokens the model spent before answering
(see [Effort](#effort-anthropic-only)). `usage` is omitted if the provider
doesn't report it.

## Characters

```typescript
import { CHARACTERS } from 'defiant-jazz';

// { mark: "Mark S.", irving: "Irving B.", dylan: "Dylan G.", milchick: "Mr. Milchick" }
```

Transformations draw on Lumon/*Severance* vocabulary by default — see
[Lore](#lore) above for what that means and how to turn it off.

## License

MIT
