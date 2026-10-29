# Model comparison

Runs 1–2 compared Opus 5, Sonnet 5 and Haiku 4.5 and set the default to
Sonnet 5. Run 3 checked whether the 5.5 generation (Sonnet 5.5, Haiku 5.5,
Opus 5.5) should replace it. Run 4 did the same for the OpenAI provider,
whose default is `gpt-4o-mini`.

When runs 1–2 were done, the Anthropic provider's default model was
`claude-opus-5` ([src/providers/anthropic.ts](src/providers/anthropic.ts)). Opus 5 is priced
at $5 / $25 per MTok (input/output) — a stylistic single-turn rewrite like
this doesn't obviously need frontier-model reasoning, so it's worth checking
whether a cheaper model holds the same quality before defaulting everyone who
installs this package to the most expensive tier.

This document is that check, and is expected to be rerun (see
[Reproducing](#reproducing)) whenever the lore prompt changes materially,
since a prompt edit can shift which model handles it best.

## Method (runs 1–2)

Four quotes, one per character, run through all three models with identical
system prompts (`lore: true`) via the package's own `createDefiantJazz` /
Anthropic provider path — no mocking, live API calls.

| Model | Price (in/out per MTok) |
| --- | --- |
| `claude-opus-5` | $5.00 / $25.00 |
| `claude-sonnet-5` | $2.00 / $10.00 (2.5× cheaper) |
| `claude-haiku-4-5` | $1.00 / $5.00 (5× cheaper) |

## Run 1 — prompt at `a6f86ba` (lore toggle, no theme layer)

### "They gave us pizza instead of raises." → Milchick

| Model | Output |
| --- | --- |
| Opus 5 | "In lieu of a compensatory adjustment, the company has elected to furnish you with pizza—and I daresay it is a most generous pie! Let us savor it in the spirit in which it was offered, and should your enthusiasm require replenishment, I have it on good authority that a waffle party may well be within reach." |
| Sonnet 5 | It appears our compensation this quarter arrived in a warm, circular, delightfully cheesy form rather than a numerical one—and I do hope you'll find that just as nourishing, if not more so, than a raise! Bon appétit, truly. |
| Haiku 4.5 | "Well, I do hope you've had the opportunity to partake of the pizza—a most delectable offering, I must say! A gesture of appreciation from the organization, you understand. Though I confess the matter of compensation adjustments is, ah, rather beyond my purview to adjudicate at present. But pizza! Surely that represents a flourishing of morale, yes? A token of our collective esteem?" |

Opus reaches for the actual lore term ("waffle party"); Sonnet stays clean
and still nails the euphemistic cheer; Haiku is good but wordier and skips
the lore term entirely — closer to generic corporate-speak than distinctly
Milchick.

### "I think my landlord is trying to evict me." → Mark

| Model | Output |
| --- | --- |
| Opus 5 | I think my landlord's... trying to get rid of me. There's been letters. And he's been doing that thing where he's real friendly in the hallway, which is — yeah. That's usually how it starts. |
| Sonnet 5 | "Yeah, so... pretty sure my landlord's trying to get rid of me. He hasn't said it outright, it's more just... a lot of notes taped to my door. Which, you know. Isn't a great sign." |
| Haiku 4.5 | I think... I mean, it seems like my landlord might be trying to evict me. Or at least heading in that direction. I'm not entirely sure yet, but the signs are there. The notices, the emails. It's not looking great, I guess. |

All three close. Opus and Sonnet each add one concrete detail (letters /
hallway friendliness; notes on the door) that sells the "trailing off, lost
in thought" voice. Haiku is a touch more repetitive and hedgy — reads
slightly less controlled.

### "This meeting could have been an email." → Dylan

| Model | Output |
| --- | --- |
| Opus 5 | Oh, cool, forty-five minutes of my life for something you could've typed in one sentence. Two, if you were feeling fancy. I sat down. I made a face like I was listening. And what did I get? Nothing. No takeaway, no snack, nothing. Just a guy with a slideshow. Send the email next time, man. I'll even read it. Probably. |
| Sonnet 5 | This meeting could've been an email. A *text*. A carrier pigeon. Literally anything that doesn't involve me sitting here watching someone's PowerPoint buffer for twenty minutes of my one and only life. |
| Haiku 4.5 | "Dude, this meeting could've been a fucking email. Like, seriously—we all know it. Everyone in this room knows it. But here we are, burning an hour of our lives that we're never getting back, so... yeah. Email. That's what this was." |

Opus is the funniest and most textured ("I made a face like I was
listening" is a real bit, not just profanity plus sarcasm). Sonnet's
escalating list ("a text. A carrier pigeon.") is a strong device too. Haiku
is the weakest of the three here — competent, but reads as swearing
inserted into the sentence rather than Dylan's specific rhythm.

### "I finally finished the quarterly report." → Irving

| Model | Output |
| --- | --- |
| Opus 5 | "The quarterly report is complete at last. Every column squared, every figure accounted for, and the whole of it set down in good order. There is a quiet dignity in finishing a thing properly—I shall permit myself a moment's satisfaction, and then return to my duties." |
| Sonnet 5 | The quarterly report has, at last, been brought to its proper and rightful completion. There is a particular dignity in seeing a task through to its final page—an orderliness that I confess brings me no small measure of satisfaction. |
| Haiku 4.5 | I have, at last, brought the quarterly report to its proper completion. It required a disciplined commitment to the work, a steady hand and a faithful adherence to the principles of thoroughness, but it is done. The perpetuity wing of our institution demands nothing less than our most rigorous efforts, and I trust this submission reflects that devotion. |

All three strong — Irving's formal cadence is the easiest voice to hit.
Notably, Haiku reaches for "the perpetuity wing," a lore term, but the
prompt's own rule says a reference should fire only when it "genuinely
matches," and a quarterly report has no real connection to institutional
reverence. That's a forced reference the other two models correctly
avoided.

## Run 2 — prompt at `e226d24` (added emotional-theme layer)

Rerun after the emotional-theme layer landed
(`feat: add a light emotional-theme layer to the lore prompt`), same
quotes/characters, to check whether the model ranking still holds under a
changed prompt. It doesn't hold uniformly — one clear regression showed up.

### "They gave us pizza instead of raises." → Milchick

| Model | Output |
| --- | --- |
| Opus 5 | "Now, I know some of you were anticipating an adjustment to your compensation—but I am positively delighted to announce that the Board has authorized *pizza*. Hot, circular, and abundant! Let no one say your labors go unrecognized. And should this prove insufficiently nourishing to the spirit, do take heart: I am told the melon bar is being restocked as we speak." |
| Sonnet 5 | It seems the organization has, in its infinite wisdom, elected to bestow upon you the gift of pizza in lieu of a raise—a wonderfully aromatic gesture of appreciation, wouldn't you agree, one I hope satiates you nearly as thoroughly as compensation might have! Do savor each slice; I daresay it was purchased with tremendous esteem for your continued flourishing. |
| Haiku 4.5 | Well, I must say, while the culinary offering was undoubtedly... *generous*... one does wonder if the nutritional bounty of a pizza party might not have been better paired with, shall we say, a more *substantive* form of appreciation. But I'm quite certain the gesture was intended with the warmest regard for your flourishing! Truly, pizza can be such a *delightful* token of our esteem. |

All three picked up more performative warmth ("flourishing," heavier
italics) — consistent with the new theme layer's intent (Milchick's
exhaustion at performing chosen warmth). Opus and Haiku both name a lore
term this time (melon bar; implicitly leaning on the reward-euphemism
register); quality held across all three.

### "I think my landlord is trying to evict me." → Mark

| Model | Output |
| --- | --- |
| Opus 5 | I think... my landlord's trying to get rid of me. There've been notices. Under the door, taped to the door. One of them was, uh, certified, which I guess means it's serious. I haven't opened it. I keep meaning to. It's just — you open it and then it's happening, you know? So it's sitting on the counter. Right there. And I sort of walk past it like it isn't. |
| Sonnet 5 | "Yeah, so... I think my landlord's trying to evict me. Been getting these notices. I don't know, I just kind of... put them in a drawer. Which is probably not the move, but. Here we are." |
| Haiku 4.5 | I think... my landlord's trying to push me out. *pause* Yeah. |

**Regression on Haiku.** It collapsed to a near-empty response — three
words and a stage direction. Technically "restrained," but too sparse to
count as a real transformation; it doesn't land the new grief/avoidance
theme at all. Opus, by contrast, is where that theme lands best this
round — "you open it and then it's happening... I sort of walk past it
like it isn't" is a genuine improvement over run 1. Sonnet stayed solid
and consistent with its run 1 output (drawer vs. counter — same avoidance
beat, similar length).

### "This meeting could have been an email." → Dylan

| Model | Output |
| --- | --- |
| Opus 5 | Okay, so—nobody's saying it, so I will. This whole thing? An email. Nine words, maybe ten if you're feeling fancy. Hit send, we all go back to our desks, everybody's happy. Instead we're forty minutes deep in a room with no snacks. No snacks, man. You drag me somewhere, there better be a melon bar at the end of it. |
| Sonnet 5 | "This meeting could've been an email. Instead I gave up forty-five minutes of my life I'm never getting back so Burt from O&D could hear himself talk. Real generous of him." |
| Haiku 4.5 | "Dude, this whole thing could've been a fucking email. Like, seriously—we're sitting here wasting an hour so somebody can tell us shit they could've just... sent. To our inbox. Where we could've ignored it properly." |

All three still solid. Sonnet's "Burt from O&D" is a specific, well-placed
lore reference (O&D as rival/absurdity, per the prompt's stance table) —
better targeted than its own run 1 output. Haiku's closing line ("where we
could've ignored it properly") is a nice touch, closer to Dylan's voice
than its run 1 attempt.

### "I finally finished the quarterly report." → Irving

| Model | Output |
| --- | --- |
| Opus 5 | The quarterly report is complete. I confess it resisted me longer than I should have permitted, but I did not abandon it, and I did not hurry it. The final page was set down this morning. A task carried to its proper end—that is its own quiet reward, and I shall take no other. |
| Sonnet 5 | At last—the quarterly report stands complete. I confess there is a certain dignity in seeing a task through to its final period, in honoring the labor with the diligence it was owed from the first page to the last. |
| Haiku 4.5 | I have finally brought the quarterly report to its completion. It is a task of considerable weight, one that demands precision and discipline—the sort of work that, when executed with proper rigor, affirms our commitment to the principles that govern us. The accomplishment, though it may seem routine to some, carries with it a quiet dignity. |

All three strong again. Haiku's forced "perpetuity wing" reference from
run 1 is gone this time — a mild improvement, though it may just be
prompt-sampling noise from one quote rather than a systematic fix.

## Run 3 — Sonnet 5.5, Haiku 5.5, Opus 5.5

Same prompt as run 2 (`e226d24`; unchanged since), same four quote/character
pairs, `lore: true`. Two changes to the method:

- **Three samples per pair** instead of one, so a single lucky or unlucky
  draw doesn't decide a ranking.
- **Cost and latency are measured**, from each response's token usage, not
  estimated from list prices.

Sonnet 5.5 was run twice: at its default effort, and at `effort: "low"` (the
option added in 0.7.0). Full outputs, all 60 of them, are in
[transcripts/model-comparison-run-3.md](transcripts/model-comparison-run-3.md).

| Variant | Price (in/out per MTok) | Cost/call | Latency | Output tokens | Words |
| --- | --- | --- | --- | --- | --- |
| `claude-sonnet-5` (default) | $2 / $10 | $0.0063 | 1.9s | 77 | 41 |
| `claude-sonnet-5-5` | $2 / $10 | $0.0081 | 3.4s | 261 | 36 |
| `claude-sonnet-5-5`, `effort: "low"` | $2 / $10 | $0.0063 | 2.1s | 76 | 41 |
| `claude-haiku-5-5` | $0.10 / $0.50 | $0.0004 | 2.1s | 276 | 42 |
| `claude-opus-5-5` | $4 / $20 | $0.0172 | 4.8s | 308 | 54 |

Input is about 2,770 tokens per call (the system prompt), so input dominates
cost for the Sonnets.

### Sonnet 5.5 vs Sonnet 5

At its default effort Sonnet 5.5 spends roughly 180 tokens reasoning before
each reply, which is where its extra 30% cost and slower replies come from.
The replies themselves are about the same length. Quality is roughly even,
but it varied less between samples: all three Irving outputs open "At long
last…" (two "set down my pen"), and all three Milchick outputs end "until the
next melon bar". Its best line was Mark's avoidance beat: *"if you don't ask,
it's still sort of... undecided."*

At `effort: "low"` the reasoning disappears (76 output tokens) and cost
matches Sonnet 5 exactly. Dylan was the strongest of any variant (*"watching
Gary chew on a pen cap"*), and Irving had a standout line (*"settles in me
now like the quiet after a bugle's final note"*), but the sameness remained:
all three Irving outputs open "It is done.", and Milchick again ended every
sample on "until the next melon bar". Overall a tie with Sonnet 5.

### Haiku 5.5

A clear improvement on Haiku 4.5: no near-empty responses, and Milchick and
Dylan were good. Rough edges remain:

- Two of three Mark outputs repeat the input quote verbatim, then add a
  "Quiet pause." stage direction, instead of transforming it.
- Two Dylan outputs were near-duplicates ("call the Nobel committee… the
  sky's blue").
- One invented lore that isn't in the show: "Kier's a sad little guy in a
  fish tank."

### Opus 5.5

The best writing of the run, especially Mark (*"they're very polite, which
is somehow worse"*) and Irving (*"every column brought smartly into line like
a company dressed for inspection"*). Also the most expensive (2.7× Sonnet 5),
the slowest, and the wordiest; one Milchick reply ran 82 words.

## Run 4 — OpenAI models

Same four quote/character pairs, three samples each, `lore: true`, cost and
latency measured as in Run 3. The prompt is at `d05d5a1`. That's one change
since Run 3: the 0.8.1 fix that passes the input in a `<quote>` block and
asks for the line without wrapping quotes. Character voices and lore are
unchanged, so the runs are comparable, but not identical. Full outputs, all
84 of them, are in
[transcripts/model-comparison-run-4.md](transcripts/model-comparison-run-4.md).

Seven models: the default, its bigger sibling, one model from each later
generation's small tier, and the two mid-priced GPT-6.1 models.

| Model | Price (in/out per MTok) | Cost/call | Latency | Output tokens | Words | Lore terms used |
| --- | --- | --- | --- | --- | --- | --- |
| `gpt-4o-mini` (default) | $0.15 / $0.60 | $0.0003 | 0.9s | 33 | 26 | 1 of 12 |
| `gpt-4o` | $2.50 / $10 | $0.0048 | 1.0s | 26 | 22 | 4 of 12 |
| `gpt-4.1-mini` | $0.40 / $1.60 | $0.0008 | 0.9s | 39 | 31 | 9 of 12 |
| `gpt-5-mini` | $0.25 / $2 | $0.0018 | 7.2s | 654 | 25 | 6 of 12 |
| `gpt-6-luna` | $0.10 / $0.50 | $0.0002 | 1.5s | 38 | 18 | 1 of 12 |
| `gpt-6.1-terra` | $1 / $5 | $0.0020 | 2.1s | 45 | 17 | 0 of 12 |
| `gpt-6.1-sol` | $2 / $10 | $0.0041 | 2.7s | 45 | 21 | 0 of 12 |

Prices are OpenAI's standard tier, checked on 2026-10-28. "Lore terms used"
counts outputs that name something from the show (melon bar, Kier, the
perpetuity wing, and so on). For reference, every Claude model in Run 3 did
this in 3 of 12. Some OpenAI models reach for lore much more often, and
others almost never.

Two things hold across all seven models:

- **Shorter replies.** 17–31 words, against 36–54 for Claude.
- **Cheaper calls.** Every model here costs less per call than
  `claude-sonnet-5` ($0.0063), mostly because input is cheaper.

### `gpt-4o-mini` (the default)

The weakest of the run. All three Mark outputs reply *to* the quote instead
of rewriting it in his voice (*"That sounds... frustrating. I mean, it's
like you're just trying to get by"*), so a quarter of its outputs miss the
task. It named one lore term in twelve tries, which matches the 0.6.0 known
limitation. Milchick was florid but toothless, and Irving fell back on
generic phrases (*"our noble duties"*). Dylan was fine.

### `gpt-4o`

On task all 12 times, with the most natural lore of the run: Dylan's *"even
a finger trap would have conveyed more meaningful intel"* and an Irving that
names Kier. About 16× the default's cost, but still cheaper than
`claude-sonnet-5`.

### `gpt-4.1-mini`

Uses lore the most and lands it the worst: *"a veritable, if humble, melon
bar of the spirit"*, and a Mark that replies to the quote and ends up *"in
the break room of life"*. Irving was good (*"a humble offering to the
perpetuity wing"*). Milchick rambled.

### `gpt-5-mini`

Not recommended. It spends about 600 tokens reasoning per call, which makes
it the slowest model here by far (7.2s). All three Mark outputs are close to
the input word for word. Dylan stepped outside the show, with LinkedIn and
PowerPoint references.

### `gpt-6-luna`

The cheapest model tested, about a third cheaper than the default, and on
task all 12 times. Mark sounds like himself (*"So... that's happening."*),
and Irving is dignified if plain. Lore is nearly absent: one "waffle party"
in twelve. Two of the Milchick outputs were near-duplicates.

### `gpt-6.1-terra`

On task, but the tersest and most repetitive model here: two Dylan outputs
both end *"Hell, a subject line."* Two of the Irving outputs are nearly the
same. Milchick was polite with no edge. It costs 10× `gpt-6-luna` and isn't
clearly better.

### `gpt-6.1-sol`

The best writing of the run. Milchick finally has his real register,
menace inside politeness: *"Do avail yourselves while that appreciation is
still warm"* and *"in such a shareable format"*. Mark was good (*"Not,
uh... not in a helpful way."*). Dylan swears the hardest, which the
character prompt asks for. Two of the Irving outputs were word-for-word
identical, and no output used lore. It costs about two-thirds of
`claude-sonnet-5`.

## Conclusion

**The default stays `claude-sonnet-5`** (Run 3). Neither Sonnet 5.5 variant
beat it: at default effort it costs 30% more and is slower for no quality
gain, and at `effort: "low"` it ties on cost and quality. Switching would
change how every user's output reads for no clear benefit. Revisit if
Sonnet 5 is retired or the prompt changes materially.

Opt-ins worth knowing about:

- **`claude-opus-5-5`** for the best writing, at 2.7× the cost and about
  2.5× the latency.
- **`claude-haiku-5-5`** for cost: about 15× cheaper than Sonnet 5 and much
  better than Haiku 4.5, but expect the occasional untransformed quote or
  invented lore.
- **`claude-sonnet-5-5` with `effort: "low"`** is a reasonable alternative at
  the same cost as the default.

From runs 1–2, still true: don't default to Haiku 4.5 (the near-empty Mark
response in run 2), and Sonnet 5 was chosen over Opus 5 at 40% of its cost
with matching quality.

**On OpenAI, `gpt-4o-mini` should be replaced** (Run 4). Unlike the
Anthropic default, it has a real defect: it missed the task in 3 of 12
outputs by replying to Mark's quote instead of rewriting it. `gpt-6-luna`
stayed on task all 12 times, costs about a third less, and reads at least as
well. The trade-off is lore: luna almost never names anything from the show,
but neither does `gpt-4o-mini`. **The OpenAI default is now `gpt-6-luna`**
(0.9.0 and later). To keep the old behavior, pass `model: 'gpt-4o-mini'`.

OpenAI opt-ins worth knowing about:

- **`gpt-6.1-sol`** for the best writing, especially Milchick, at about
  two-thirds the cost of `claude-sonnet-5`. It uses no lore.
- **`gpt-4o`** for the most natural lore on OpenAI, at a similar cost to
  `gpt-6.1-sol`.

Avoid `gpt-5-mini` (slow, barely transforms Mark) and `gpt-4.1-mini`
(forced lore).

On every OpenAI model, lore is either rare or forced. The 0.6.0 known
limitation in [CHANGELOG.md](CHANGELOG.md) still holds across the board, not
just for `gpt-4o-mini`. If lore matters to you, use Claude.

## Reproducing

```
pnpm build
node --env-file=.env transcripts/compare-models.mjs
```

With no arguments it runs the Run 3 set. Pass variants to choose your own,
as model IDs with an optional effort level:

```
node --env-file=.env transcripts/compare-models.mjs claude-sonnet-5 claude-sonnet-5-5@low
```

IDs starting with `claude-` run on Anthropic, and everything else runs on
OpenAI, so both keys can be in `.env` at once. Effort works only on
Anthropic. Run 4 was:

```
node --env-file=.env transcripts/compare-models.mjs gpt-4o-mini gpt-4o gpt-4.1-mini gpt-5-mini gpt-6-luna gpt-6.1-terra gpt-6.1-sol
```

That's 84 calls, about $0.17.

`SAMPLES=n` sets samples per pair (default 3). It writes a summary table and
every output to `transcripts/model-comparison-latest.md`. Every call is a live
API call; the full Run 3 set is 60 calls, about $0.45. Add any new model's
price to `PRICES` in the script, or its cost shows as "n/a".

Rerun whenever the lore prompt changes in a way that could plausibly shift
which model handles it best — as it did between runs 1 and 2.
