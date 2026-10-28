import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const anthropicCreate = vi.fn();
const openaiCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    apiKey: string;
    messages = { create: anthropicCreate };
    constructor(opts: { apiKey: string }) {
      this.apiKey = opts.apiKey;
    }
  }
  class AuthenticationError extends Error {}
  class RateLimitError extends Error {}
  class APIError extends Error {
    status = 500;
  }
  return {
    default: Object.assign(MockAnthropic, {
      AuthenticationError,
      RateLimitError,
      APIError,
    }),
  };
});

vi.mock("openai", () => {
  class MockOpenAI {
    apiKey: string;
    chat = { completions: { create: openaiCreate } };
    constructor(opts: { apiKey: string }) {
      this.apiKey = opts.apiKey;
    }
  }
  return { default: MockOpenAI };
});

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  anthropicCreate.mockReset();
  openaiCreate.mockReset();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.OPENAI_API_KEY;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

describe("CHARACTERS", () => {
  it("maps every character key to a display name", async () => {
    const { CHARACTERS } = await import("../index.js");
    expect(CHARACTERS).toEqual({
      mark: "Mark S.",
      irving: "Irving B.",
      dylan: "Dylan G.",
      milchick: "Mr. Milchick",
    });
  });
});

describe("input validation", () => {
  it("throws on empty text", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    const { createDefiantJazz } = await import("../index.js");
    const dj = createDefiantJazz();
    await expect(dj.dylan("")).rejects.toThrow(/cannot be empty/);
  });

  it("throws on whitespace-only text", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    const { createDefiantJazz } = await import("../index.js");
    const dj = createDefiantJazz();
    await expect(dj.dylan("   ")).rejects.toThrow(/cannot be empty/);
  });
});

describe("character validation", () => {
  it("throws on an unknown character key and lists the valid ones", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    const { createDefiantJazz } = await import("../index.js");
    const dj = createDefiantJazz();

    // @ts-expect-error - deliberately passing an invalid character key
    await expect(dj("hello", "milcheck")).rejects.toThrow(
      /Unknown character: "milcheck".*mark, irving, dylan, milchick/
    );
    expect(anthropicCreate).not.toHaveBeenCalled();
  });

  it("throws when an options object is passed in the character position", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    const { createDefiantJazz } = await import("../index.js");
    const dj = createDefiantJazz();

    // @ts-expect-error - deliberately passing an options object as the character
    await expect(dj("hello", { lore: false })).rejects.toThrow(
      /received an options object.*refine\(text, character, options\)/
    );
    expect(anthropicCreate).not.toHaveBeenCalled();
  });

  it("still accepts valid character keys via both call shapes", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    anthropicCreate.mockResolvedValue({
      content: [{ type: "text", text: "mocked" }],
    });
    const { createDefiantJazz } = await import("../index.js");
    const dj = createDefiantJazz();

    await expect(dj("hello", "dylan")).resolves.toEqual({
      text: "mocked",
      character: "Dylan G.",
    });
    await expect(dj.dylan("hello")).resolves.toEqual({
      text: "mocked",
      character: "Dylan G.",
    });
  });
});

describe("provider resolution", () => {
  it("throws a useful error when no API key is set", async () => {
    const { createDefiantJazz } = await import("../index.js");
    const dj = createDefiantJazz();
    await expect(dj.dylan("hello")).rejects.toThrow(/ANTHROPIC_API_KEY/);
  });

  it("uses Anthropic when ANTHROPIC_API_KEY is set", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    anthropicCreate.mockResolvedValue({
      content: [{ type: "text", text: "mocked" }],
    });

    const { createDefiantJazz } = await import("../index.js");
    const dj = createDefiantJazz();
    const result = await dj.dylan("hello");

    expect(result).toEqual({ text: "mocked", character: "Dylan G." });
    expect(anthropicCreate).toHaveBeenCalledTimes(1);
    expect(openaiCreate).not.toHaveBeenCalled();
  });

  it("falls back to OpenAI when only OPENAI_API_KEY is set", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    openaiCreate.mockResolvedValue({
      choices: [{ message: { content: "mocked openai" } }],
    });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { createDefiantJazz } = await import("../index.js");
    const dj = createDefiantJazz();
    const result = await dj.dylan("hello");

    expect(result).toEqual({ text: "mocked openai", character: "Dylan G." });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("uses OpenAI when provider: 'openai' is explicit, even with both keys set", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    process.env.OPENAI_API_KEY = "sk-test";
    openaiCreate.mockResolvedValue({
      choices: [{ message: { content: "mocked openai" } }],
    });

    const { createDefiantJazz } = await import("../index.js");
    const dj = createDefiantJazz({ provider: "openai" });
    const result = await dj.dylan("hello");

    expect(result).toEqual({ text: "mocked openai", character: "Dylan G." });
    expect(openaiCreate).toHaveBeenCalledTimes(1);
    expect(anthropicCreate).not.toHaveBeenCalled();
  });

  it("prefers an explicit apiKey option over env vars", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-env";
    anthropicCreate.mockResolvedValue({
      content: [{ type: "text", text: "mocked" }],
    });

    const { createDefiantJazz } = await import("../index.js");
    const dj = createDefiantJazz({ provider: "anthropic", apiKey: "sk-ant-explicit" });
    await dj.dylan("hello");

    // The mock client stashes the constructor arg as `.apiKey`.
    expect(anthropicCreate).toHaveBeenCalledTimes(1);
  });

  it("throws when both env keys are set and no provider is given", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    process.env.OPENAI_API_KEY = "sk-test";

    const { createDefiantJazz } = await import("../index.js");
    const dj = createDefiantJazz();

    await expect(dj.dylan("hello")).rejects.toThrow(/Both ANTHROPIC_API_KEY and OPENAI_API_KEY/);
    expect(anthropicCreate).not.toHaveBeenCalled();
    expect(openaiCreate).not.toHaveBeenCalled();
  });

  it("throws when apiKey is passed without provider", async () => {
    const { createDefiantJazz } = await import("../index.js");
    const dj = createDefiantJazz({ apiKey: "sk-test" });

    await expect(dj.dylan("hello")).rejects.toThrow(/apiKey requires provider/);
    expect(anthropicCreate).not.toHaveBeenCalled();
    expect(openaiCreate).not.toHaveBeenCalled();
  });

  it("recovers once configure() supplies the missing provider", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    process.env.OPENAI_API_KEY = "sk-test";
    openaiCreate.mockResolvedValue({
      choices: [{ message: { content: "mocked openai" } }],
    });

    const { createDefiantJazz } = await import("../index.js");
    const dj = createDefiantJazz();
    await expect(dj.dylan("hello")).rejects.toThrow(/Both/);

    dj.configure({ provider: "openai" });
    await expect(dj.dylan("hello")).resolves.toMatchObject({ text: "mocked openai" });
  });
});

describe("DEFAULT_MODELS", () => {
  it("exposes the model each provider runs when none is set", async () => {
    const { DEFAULT_MODELS } = await import("../index.js");
    expect(DEFAULT_MODELS).toEqual({ anthropic: "claude-sonnet-5", openai: "gpt-4o-mini" });
    expect(Object.isFrozen(DEFAULT_MODELS)).toBe(true);
  });

  it("matches the model actually sent on a zero-config call", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    openaiCreate.mockResolvedValue({
      choices: [{ message: { content: "mocked openai" } }],
    });

    const { createDefiantJazz, DEFAULT_MODELS } = await import("../index.js");
    await createDefiantJazz().dylan("hello");

    expect(openaiCreate.mock.calls[0][0]).toMatchObject({ model: DEFAULT_MODELS.openai });
  });
});

describe("generic vs. character-method calls", () => {
  it("refine(text, character) and refine.dylan(text) send identical requests", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    anthropicCreate.mockResolvedValue({
      content: [{ type: "text", text: "mocked" }],
    });

    const { createDefiantJazz } = await import("../index.js");
    const dj = createDefiantJazz();

    await dj("hello", "dylan");
    const genericCall = anthropicCreate.mock.calls[0];

    await dj.dylan("hello");
    const methodCall = anthropicCreate.mock.calls[1];

    expect(genericCall).toEqual(methodCall);
  });
});

describe("empty responses", () => {
  it("throws instead of returning an empty string when Anthropic returns no text block", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    anthropicCreate.mockResolvedValue({ content: [], stop_reason: "end_turn" });

    const { createDefiantJazz } = await import("../index.js");
    const dj = createDefiantJazz();

    await expect(dj.dylan("hello")).rejects.toThrow(/no text content/);
  });
});

describe("configure() / default instance", () => {
  it("updates the shared default instance and clears its cached client", async () => {
    anthropicCreate.mockResolvedValue({
      content: [{ type: "text", text: "mocked" }],
    });

    const { configure, refine } = await import("../index.js");
    configure({ provider: "anthropic", apiKey: "sk-ant-configured" });

    const result = await refine.dylan("hello");
    expect(result.text).toBe("mocked");
  });
});

describe("lore toggle", () => {
  it("includes lore by default", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    anthropicCreate.mockResolvedValue({
      content: [{ type: "text", text: "mocked" }],
    });

    const { createDefiantJazz } = await import("../index.js");
    const dj = createDefiantJazz();
    await dj.dylan("hello");

    const systemPrompt = anthropicCreate.mock.calls[0][0].system;
    expect(systemPrompt).toMatch(/break room/);
  });

  it("omits lore when { lore: false } is passed per-call", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    anthropicCreate.mockResolvedValue({
      content: [{ type: "text", text: "mocked" }],
    });

    const { createDefiantJazz } = await import("../index.js");
    const dj = createDefiantJazz();
    await dj.dylan("hello", { lore: false });

    const systemPrompt = anthropicCreate.mock.calls[0][0].system;
    expect(systemPrompt).not.toMatch(/break room/);
  });

  it("omits lore instance-wide when createDefiantJazz({ lore: false }) is used", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    anthropicCreate.mockResolvedValue({
      content: [{ type: "text", text: "mocked" }],
    });

    const { createDefiantJazz } = await import("../index.js");
    const dj = createDefiantJazz({ lore: false });
    await dj.dylan("hello");

    const systemPrompt = anthropicCreate.mock.calls[0][0].system;
    expect(systemPrompt).not.toMatch(/break room/);
  });

  it("lets a per-call { lore: true } override an instance-level lore: false", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    anthropicCreate.mockResolvedValue({
      content: [{ type: "text", text: "mocked" }],
    });

    const { createDefiantJazz } = await import("../index.js");
    const dj = createDefiantJazz({ lore: false });
    await dj.dylan("hello", { lore: true });

    const systemPrompt = anthropicCreate.mock.calls[0][0].system;
    expect(systemPrompt).toMatch(/break room/);
  });

  it("respects the toggle on the OpenAI path too", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    openaiCreate.mockResolvedValue({
      choices: [{ message: { content: "mocked openai" } }],
    });

    const { createDefiantJazz } = await import("../index.js");

    const withLore = createDefiantJazz();
    await withLore.dylan("hello");
    const loreSystemMessage = openaiCreate.mock.calls[0][0].messages[0].content;
    expect(loreSystemMessage).toMatch(/break room/);

    const withoutLore = createDefiantJazz({ lore: false });
    await withoutLore.dylan("hello");
    const plainSystemMessage = openaiCreate.mock.calls[1][0].messages[0].content;
    expect(plainSystemMessage).not.toMatch(/break room/);
  });
});

describe("effort", () => {
  it("omits output_config when effort is not set", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    anthropicCreate.mockResolvedValue({
      content: [{ type: "text", text: "mocked" }],
    });

    const { createDefiantJazz } = await import("../index.js");
    const dj = createDefiantJazz();
    await dj.dylan("hello");

    expect(anthropicCreate.mock.calls[0][0]).not.toHaveProperty("output_config");
  });

  it("sends an instance-level effort as output_config.effort", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    anthropicCreate.mockResolvedValue({
      content: [{ type: "text", text: "mocked" }],
    });

    const { createDefiantJazz } = await import("../index.js");
    const dj = createDefiantJazz({ effort: "low" });
    await dj.dylan("hello");

    expect(anthropicCreate.mock.calls[0][0].output_config).toEqual({ effort: "low" });
  });

  it("lets a per-call effort override the instance-level setting", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    anthropicCreate.mockResolvedValue({
      content: [{ type: "text", text: "mocked" }],
    });

    const { createDefiantJazz } = await import("../index.js");
    const dj = createDefiantJazz({ effort: "low" });
    await dj.dylan("hello", { effort: "high" });

    expect(anthropicCreate.mock.calls[0][0].output_config).toEqual({ effort: "high" });
  });

  it("throws on the OpenAI provider instead of silently ignoring effort", async () => {
    process.env.OPENAI_API_KEY = "sk-test";

    const { createDefiantJazz } = await import("../index.js");

    await expect(createDefiantJazz({ effort: "low" }).dylan("hello")).rejects.toThrow(
      /only supported with the Anthropic provider/
    );
    await expect(createDefiantJazz().dylan("hello", { effort: "low" })).rejects.toThrow(
      /only supported with the Anthropic provider/
    );
    expect(openaiCreate).not.toHaveBeenCalled();
  });
});

describe("usage and model", () => {
  it("returns the model and normalized token usage from Anthropic", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    anthropicCreate.mockResolvedValue({
      model: "claude-sonnet-5",
      content: [{ type: "text", text: "mocked" }],
      usage: { input_tokens: 2770, output_tokens: 77 },
    });

    const { createDefiantJazz } = await import("../index.js");
    const result = await createDefiantJazz().dylan("hello");

    expect(result).toEqual({
      text: "mocked",
      character: "Dylan G.",
      model: "claude-sonnet-5",
      usage: { inputTokens: 2770, outputTokens: 77 },
    });
  });

  it("maps OpenAI's prompt/completion token names to the same shape", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    openaiCreate.mockResolvedValue({
      model: "gpt-4o-mini-2024-07-18",
      choices: [{ message: { content: "mocked openai" } }],
      usage: { prompt_tokens: 2500, completion_tokens: 60, total_tokens: 2560 },
    });

    const { createDefiantJazz } = await import("../index.js");
    const result = await createDefiantJazz().dylan("hello");

    expect(result.model).toBe("gpt-4o-mini-2024-07-18");
    expect(result.usage).toEqual({ inputTokens: 2500, outputTokens: 60 });
  });

  it("leaves usage undefined when the provider doesn't report it", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    openaiCreate.mockResolvedValue({
      model: "gpt-4o-mini",
      choices: [{ message: { content: "mocked openai" } }],
    });

    const { createDefiantJazz } = await import("../index.js");
    const result = await createDefiantJazz().dylan("hello");

    expect(result.usage).toBeUndefined();
  });
});

describe("buildSystemPrompt", () => {
  it("includes character names regardless of the lore setting", async () => {
    const { buildSystemPrompt } = await import("../prompt.js");

    expect(buildSystemPrompt(true)).toMatch(/Mark S\./);
    expect(buildSystemPrompt(false)).toMatch(/Mark S\./);
  });

  it("only includes lore markers when lore is true", async () => {
    const { buildSystemPrompt } = await import("../prompt.js");

    expect(buildSystemPrompt(true)).toMatch(/break room/);
    expect(buildSystemPrompt(false)).not.toMatch(/break room/);
  });
});
