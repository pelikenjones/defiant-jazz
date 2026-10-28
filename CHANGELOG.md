# Changelog

All notable changes to this package are documented here.

## 0.7.0

### Added

- `effort` option (Anthropic only), on both `createDefiantJazz()` /
  `configure()` and per call. Sent as `output_config.effort`; when unset,
  nothing is sent and each model keeps its own default, so existing
  behavior is unchanged. Setting it with the OpenAI provider throws rather
  than being silently ignored. The `Effort` type is exported and comes from
  the Anthropic SDK, so new levels arrive with SDK updates.

## 0.6.2

### Changed

- **Breaking (for anyone not pinning `model` explicitly):** lowered the
  Anthropic provider's default model from `claude-opus-5` to
  `claude-sonnet-5`. A head-to-head comparison across Opus 5, Sonnet 5, and
  Haiku 4.5 — rerun after the 0.6.1 prompt change to check the ranking still
  held — found Sonnet 5 matched Opus 5's output quality (occasionally
  exceeding it) at 40% of the cost, with no regressions across either
  prompt version. Haiku 4.5 was ruled out as a default after a documented
  regression: a near-empty response on one probe quote that didn't engage
  with the 0.6.1 emotional-theme layer at all. Full writeup, including both
  runs' outputs side by side, in
  [model-comparison.md](model-comparison.md). The OpenAI default
  (`gpt-4o-mini`) is untouched — out of scope for this comparison.

## 0.6.1

### Changed

- Added a light emotional-theme layer alongside each character's existing
  Lumon stance in the lore prompt — a one-clause undercurrent per character
  (Mark: grief without memory of what's grieved; Irving: devotion that costs
  him the relationship that made it bearable; Dylan: wanting the reward more
  than he'd admit; Milchick: the exhaustion of performing warmth nobody
  chose). This is tone, not a new countable reference — it rides the
  existing "at most one Lumon term" restraint rules rather than adding a
  parallel budget, and does not touch the existing prohibition on
  referencing plot events.

  This was **not** an attempt to address the OpenAI stance-matrix gap noted
  below — it's evaluated purely on whether it improves output quality,
  primarily checked against Anthropic. Verified with a scripted before/after
  transcript comparison (six quotes × four characters, generated on live
  API calls both before and after the change) rather than ad hoc spot
  checks; see `transcripts/` on the `feature/lore-themes` branch for the
  raw comparison. Anthropic output showed genuine improvement in at least
  two cases (Irving's closing "Praise Kier" on a purposelessness quote;
  Milchick's threat of the break room surfacing unprompted when a
  colleague wrongs him) with no loss of density discipline — the neutral
  probe quote stayed completely clean in both runs. As a passive data
  point (not a claim of having fixed anything), a rerun of the known-weak
  OpenAI probe case did name "the break room" directly post-change, where
  it hadn't in 0.6.0 testing — noted for whoever eventually builds the
  proper eval set, not treated as resolution here.

## 0.6.0

### Known limitation

- Prompt adherence to the stance matrix is noticeably weaker on OpenAI
  (`gpt-4o-mini`) than on Anthropic in manual spot-checks: characters
  sometimes gesture vaguely near a Lumon term instead of naming it, or skip
  a genuinely-earned reference (e.g. Milchick not naming "the break room"
  when threatening someone, despite that being his most central stance).
  Two rounds of manual prompt tweaking produced mixed, non-convergent
  results (fixing one probe case regressed another), suggesting this needs
  a proper eval set (multiple quotes × characters × providers, compared
  systematically) rather than further ad hoc adjustment. Tracked as a
  follow-up; not blocking this release since the toggle mechanism itself
  is verified correct on both providers.

### Added

- Characters now reach for Lumon/*Severance* workplace vocabulary — the break
  room, waffle parties, Kier and the Nine Principles, innie/outie, O&D, Cold
  Harbor, and more — when a quote's situation genuinely calls for it. Each
  character has a distinct stance toward each term grounded in the show (e.g.
  Milchick sends people to the break room and bestows waffle parties; Dylan
  gets sent and covets the parties; Irving is a reverent believer in Kier;
  Mark is largely indifferent to all of it). Usage is deliberately
  restrained — most responses include no reference at all, never more than
  one.
- New `lore?: boolean` option on both `DefiantJazzOptions` (instance-level)
  and `RefineOptions` (per-call), defaulting to `true`. Set `false` for a
  clean voice-only transformation with no show vocabulary. Per-call setting
  overrides the instance setting.

## 0.5.0

### Changed

- Removed the hardcoded `temperature: 0.7` on the OpenAI provider. The two
  providers previously ran at different, undocumented sampling temperatures —
  OpenAI pinned to 0.7, Anthropic left unset (SDK default 1.0). Anthropic's
  `temperature` parameter is deprecated for models released after Claude Opus
  4.6 (this package defaults to `claude-opus-5`) and rejects any non-1.0 value
  with a 400 error, so parity could only be reached by moving OpenAI to 1.0
  rather than adding the option to Anthropic. OpenAI output may read slightly
  more varied than before as a result — the higher setting also suits
  character-voice transformation better than the previous conservative value.

## 0.4.1

### Fixed

- `refine`/`createDefiantJazz` instances now validate the character key before
  making an API call. Previously an unknown key (e.g. a typo like `"milcheck"`)
  silently produced `undefined`, which was sent to the provider as part of the
  prompt — resulting in a garbage response and a billed API call instead of an
  error.
- Passing an options object where a character key is expected (a common
  mix-up between the generic `refine(text, character, options)` form and the
  `refine.dylan(text, options)` method form) now throws immediately with a
  message pointing at the correct call shape, instead of failing the same
  silent way.
