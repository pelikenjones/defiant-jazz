# defiant-jazz

[![npm version](https://img.shields.io/npm/v/defiant-jazz)](https://www.npmjs.com/package/defiant-jazz)
[![license](https://img.shields.io/npm/l/defiant-jazz)](LICENSE)

Rewrite any line of text in the voice of a *Severance* character, via Anthropic or OpenAI.

Try it in your browser: [defiant-jazz.vercel.app](https://defiant-jazz.vercel.app)

## Quick start

1. Install it. Node 20+, ESM only.

   ```bash
   npm install defiant-jazz
   ```

2. Set `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`. Exactly one; see
   [Choosing a provider](#choosing-a-provider) if you have both.

3. Refine something:

   ```typescript
   import { refine } from 'defiant-jazz';

   const result = await refine.dylan("I need to focus on my work");
   console.log(result.text);
   // => Yeah, gonna need to lock in here, chief—quit yappin' so I can go
   //    stare at some numbers and pretend they mean something.
   ```

That's the whole onboarding. No wellness session required.

## Meet the refiners

Four voices, one department. The work is mysterious and important.

| Method | Key | Name | Voice |
| --- | --- | --- | --- |
| `refine.mark` | `mark` | Mark S. | Quiet, restrained, a little introspective |
| `refine.irving` | `irving` | Irving B. | Formal, poetic, deeply principled |
| `refine.dylan` | `dylan` | Dylan G. | Quick-witted, sarcastic, irreverent |
| `refine.milchick` | `milchick` | Mr. Milchick | Unnervingly cheerful, hyper-cordial, professional |

Same line, all four:

```typescript
const quote = "They gave us pizza instead of raises";

await refine.mark(quote);
// => Yeah, they, uh... they gave us pizza instead of raises. So.
//    That happened.

await refine.irving(quote);
// => In lieu of the compensation our labors have rightly earned, they
//    offer us pizza—a gesture one might almost mistake for a waffle
//    party, were it not so plainly beneath the dignity such an occasion
//    demands.

await refine.dylan(quote);
// => Pizza. For raises. That's the trade. Still ate four slices—not
//    exactly a waffle party, but hey, I'm not made of stone.

await refine.milchick(quote);
// => I was so pleased to facilitate this delicious, circular bread as a
//    token of our boundless gratitude—let us consider it a charming
//    little precursor to the next melon bar, shall we?
```

Outputs in this README come from `claude-sonnet-5` unless marked;
[Models](#models) has Mark's line on `gpt-4o-mini` too. Try all four live in
the [demo](https://defiant-jazz.vercel.app).

Picking a character at runtime? Pass the key to the generic form,
`refine(text, "dylan")`. The `CHARACTERS` export maps each key to its
display name.

## Options

| Option | Set on | Default | Notes |
| --- | --- | --- | --- |
| `provider` | instance | inferred from env | `'anthropic'` or `'openai'`. See [Choosing a provider](#choosing-a-provider). |
| `apiKey` | instance | `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | Requires `provider`. |
| `model` | instance, call | `claude-sonnet-5` / `gpt-4o-mini` | See [Models](#models). |
| `maxTokens` | instance, call | `4096` | Reasoning tokens count toward it. |
| `effort` | instance, call | unset (model default) | Anthropic only. See [Effort](#effort-anthropic-only). |
| `lore` | instance, call | `true` | See [Lore](#lore). |
| `signal` | call | none | An `AbortSignal` to cancel the request. |

"Instance" means `createDefiantJazz(options)` or `configure(options)`.
"Call" means the last argument to a refine call. Per-call options win.

```typescript
import { createDefiantJazz } from 'defiant-jazz';

const jazz = createDefiantJazz({ provider: 'anthropic', maxTokens: 1024, lore: false });

await jazz.irving("The meeting is cancelled", { model: 'claude-opus-5-5' });
```

## What you get back

```typescript
const result = await refine.dylan("I need to focus on my work");
// {
//   text: "Yeah, gonna need to lock in here, chief—quit yappin' so I can go
//          stare at some numbers and pretend they mean something.",
//   model: "claude-sonnet-5",
//   usage: { inputTokens: 2808, outputTokens: 46 },
//   character: "Dylan G.",
// }
```

- `model` is the model the provider reported answering with: here the
  Anthropic default; on OpenAI it can be a dated snapshot ID.
- `outputTokens` includes any reasoning tokens.
- `usage` is omitted if the provider doesn't report it.
- `text` is the bare line, with no wrapping quotation marks.

## Lore

By default, characters may reach for Lumon vocabulary (the break room, waffle
parties, Kier) when a quote's situation actually calls for it. It's
restrained on purpose: usually zero references, at most one, and only when it
fits.

```typescript
await refine.dylan("They gave us pizza instead of raises");
// => Pizza. For raises. That's the trade. Still ate four slices—not
//    exactly a waffle party, but hey, I'm not made of stone.

await refine.dylan("They gave us pizza instead of raises", { lore: false });
// => Oh great, pizza. Pepperoni's really gonna cover my mortgage, huh?
//    "Here's a Domino's, buddy, now go innovate." Unbelievable.
```

Turn it off per call as above, or for a whole instance with
`createDefiantJazz({ lore: false })`.

Adherence is weaker on `gpt-4o-mini`; see [OpenAI](#openai) under Models.

## Choosing a provider

The library will not guess whose account to bill. When the choice is
ambiguous, it throws and tells you exactly what to pass.

```typescript
import { createDefiantJazz } from 'defiant-jazz';

const claude = createDefiantJazz({
  provider: 'anthropic',
  apiKey: 'sk-ant-...',
  model: 'claude-sonnet-5', // optional, this is the default
});

const gpt = createDefiantJazz({
  provider: 'openai',
  apiKey: 'sk-...',
  model: 'gpt-4o-mini', // optional, this is the default
});
```

- `provider` set: that provider, with its key from `apiKey` or its env var.
- `provider` omitted, exactly one env key set: that provider.
- `provider` omitted, both env keys set, or neither: throws.
- `apiKey` without `provider`: throws, so a key never goes to the wrong service.

Only those two env var names are read. For a key stored elsewhere, read it
yourself and pass it in:

```typescript
createDefiantJazz({ provider: 'openai', apiKey: process.env.MY_TEAM_OPENAI_KEY });
```

`refine` is a shared default instance that follows the same rules. Point it at
a provider with `refine.configure({ provider: 'openai' })` (`configure` is
also a named export). Use `createDefiantJazz()` when you need an isolated
instance: a specific provider, per-request keys, a different model, tests.

## Models

```typescript
import { DEFAULT_MODELS } from 'defiant-jazz';
// { anthropic: 'claude-sonnet-5', openai: 'gpt-4o-mini' }
```

Either default can be swapped with `model`, on an instance or per call.

### Anthropic

Sonnet 5 matched Opus 5's quality at 40% of the cost, and held up against the
5.5 generation. The full writeup is in
[model-comparison.md](model-comparison.md#conclusion).

Opt-ins worth knowing about:

| Model | Good for | Trade-off |
| --- | --- | --- |
| `claude-opus-5-5` | Best writing | ~2.7x the cost, ~2.5x the latency |
| `claude-haiku-5-5` | ~15x cheaper | Occasional untransformed quote or invented lore |
| `claude-sonnet-5-5` with `effort: 'low'` | Same cost as the default | No clear quality gain |

### OpenAI

The default is `gpt-4o-mini`. It hasn't been through a comparison like the
Anthropic models have; one is planned. Until then there are no tested
opt-ins to recommend.

Switching works the same way:

```typescript
const gpt = createDefiantJazz({ provider: 'openai', model: '<model-id>' });
await gpt.dylan("Hello world", { model: '<model-id>' }); // per call works too
```

Worth knowing about:

- Lore adherence is weaker on `gpt-4o-mini`: characters sometimes gesture
  near a Lumon term instead of naming it, or skip one the quote earned. See
  the known limitation in [CHANGELOG.md](CHANGELOG.md#060) (0.6.0).
- In 0.8.1, only the GPT-4 family works (`gpt-4o`, `gpt-4.1` and their
  minis). GPT-5 and later reject the `max_tokens` parameter the provider
  sends, with "Unsupported parameter: 'max_tokens'". A fix is on the way.
- `model` in the result is whatever OpenAI reports, which can be a dated
  snapshot ID such as `gpt-4o-mini-2024-07-18`.

### Same quote, three models

```typescript
const claude = createDefiantJazz({ provider: 'anthropic' });
const gpt = createDefiantJazz({ provider: 'openai' });
const quote = "They gave us pizza instead of raises";

// claude-sonnet-5 (Anthropic default)
await claude.mark(quote);
// => Yeah, they, uh... they gave us pizza instead of raises. So.
//    That happened.

// claude-opus-5-5 (~2.7x the cost, slower)
await claude.mark(quote, { model: 'claude-opus-5-5' });
// => So, uh... they gave us pizza. Instead of raises. Which is... I mean,
//    it was fine pizza. It's not like I was gonna say no to it. Just kind
//    of sat there eating it, trying to remember what I thought I was going
//    to do with the money.

// gpt-4o-mini (OpenAI default)
await gpt.mark(quote);
// => I guess they thought pizza was a suitable substitute for a raise,
//    which... well, it's not really the same thing, is it?
```

## Effort (Anthropic only)

<details>
<summary>How much the model reasons before answering.</summary>

```typescript
const fast = createDefiantJazz({ provider: 'anthropic', effort: 'low' });
await refine.dylan("Hello world", { effort: 'low' }); // per call works too
```

- Levels: `'low'`, `'medium'`, `'high'`, `'xhigh'`, `'max'`. The type comes
  from the Anthropic SDK, so new levels arrive with SDK updates.
- Lower is cheaper and faster. Unset means the model's own default.
- Setting `effort` with the OpenAI provider throws.
- Older models may reject `effort`; the API's error is passed through as
  `Anthropic API error (...)`.
- Reasoning tokens count toward `maxTokens` (default `4096`). Raise it if you
  see "returned no text content (stop_reason: max_tokens)".

</details>

## Troubleshooting

<details>
<summary>Things that throw, and what to do about them. Nothing here involves the break room.</summary>

| Error starts with | Why | Fix |
| --- | --- | --- |
| `No API key found.` | No `provider`/`apiKey`, and neither env var is set. | Set `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`, or pass `provider` and `apiKey`. |
| `Both ANTHROPIC_API_KEY and OPENAI_API_KEY are set.` | Two possible providers and no `provider`. | Pass `provider: 'anthropic'` or `provider: 'openai'`. |
| `apiKey requires provider` | `apiKey` was passed without `provider`. | Add `provider` alongside `apiKey`. |
| `anthropic API key required` / `openai API key required` | `provider` is set, but no `apiKey` and no matching env var. | Set that provider's env var, or pass `apiKey`. |
| `effort is only supported with the Anthropic provider.` | `effort` is set and the provider is OpenAI. | Remove `effort`, or use `provider: 'anthropic'`. |
| `Unknown character:` | The key isn't `mark`, `irving`, `dylan` or `milchick`. | Use a key from `CHARACTERS`. |
| `Expected a character key (e.g. "dylan") but received an options object.` | Options were passed where the character key goes. | `refine.dylan(text, { lore: false })`, or `refine(text, "dylan", { lore: false })`. |
| `Text is required and cannot be empty` | The text was empty or whitespace. | Pass some text. |
| `Anthropic rejected the API key.` | Anthropic returned an authentication error. | Check `ANTHROPIC_API_KEY` or `apiKey`. |
| `Anthropic rate limit hit.` | Anthropic returned a rate-limit error. | Retry after a short delay. |
| `Anthropic API error (` | Any other Anthropic API error, with its status and message. | Read the message; a model rejecting `effort` lands here. |
| `Anthropic returned no text content (stop_reason: max_tokens)` | Reasoning used up the token budget. | Raise `maxTokens`, or lower `effort`. |
| `OpenAI returned no content.` | OpenAI sent back an empty completion. | Retry, or raise `maxTokens`. |

OpenAI's own API errors (bad key, rate limits) are thrown as-is by the
`openai` SDK.

</details>

## API reference

| Export | What it is |
| --- | --- |
| `refine` | Shared instance: `refine(text, key, opts?)` or `refine.<key>(text, opts?)` |
| `createDefiantJazz(opts?)` | Returns an isolated instance with the same call shapes |
| `configure(opts)` | Configures the shared `refine`; same as `refine.configure(opts)` |
| `CHARACTERS` | `{ mark: "Mark S.", irving: "Irving B.", dylan: "Dylan G.", milchick: "Mr. Milchick" }` |
| `DEFAULT_MODELS` | `{ anthropic: 'claude-sonnet-5', openai: 'gpt-4o-mini' }` |

Types: `CharacterKey`, `DefiantJazzOptions`, `Effort`, `RefineOptions`,
`RefineResult`, `TokenUsage`.

`instance.configure(opts)` merges into the instance's existing options and
drops its cached client, so a new provider or key takes effect on the next
call.

## Links

- [Demo](https://defiant-jazz.vercel.app)
- [CHANGELOG.md](CHANGELOG.md)
- [model-comparison.md](model-comparison.md)

## License

MIT
