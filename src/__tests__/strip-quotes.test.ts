import { describe, expect, it } from "vitest";
import { stripWrappingQuotes } from "../strip-quotes.js";

describe("stripWrappingQuotes", () => {
  it("strips wrapping straight double quotes", () => {
    expect(stripWrappingQuotes('"I wanted to bring to your attention…"')).toBe(
      "I wanted to bring to your attention…"
    );
  });

  it("strips wrapping straight single quotes", () => {
    expect(stripWrappingQuotes("'Praise Kier, I suppose.'")).toBe("Praise Kier, I suppose.");
  });

  it("strips wrapping curly double quotes", () => {
    expect(stripWrappingQuotes("“How fare your blossoms?”")).toBe(
      "How fare your blossoms?"
    );
  });

  it("strips wrapping curly single quotes", () => {
    expect(stripWrappingQuotes("‘Let’s not.’")).toBe("Let’s not.");
  });

  it("strips around surrounding whitespace and trims the result", () => {
    expect(stripWrappingQuotes('\n  " Yeah, so... that\'s a thing. "  \n')).toBe(
      "Yeah, so... that's a thing."
    );
  });

  it("strips only one pair", () => {
    expect(stripWrappingQuotes("\"'nested'\"")).toBe("'nested'");
  });

  it("leaves unmatched quotes alone", () => {
    for (const text of [
      '"Opening quote only',
      'Closing quote only"',
      "“Mismatched straight close\"",
      "\"Mismatched curly close”",
      "'Single then double\"",
      "”Backwards curly“",
    ]) {
      expect(stripWrappingQuotes(text)).toBe(text);
    }
  });

  it("preserves quotes inside the text", () => {
    const text = 'As Kier said, "the remembered man does not decay," and I believe it.';
    expect(stripWrappingQuotes(text)).toBe(text);
  });

  it("preserves inner quotes when stripping the wrapping pair", () => {
    expect(stripWrappingQuotes("\"He told me 'the numbers are scary' and walked off.\"")).toBe(
      "He told me 'the numbers are scary' and walked off."
    );
    expect(stripWrappingQuotes("“He said “no” and left.”")).toBe(
      "He said “no” and left."
    );
  });

  it("does not strip when the first and last quotes belong to separate spans", () => {
    for (const text of [
      '"Fine," he said, "whatever."',
      "“Fine,” he said, “whatever.”",
      "'Fine,' he said, 'whatever.'",
    ]) {
      expect(stripWrappingQuotes(text)).toBe(text);
    }
  });

  it("treats apostrophes as letters, not quotes", () => {
    expect(stripWrappingQuotes("'I can't, and I won't.'")).toBe("I can't, and I won't.");
  });

  it("returns already-clean text unchanged", () => {
    for (const text of [
      "Keep it up and you're getting a one-way ticket to the break room, genius.",
      "  Leading and trailing whitespace stays as the model sent it.\n",
      "",
      '"',
      '""',
    ]) {
      expect(stripWrappingQuotes(text)).toBe(text);
    }
  });
});
