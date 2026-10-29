# defiant-jazz

[![npm version](https://img.shields.io/npm/v/defiant-jazz)](https://www.npmjs.com/package/defiant-jazz)
[![license](https://img.shields.io/npm/l/defiant-jazz)](LICENSE)

Rewrite any line of text in the voice of a *Severance* character, via Anthropic or OpenAI.

```javascript
import { refine } from 'defiant-jazz';

const dylan = await refine.dylan("This meeting could have been an email");
console.log(dylan.text);
// => Fun fact: this meeting could've been an email. A short one. Like,
//    two words long.

const milchick = await refine.milchick("This meeting could have been an email");
console.log(milchick.text);
// => I must say, there's a part of me that wonders whether the splendid
//    contents of this gathering might have been just as splendidly
//    conveyed via a well-crafted electronic correspondence—but oh, how I
//    do cherish the opportunity to see all your lovely faces nonetheless!
```

*Severance* is a TV show about office workers at a company called Lumon; you
don't need to have seen it. To try it in your browser first:
[defiant-jazz.vercel.app](https://defiant-jazz.vercel.app)

## Quick start

```bash
npm install defiant-jazz
export ANTHROPIC_API_KEY=sk-ant-...   # or OPENAI_API_KEY=sk-... (set one, not both)
```

```javascript
// app.mjs
import { refine } from 'defiant-jazz';

const { text } = await refine.dylan("I need to focus on my work");
console.log(text);
// => Yeah, gonna need to lock in here, chief—quit yappin' so I can go
//    stare at some numbers and pretend they mean something.
```

```bash
node app.mjs
```

Your line will read differently: the model writes a new one on every call.
That's the whole onboarding. No wellness session required.

New to API keys, on Windows, or keeping your key in a `.env` file? See
[Setup details](#setup-details).

## Setup details

<details>
<summary>Requirements, API keys, cost, and other ways to set the key.</summary>

**Requirements.** Node 20 or later. The package is ESM only, so load it with
`import`, not `require()`. The file must end in `.mjs`, or your
`package.json` needs `"type": "module"`; otherwise see the first row of
[Troubleshooting](#troubleshooting).

**Getting a key.** The library doesn't do the rewriting itself. It sends your
text to Anthropic's or OpenAI's API (the "provider") with your key, and the
provider bills your account for each call. Keys come from the provider's
console: [platform.claude.com](https://platform.claude.com) for Anthropic,
[platform.openai.com/api-keys](https://platform.openai.com/api-keys) for
OpenAI. A new account may need billing set up or credit added before the
first call works.

**Cost.** Providers bill by the token, a chunk of a few characters. On the
default Anthropic model, `claude-sonnet-5`, a call costs under a cent at the
time of writing: about 2.8k input tokens and ~50 output tokens, at $2 and $10
per million, comes to about $0.006. See [Reading `usage`](#reading-usage) for
what's counted, and the [Anthropic](https://claude.com/pricing) and
[OpenAI](https://openai.com/api/pricing) pricing pages for current prices.

**Setting the key.** Pick one provider and set its key as an environment
variable (env var), pasting your own key in place of the placeholder.

Anthropic:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

OpenAI:

```bash
export OPENAI_API_KEY=sk-...
```

`export` lasts only for the current terminal, so run your script from that
same terminal. On Windows PowerShell, use
`$env:ANTHROPIC_API_KEY="sk-ant-..."` instead. If both keys are set, the
library stops with an error rather than guess which account to bill, until
you tell it which provider to use; see
[Choosing a provider](#choosing-a-provider).

**`.env` files.** The library reads `process.env` and doesn't load `.env`
files itself. If your key lives in one, run `node --env-file=.env app.mjs`
(Node 20.6+).

</details>

## Meet the refiners

Four voices, one department. The work is mysterious and important.

| Method | Character key | Name | Voice |
| --- | --- | --- | --- |
| `refine.mark` | `mark` | Mark S. | Quiet, restrained, a little introspective |
| `refine.irving` | `irving` | Irving B. | Formal, poetic, deeply principled |
| `refine.dylan` | `dylan` | Dylan G. | Quick-witted, sarcastic, irreverent |
| `refine.milchick` | `milchick` | Mr. Milchick | Unnervingly cheerful, hyper-cordial, professional |

Examples from here on often skip the `import` line, and show each result's
`text` after `// =>`. Everything they use (`refine`, `createDefiantJazz`,
`DEFAULT_MODELS`) is a named export of `'defiant-jazz'`.

Same line, all four:

```javascript
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
[Models](#models) has Mark's line on `gpt-6-luna` too. Try all four live in
the [demo](https://defiant-jazz.vercel.app).

Picking a character at runtime? Pass the character key to the generic form,
`refine(text, "dylan")`. The `CHARACTERS` export maps each character key to
its display name.

## Options

Two terms first. An **instance** is the object you call refine methods on:
`refine` itself is a ready-made one, and `createDefiantJazz()` makes more.
A **token** is a chunk of a few characters, the unit providers measure and
bill text in.

The "Set on" column says where an option can go:

- **instance**: passed once to `createDefiantJazz(options)` (or to
  `configure(options)`), and applied to every call that instance makes.
- **call**: passed as the last argument to a single refine call, such as
  `refine.dylan(text, { lore: false })`, and applied to that call only. When
  an option is set on both, the per-call value wins.

| Option | Set on | Default | Notes |
| --- | --- | --- | --- |
| `provider` | instance | inferred from env vars | Which API to call: `'anthropic'` or `'openai'`. See [Choosing a provider](#choosing-a-provider). |
| `apiKey` | instance | `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | Your key for that provider. Requires `provider`. |
| `model` | instance, call | `claude-sonnet-5` / `gpt-6-luna` | Which of the provider's models writes the reply. See [Models](#models). |
| `maxTokens` | instance, call | `4096` | Caps how long the reply can be, in output tokens (a token is a few characters of text; reasoning tokens included). Input is not capped. See [What you get back](#what-you-get-back). |
| `effort` | instance, call | unset (model default) | How much the model reasons before answering. Anthropic only. See [Effort](#effort-anthropic-only). |
| `lore` | instance, call | `true` | Whether characters may use Lumon vocabulary. See [Lore](#lore). |
| `signal` | call | none | An `AbortSignal` to cancel the request, e.g. `AbortSignal.timeout(10_000)` to give up after 10 seconds. |

```javascript
import { createDefiantJazz } from 'defiant-jazz';

// Every call on `jazz` gets these settings unless the call overrides them.
// No apiKey here, so the key comes from ANTHROPIC_API_KEY.
const jazz = createDefiantJazz({ provider: 'anthropic', maxTokens: 1024, lore: false });

// Overrides `model` for this call only; maxTokens 1024 and lore off still apply.
await jazz.irving("The meeting is cancelled", { model: 'claude-opus-5-5' });
```

## What you get back

Every refine call returns (once awaited) an object like the one below. This
is the Quick start call, with the whole result shown: the shared `refine`,
only `ANTHROPIC_API_KEY` set, and every option at its default
(`claude-sonnet-5`, lore on, `maxTokens` 4096).

```javascript
const result = await refine.dylan("I need to focus on my work");
// {
//   text: "Yeah, gonna need to lock in here, chief—quit yappin' so I can go
//          stare at some numbers and pretend they mean something.",
//   model: "claude-sonnet-5",
//   usage: { inputTokens: 2808, outputTokens: 46 },
//   character: "Dylan G.",
// }
```

- `text` is the bare line, with no wrapping quotation marks.
- `model` is the model the provider reported answering with: here the
  Anthropic default; on OpenAI it can be a dated snapshot ID.
- `character` is the display name of the character who answered.
- `usage` is how many tokens the call used, and is omitted if the provider
  doesn't report it. More on that below.

### Reading `usage`

Providers measure text in tokens: chunks of a few characters, roughly three
quarters of an English word on average. Each call has two counts.

- `inputTokens` counts what was sent to the model: the text it reads before
  answering. Most of that is the character prompt the library writes and
  sends for you; your own line is only a few tokens of it. Expect about 2.8k
  input tokens per call with lore on and about 0.8k with `lore: false`
  (measured on the same quote: 2812 vs 840).
- `outputTokens` counts what the model wrote back: the reply in `text`, plus
  any reasoning tokens. Reasoning tokens are thinking the model does before
  it answers; they never appear in `text`, but they still count.

These two numbers are what the provider bills you on, at its per-token
prices. `maxTokens` only caps `outputTokens`; input has no cap. So a call
with `maxTokens: 1024` and lore on still sends about 2.8k input tokens, and
that's expected.

## Lore

By default, characters may reach for Lumon vocabulary (the break room, waffle
parties, Kier) when a quote's situation actually calls for it. It's
restrained on purpose: usually zero references, at most one, and only when it
fits.

```javascript
// Lore on (the default): the same Dylan line as in Meet the refiners.
await refine.dylan("They gave us pizza instead of raises");
// => Pizza. For raises. That's the trade. Still ate four slices—not
//    exactly a waffle party, but hey, I'm not made of stone.

await refine.dylan("They gave us pizza instead of raises", { lore: false });
// => Oh great, pizza. Pepperoni's really gonna cover my mortgage, huh?
//    "Here's a Domino's, buddy, now go innovate." Unbelievable.
```

Turn it off per call as above, or for a whole instance with
`createDefiantJazz({ lore: false })` (or `refine.configure({ lore: false })`
for the shared `refine`).

Turning lore off also makes each call's input about 70% smaller (roughly 0.8k
tokens instead of 2.8k), so each call is cheaper. See
[Reading `usage`](#reading-usage).

Adherence is weaker on OpenAI models; see [OpenAI](#openai) under Models.

One for the fans, unprompted and unedited:

```javascript
await refine.milchick("The printer is jammed again");
// => It appears our printer has, once again, elected to express its own
//    small act of defiant jazz—so if we could all extend it a bit of
//    patience while I coax it back into compliance, I'd be ever so
//    grateful.
```

## Choosing a provider

The library will not guess whose account to bill. When the choice is
ambiguous, it throws and tells you exactly what to pass.

```javascript
import { createDefiantJazz } from 'defiant-jazz';

const claude = createDefiantJazz({
  provider: 'anthropic',
  apiKey: 'sk-ant-...', // optional, falls back to ANTHROPIC_API_KEY
  model: 'claude-sonnet-5', // optional, this is the default
});

const gpt = createDefiantJazz({
  provider: 'openai',
  apiKey: 'sk-...', // optional, falls back to OPENAI_API_KEY
  model: 'gpt-6-luna', // optional, this is the default
});
```

Don't paste a real key into code you commit. Keep it in an env var, and
either leave `apiKey` out or read it from `process.env` as shown below.

- `provider` set: that provider, with its key from `apiKey` or its env var.
- `provider` omitted, exactly one of the two env vars set: that provider.
- `provider` omitted, both env vars set, or neither: throws.
- `apiKey` without `provider`: throws, so a key never goes to the wrong service.

Only those two env var names are read. For a key stored elsewhere, read it
yourself and pass it in:

```javascript
createDefiantJazz({ provider: 'openai', apiKey: process.env.MY_TEAM_OPENAI_KEY });
```

`refine` is a shared default instance, created for you on first use, that
follows the same rules. Point it at a provider with
`refine.configure({ provider: 'openai' })` (`configure` is also a named
export). Use `createDefiantJazz()` when you need an isolated instance: a
specific provider, per-request keys, a different model, tests.

## Models

```javascript
import { DEFAULT_MODELS } from 'defiant-jazz';
// { anthropic: 'claude-sonnet-5', openai: 'gpt-6-luna' }
```

Either default can be swapped with `model`, on an instance or per call.

### Anthropic

Sonnet 5 matched Opus 5's quality at 40% of the cost, and held up against the
5.5 generation. The full writeup is in
[model-comparison.md](model-comparison.md#conclusion).

Model IDs carry the generation number: `claude-sonnet-5-5` is Sonnet 5.5, a
newer generation than the default `claude-sonnet-5`, not a typo. The same
goes for `claude-opus-5-5` and `claude-haiku-5-5`.

Opt-ins worth knowing about:

| Model | Good for | Trade-off |
| --- | --- | --- |
| `claude-opus-5-5` | Best writing | ~2.7x the cost, ~2.5x the latency |
| `claude-haiku-5-5` | ~15x cheaper | Occasional untransformed quote or invented lore |
| `claude-sonnet-5-5` with `effort: 'low'` | Same cost as the default | No clear quality gain |

### OpenAI

The default is `gpt-6-luna`. It was the cheapest of seven OpenAI models
compared, and it stayed on task every time. The old default, `gpt-4o-mini`
(used by 0.8.2 and earlier), replied to the quote instead of rewriting it in
3 of 12 tries. The full writeup is in
[model-comparison.md](model-comparison.md#run-4--openai-models).

Opt-ins worth knowing about:

| Model | Good for | Trade-off |
| --- | --- | --- |
| `gpt-6.1-sol` | Best writing on OpenAI | ~20x the default's cost (still less than `claude-sonnet-5`); no lore |
| `gpt-4o` | Most natural lore on OpenAI | ~24x the default's cost |

Switching works the same way:

```javascript
const gpt = createDefiantJazz({ provider: 'openai', model: '<model-id>' });
await gpt.dylan("Hello world", { model: '<model-id>' }); // per call works too
```

Worth knowing about:

- Lore is weaker on every OpenAI model tested: a term from the show is
  either rare or forced in where it doesn't fit. The default almost never
  names one. See
  the known limitation in [CHANGELOG.md](CHANGELOG.md#060) (0.6.0). If lore
  matters to you, use Claude.
- GPT-5 and later need 0.8.2 or later. On 0.8.1 and earlier they fail with
  "Unsupported parameter: 'max_tokens'"; only the GPT-4 family (`gpt-4o`,
  `gpt-4.1` and their minis) works there.
- `model` in the result is whatever OpenAI reports, which can be a dated
  snapshot ID such as `gpt-4o-mini-2024-07-18`.

### Same quote, three models

This example uses both providers, so it needs both `ANTHROPIC_API_KEY` and
`OPENAI_API_KEY` set. That's allowed here: the both-keys error only happens
when `provider` is left out.

```javascript
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

// gpt-6-luna (OpenAI default)
await gpt.mark(quote);
// => They gave us pizza instead of raises. I guess it's still pizza.
//    That's something, technically.
```

## Effort (Anthropic only)

<details>
<summary>How much the model reasons before answering.</summary>

```javascript
// On an instance: every call on `fast` uses low effort.
const fast = createDefiantJazz({ provider: 'anthropic', effort: 'low' });
await fast.dylan("Hello world");

// Per call, on any instance whose provider is Anthropic.
await refine.dylan("Hello world", { effort: 'low' });
```

- Reasoning is thinking the model does before it writes the reply. It isn't
  shown in `text`, but it's billed as output tokens; see
  [Reading `usage`](#reading-usage).
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
| `Cannot use import statement outside a module` | From Node, not this library: the file was run as CommonJS. | Name the file `.mjs`, or add `"type": "module"` to your `package.json`. |
| `No API key found.` | No `provider`/`apiKey`, and neither env var is set. | Set `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`, or pass `provider` and `apiKey`. |
| `Both ANTHROPIC_API_KEY and OPENAI_API_KEY are set.` | Two possible providers and no `provider`. | Pass `provider: 'anthropic'` or `provider: 'openai'`. |
| `apiKey requires provider` | `apiKey` was passed without `provider`. | Add `provider` alongside `apiKey`. |
| `anthropic API key required` / `openai API key required` | `provider` is set, but no `apiKey` and no matching env var. | Set that provider's env var, or pass `apiKey`. |
| `effort is only supported with the Anthropic provider.` | `effort` is set and the provider is OpenAI. | Remove `effort`, or use `provider: 'anthropic'`. |
| `Unknown character:` | The character key isn't `mark`, `irving`, `dylan` or `milchick`. | Use a character key from `CHARACTERS`. |
| `Expected a character key (e.g. "dylan") but received an options object.` | Options were passed where the character key goes. | `refine.dylan(text, { lore: false })`, or `refine(text, "dylan", { lore: false })`. |
| `Text is required and cannot be empty` | The text was empty or whitespace. | Pass some text. |
| `Anthropic rejected the API key.` | Anthropic returned an authentication error. | Check `ANTHROPIC_API_KEY` or `apiKey`. |
| `Anthropic rate limit hit.` | Anthropic returned a rate-limit error. | Retry after a short delay. |
| `Anthropic API error (` | Any other Anthropic API error, with its status and message. | Read the message; a model rejecting `effort` lands here. |
| `OpenAI rejected the API key.` | OpenAI returned an authentication error. | Check `OPENAI_API_KEY` or `apiKey`. |
| `OpenAI account has no credit left.` | OpenAI returned `insufficient_quota`: the account has no credit or billing set up. | Add credit or billing at [platform.openai.com](https://platform.openai.com). Retrying won't help. |
| `OpenAI rate limit hit.` | OpenAI returned a rate-limit error. | Retry after a short delay. |
| `OpenAI API error (` | Any other OpenAI API error, with its status and message. | Read the message; an unknown model ID lands here as a 404. |
| `Anthropic returned no text content (stop_reason: max_tokens)` | Reasoning used up the token budget. | Raise `maxTokens`, or lower `effort`. |
| `OpenAI returned no content.` | OpenAI sent back an empty completion. | Retry, or raise `maxTokens`. |

An account with no credit or billing set up fails on the first call: as
`Anthropic API error (...)` on Anthropic, or as `OpenAI account has no credit
left.` on OpenAI. The fix is adding credit in the provider's console.

If you cancel a call with `signal`, the SDK's own abort error is thrown
unchanged on both providers, so you can tell a cancel apart from a failure.
Network failures before any response arrives come through as
`Anthropic API error (undefined)` or `OpenAI API error (undefined)`.

</details>

## API reference

| Export | What it is |
| --- | --- |
| `refine` | Shared instance: `refine(text, character, opts?)` or `refine.<character>(text, opts?)`, where `character` is a character key such as `"dylan"` |
| `createDefiantJazz(opts?)` | Returns an isolated instance with the same call shapes |
| `configure(opts)` | Configures the shared `refine`; same as `refine.configure(opts)` |
| `CHARACTERS` | `{ mark: "Mark S.", irving: "Irving B.", dylan: "Dylan G.", milchick: "Mr. Milchick" }` |
| `DEFAULT_MODELS` | `{ anthropic: 'claude-sonnet-5', openai: 'gpt-6-luna' }` |

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
